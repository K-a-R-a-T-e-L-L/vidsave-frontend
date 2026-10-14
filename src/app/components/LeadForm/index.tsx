'use client';
import { Alert, Button, Checkbox, Stack, Group, TextInput, Textarea, Text } from '@mantine/core';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContactData } from '@/app/components/CmsContent';

export default function LeadForm() {
  const { settings, contactData } = useContactData();
  const pathname = usePathname();
  const [config, setConfig] = useState<{ enabled: boolean; policyVersion: string; consentText: string } | null>(() => ({
    enabled: settings.privacyPublished,
    policyVersion: settings.policyVersion,
    consentText: settings.consentText,
  }));
  const [name, setName] = useState(''),
    [phone, setPhone] = useState(''),
    [message, setMessage] = useState(''),
    [website, setWebsite] = useState(''),
    [consent, setConsent] = useState(false),
    [saving, setSaving] = useState(false),
    [result, setResult] = useState(''),
    [error, setError] = useState('');
  const key = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/leads', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (active) setConfig(c);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!config?.enabled || !consent || saving) return;
    setSaving(true);
    setError('');
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          message,
          website,
          consent,
          policyVersion: config.policyVersion,
          requestKey: key.current,
          source: pathname,
          sourceUrl: pathname,
        }),
      });
      const data = await response.json();
      if (response.status === 201 && data.accepted === true) {
        setResult('Заявка сохранена. Свяжемся с вами по указанному телефону.');
      } else
        setError(
          response.status === 429
            ? 'Слишком много обращений. Попробуйте позже.'
            : response.status === 409
              ? 'Текст согласия изменился. Обновите страницу и ознакомьтесь с ним.'
              : 'Не удалось сохранить заявку. Попробуйте позже или свяжитесь напрямую.',
        );
    } catch {
      setError('Сервис временно недоступен. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  }
  if (!config?.enabled)
    return (
      <Stack gap="sm">
        <Text>Расскажите об объекте — поможем выбрать оборудование и обсудим стоимость монтажа.</Text>
        <Group>
          <Button component="a" href={contactData.phoneHref}>
            Позвонить {contactData.phoneLabel}
          </Button>
          <Button component="a" href={`mailto:${settings.email}`} variant="default">
            Написать на почту
          </Button>
          {settings.telegram && (
            <Button component="a" href={settings.telegram} variant="light" target="_blank" rel="noopener noreferrer">
              Обсудить в Telegram
            </Button>
          )}
        </Group>
      </Stack>
    );
  if (result)
    return (
      <Alert color="green" role="status">
        {result}
      </Alert>
    );
  return (
    <form onSubmit={submit} aria-label="Форма заявки">
      <Stack gap="md">
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        <TextInput
          label="Ваше имя"
          required
          autoComplete="name"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          disabled={saving}
        />
        <TextInput
          label="Телефон для связи"
          type="tel"
          autoComplete="tel"
          required
          maxLength={40}
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          disabled={saving}
        />
        <Textarea
          label="О вашей задаче"
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          disabled={saving}
        />
        <input
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.currentTarget.value)}
          style={{ position: 'absolute', left: -10000 }}
        />
        <Checkbox
          label={
            <>
              Даю согласие на обработку персональных данных для ответа на заявку.{' '}
              <Link href="/consent" target="_blank">
                Согласие
              </Link>
              {' · '}
              <Link href="/privacy" target="_blank">
                Политика обработки данных
              </Link>
            </>
          }
          checked={consent}
          onChange={(e) => setConsent(e.currentTarget.checked)}
          required
          disabled={saving}
        />
        <Button type="submit" loading={saving} disabled={!consent}>
          Отправить заявку
        </Button>
      </Stack>
    </form>
  );
}
