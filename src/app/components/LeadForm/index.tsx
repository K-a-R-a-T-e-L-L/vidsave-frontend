'use client';
import { Alert, Button, Checkbox, Stack, Autocomplete, Select, TextInput, Textarea, Text } from '@mantine/core';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { IconCheck, IconChevronDown, IconMapPin, IconPhone } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContactData } from '@/app/components/CmsContent';
import { serviceCities } from '@/app/lib/service-area';
import styles from './styles.module.scss';
import { cityServices, useCityEnquiry } from '../CityEnquiry';

const contactMethods = [
  { value: 'phone', label: 'Звонок по телефону', placeholder: '' },
  { value: 'telegram', label: 'Telegram', placeholder: '@username или номер телефона' },
  { value: 'max', label: 'MAX', placeholder: 'Номер телефона или ссылка на профиль' },
  { value: 'vk', label: 'VK', placeholder: 'Ссылка на профиль или ID' },
  { value: 'instagram', label: 'Instagram', placeholder: '@username или ссылка на профиль' },
];
const menuClasses = { dropdown: styles.dropdown, option: styles.option };
const menuProps = { offset: 5, transitionProps: { transition: 'fade' as const, duration: 100 } };

function ContactIcon({ method }: { method: string }) {
  return method !== 'phone' ? (
    <Image src={'/images/contact-methods/' + method + '.svg'} width={20} height={20} alt="" unoptimized />
  ) : (
    <IconPhone size={19} aria-hidden="true" />
  );
}

export default function LeadForm() {
  const { settings } = useContactData();
  const pathname = usePathname();
  const enquiry = useCityEnquiry();
  const [city, setCity] = useState(enquiry?.city ?? '');
  const [generalService, setGeneralService] = useState<keyof typeof cityServices | ''>('');
  const service = enquiry?.service ?? generalService;
  const selectService = enquiry?.select ?? setGeneralService;
  const [contactMethod, setContactMethod] = useState(contactMethods[0]);
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [otherService, setOtherService] = useState('');
  const [serviceError, setServiceError] = useState(false);
  const [roomArea, setRoomArea] = useState('');
  const [model, setModel] = useState('');
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
  const details = [
    city.trim() && 'Город: ' + city.trim(),
    service && 'Услуга: ' + cityServices[service],
    service === 'other' && otherService.trim() && 'Какая услуга нужна: ' + otherService.trim(),
    service === 'purchase' && roomArea.trim() && 'Площадь помещения: ' + roomArea.trim() + ' м²',
    service === 'installation' && model.trim() && 'Модель кондиционера: ' + model.trim(),
    'Способ связи: ' + contactMethod.label,
    contactMethod.value !== 'phone' && contactMethod.label + ': ' + (contacts[contactMethod.value] ?? '').trim(),
  ]
    .filter(Boolean)
    .join('\n');
  const messageLimit = 2000 - details.length - 1;
  const messageTooLong = message.trim().length > messageLimit;
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
    if (!config?.enabled || !consent || saving || messageTooLong) return;
    if (enquiry && !service) {
      setServiceError(true);
      return;
    }
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
          message: [details, message.trim()].filter(Boolean).join('\n'),
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
        setResult('Заявка сохранена. Свяжемся с вами выбранным способом.');
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
  if (result)
    return (
      <Alert color="green" role="status">
        {result}
      </Alert>
    );
  return (
    <form onSubmit={submit} aria-label="Форма заявки">
      {enquiry &&
        Object.keys(cityServices).map((service) => (
          <span key={service} id={'request-' + service} aria-hidden="true" style={{ display: 'block' }} />
        ))}
      <Stack gap="md">
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        <div className={styles.pair}>
          <Autocomplete
            label="Город объекта"
            value={city}
            onChange={setCity}
            data={serviceCities.map(({ name }) => name)}
            placeholder="Выберите или введите город"
            maxLength={100}
            leftSection={<IconMapPin size={18} aria-hidden="true" />}
            leftSectionPointerEvents="none"
            maxDropdownHeight={225}
            autoComplete="off"
            classNames={menuClasses}
            comboboxProps={menuProps}
            disabled={saving}
          />
          <Select
            label="Услуга"
            placeholder="Выберите услугу"
            required={Boolean(enquiry)}
            error={serviceError && !service ? 'Выберите услугу' : undefined}
            value={service || null}
            onChange={(value) => {
              selectService(value && Object.hasOwn(cityServices, value) ? (value as keyof typeof cityServices) : '');
              setServiceError(false);
            }}
            allowDeselect={!enquiry}
            data={Object.entries(cityServices).map(([value, label]) => ({ value, label }))}
            rightSection={<IconChevronDown size={16} aria-hidden="true" />}
            rightSectionPointerEvents="none"
            classNames={menuClasses}
            comboboxProps={menuProps}
            disabled={saving}
          />
        </div>
        {service === 'other' && (
          <TextInput
            label="Какая услуга нужна?"
            placeholder="Кратко опишите работу"
            required
            pattern=".*\S.*"
            maxLength={150}
            value={otherService}
            onChange={(e) => setOtherService(e.currentTarget.value)}
            disabled={saving}
          />
        )}
        {service === 'purchase' && (
          <TextInput
            label="Площадь помещения, м²"
            inputMode="decimal"
            placeholder="Если известна"
            maxLength={20}
            value={roomArea}
            onChange={(e) => setRoomArea(e.currentTarget.value)}
            disabled={saving}
          />
        )}
        {service === 'installation' && (
          <TextInput
            label="Модель вашего кондиционера"
            placeholder="Если известна"
            maxLength={100}
            value={model}
            onChange={(e) => setModel(e.currentTarget.value)}
            disabled={saving}
          />
        )}
        <div className={styles.pair}>
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
        </div>
        <div className={styles.pair}>
          <Select
            label="Как с вами связаться?"
            value={contactMethod.value}
            allowDeselect={false}
            data={contactMethods}
            onChange={(value) => {
              const method = contactMethods.find((method) => method.value === value);
              if (method) setContactMethod(method);
            }}
            leftSection={<ContactIcon method={contactMethod.value} />}
            leftSectionPointerEvents="none"
            rightSection={<IconChevronDown size={16} aria-hidden="true" />}
            rightSectionPointerEvents="none"
            classNames={menuClasses}
            comboboxProps={menuProps}
            disabled={saving}
            renderOption={({ option, checked }) => (
              <div className={styles.contactOption}>
                <ContactIcon method={option.value} />
                <span>{option.label}</span>
                {checked && <IconCheck size={16} aria-hidden="true" />}
              </div>
            )}
          />
          {contactMethod.value !== 'phone' && (
            <TextInput
              label={'Ваш ' + contactMethod.label}
              placeholder={contactMethod.placeholder}
              required
              pattern=".*\S.*"
              maxLength={150}
              value={contacts[contactMethod.value] ?? ''}
              onChange={(e) => setContacts({ ...contacts, [contactMethod.value]: e.currentTarget.value })}
              disabled={saving}
            />
          )}
        </div>
        <Textarea
          label="О вашей задаче"
          maxLength={messageLimit}
          error={
            messageTooLong ? 'Сократите описание на ' + (message.trim().length - messageLimit) + ' симв.' : undefined
          }
          placeholder={enquiry ? 'Адрес объекта и что нужно сделать' : undefined}
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
        {!config?.enabled && (
          <Text size="sm" c="dimmed" role="status">
            Онлайн-отправка временно недоступна. Свяжитесь с нами по телефону или почте.
          </Text>
        )}
        <Button type="submit" loading={saving} disabled={!consent || !config?.enabled || messageTooLong}>
          Отправить заявку
        </Button>
      </Stack>
    </form>
  );
}
