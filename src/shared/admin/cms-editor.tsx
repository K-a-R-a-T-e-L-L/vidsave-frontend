'use client';
import {
  Alert,
  Button,
  Group,
  Image,
  Modal,
  MultiSelect,
  NumberInput,
  PasswordInput,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { contentSlug } from './content-slug';
import { cmsRequest } from './cms-client';
import { MediaPicker } from './media-picker';
import { RichEditor } from './rich-editor';
import { RichContent } from '@/app/components/RichContent';
import type { RichNode } from '@/app/lib/cms-types';

export type Resource =
  | 'services'
  | 'service-categories'
  | 'posts'
  | 'blog-categories'
  | 'projects'
  | 'settings'
  | 'leads'
  | 'admins';
export const resourceRoutes: Record<Resource, string> = {
  services: 'services',
  'service-categories': 'service-categories',
  posts: 'blog',
  'blog-categories': 'blog-categories',
  projects: 'projects',
  settings: 'settings',
  leads: 'leads',
  admins: 'admins',
};
export function apiFor(resource: Resource) {
  return resource === 'services'
    ? '/api/admin/services'
    : resource === 'service-categories'
      ? '/api/admin/service-categories'
      : resource === 'admins'
        ? '/api/admin/admins'
        : '/api/admin/cms/' + (resource === 'settings' ? 'contacts' : resource);
}
const labels: Record<Resource, string> = {
  services: 'Услуга',
  'service-categories': 'Категория услуг',
  posts: 'Статья',
  'blog-categories': 'Категория блога',
  projects: 'Проект',
  settings: 'Контактные данные',
  leads: 'Заявка',
  admins: 'Администратор',
};
type FormData = Record<string, unknown>;
type Field = {
  name: string;
  label: string;
  kind?: 'text' | 'area' | 'number' | 'password' | 'select';
  choices?: { value: string; label: string }[];
  required?: boolean;
};
const publication = [
  { value: 'draft', label: 'Черновик' },
  { value: 'published', label: 'Опубликовано' },
  { value: 'archived', label: 'Скрыто с сайта' },
];
const contentFields: Field[] = [
  { name: 'title', label: 'Заголовок', required: true },
  { name: 'excerpt', label: 'Краткое описание', kind: 'area' },
];
const serviceFields: Field[] = [
  { name: 'name', label: 'Название', required: true },
  { name: 'description', label: 'Описание', kind: 'area', required: true },
  { name: 'details', label: 'Дополнительные сведения', kind: 'area' },
  {
    name: 'priceMode',
    label: 'Режим цены',
    kind: 'select',
    choices: [
      { value: 'from', label: 'От суммы' },
      { value: 'fixed', label: 'Фиксированная' },
      { value: 'on_request', label: 'По запросу' },
    ],
  },
  { name: 'priceRub', label: 'Цена, ₽' },
  { name: 'unitLabel', label: 'Единица измерения' },
  { name: 'sortOrder', label: 'Порядок', kind: 'number' },
];
const settingsFields: Field[] = [
  ['phone', 'Основной телефон'],
  ['additionalPhone', 'Дополнительный телефон'],
  ['email', 'Основная почта'],
  ['additionalEmail', 'Дополнительная почта'],
  ['address', 'Адрес'],
  ['geography', 'География обслуживания'],
  ['hours', 'Часы связи'],
  ['telegram', 'Telegram'],
  ['vk', 'ВКонтакте'],
  ['avito', 'Авито'],
].map(([name, label]) => ({ name, label }));
const emptyDoc: RichNode = { type: 'doc', content: [{ type: 'paragraph' }] };
function initial(resource: Resource): FormData {
  return resource === 'services'
    ? {
        name: '',
        slug: '',
        description: '',
        details: '',
        categoryId: '',
        priceMode: 'from',
        priceRub: '',
        unitLabel: 'шт',
        sortOrder: 0,
        status: 'draft',
        mediaId: null,
        seoTitle: '',
        seoDescription: '',
      }
    : resource === 'service-categories'
      ? { name: '', slug: '', description: '', sortOrder: 0, status: 'published', seoTitle: '', seoDescription: '' }
      : resource === 'admins'
        ? { email: '', password: '' }
        : {
            title: '',
            slug: '',
            excerpt: '',
            status: 'draft',
            seoTitle: '',
            seoDescription: '',
            coverId: null,
            ogImageId: null,
            body: emptyDoc,
            categoryIds: [],
            galleryIds: [],
            serviceIds: [],
            objectType: '',
            task: '',
            solution: '',
            result: '',
            sortOrder: 0,
          };
}

export function CmsEditor({ resource, id }: { resource: Resource; id?: string }) {
  const [form, setForm] = useState<FormData>(initial(resource)),
    [loading, setLoading] = useState(!!id || resource === 'settings'),
    [error, setError] = useState(''),
    [loadError, setLoadError] = useState(false),
    [loadVersion, setLoadVersion] = useState(0),
    [saving, setSaving] = useState(false),
    [pendingUploads, setPendingUploads] = useState(0),
    [dirty, setDirty] = useState(false),
    [preview, setPreview] = useState(false),
    [leave, setLeave] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]),
    [services, setServices] = useState<{ value: string; label: string }[]>([]);
  const router = useRouter();
  useEffect(() => {
    let active = true;
    if (id || resource === 'settings')
      cmsRequest<FormData>(apiFor(resource) + (id ? '/' + id : ''))
        .then((data) => {
          if (active)
            setForm((previous) => ({
              ...previous,
              ...data,
              ...(resource === 'services'
                ? { categoryId: (data.category as { id?: string })?.id ?? data.categoryId }
                : {}),
            }));
        })
        .catch((e) => {
          if (active) {
            setError(e.message);
            setLoadError(true);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });

    if (resource === 'services')
      cmsRequest<{ items: { id: string; name: string }[] }>('/api/admin/service-categories')
        .then((data) => setCategories(data.items.map((c) => ({ value: c.id, label: c.name }))))
        .catch((e) => setError(e.message));
    if (resource === 'posts')
      cmsRequest<{ items: { id: string; title: string }[] }>('/api/admin/cms/blog-categories?limit=50')
        .then((data) => setCategories(data.items.map((c) => ({ value: c.id, label: c.title }))))
        .catch((e) => setError(e.message));
    if (resource === 'projects')
      cmsRequest<{ items: { id: string; name: string }[] }>('/api/admin/services?limit=100')
        .then((data) => setServices(data.items.map((c) => ({ value: c.id, label: c.name }))))
        .catch((e) => setError(e.message));
    return () => {
      active = false;
    };
  }, [resource, id, loadVersion]);
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const click = (e: MouseEvent) => {
      const link = (e.target as Element).closest('a');
      if (!link || link.target === '_blank' || link.origin !== location.origin || link.href === location.href) return;
      e.preventDefault();
      e.stopPropagation();
      setLeave(link.pathname + link.search);
    };
    window.addEventListener('beforeunload', unload);
    window.document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      window.document.removeEventListener('click', click, true);
    };
  }, [dirty]);
  const uploadState = (busy: boolean) => {
    setPendingUploads((n) => Math.max(0, n + (busy ? 1 : -1)));
    if (busy) setDirty(true);
  };
  const set = (name: string, value: unknown) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setDirty(true);
  };

  let fields: Field[] =
    resource === 'services'
      ? serviceFields
      : resource === 'service-categories'
        ? [
            { name: 'name', label: 'Название', required: true },
            { name: 'description', label: 'Описание', kind: 'area' },
            { name: 'sortOrder', label: 'Порядок', kind: 'number' },
          ]
        : resource === 'settings'
          ? settingsFields
          : resource === 'admins'
            ? [
                { name: 'email', label: 'Email', required: true },
                { name: 'password', label: 'Пароль', kind: 'password', required: true },
              ]
            : resource === 'leads'
              ? [{ name: 'note', label: 'Внутренняя заметка', kind: 'area' }]
              : contentFields;
  if (resource === 'projects')
    fields = [
      ...fields,
      { name: 'objectType', label: 'Тип объекта' },
      { name: 'task', label: 'Задача', kind: 'area' },
      { name: 'solution', label: 'Выполненное решение', kind: 'area' },
      { name: 'result', label: 'Результат', kind: 'area' },
    ];
  if (resource === 'blog-categories') fields = [...fields, { name: 'sortOrder', label: 'Порядок', kind: 'number' }];
  function payload(): FormData {
    const names = fields.map((field) => field.name);
    if (['services', 'service-categories', 'posts', 'projects', 'blog-categories'].includes(resource))
      names.push('slug');
    if (resource === 'settings') names.push('latitude', 'longitude');
    else if (resource === 'services') names.push('categoryId', 'status', 'mediaId');
    else if (resource === 'service-categories') names.push('status');
    else if (resource === 'leads') names.push('status');
    else if (resource === 'posts') names.push('status', 'coverId', 'body', 'categoryIds');
    else if (resource === 'projects') names.push('status', 'coverId', 'galleryIds', 'serviceIds');
    else if (resource === 'blog-categories') names.push('status', 'coverId');
    const result: FormData = Object.fromEntries(
      names.map((name) => [name, form[name] ?? (['sortOrder', 'latitude', 'longitude'].includes(name) ? 0 : '')]),
    );
    for (const name of ['coverId', 'mediaId', 'ogImageId']) if (name in result) result[name] = result[name] || null;
    for (const name of ['seoTitle', 'seoDescription'])
      if (name in result && resource !== 'settings') result[name] = result[name] || null;
    if (resource === 'services' && result.priceMode === 'on_request') result.priceRub = null;
    if ('slug' in result && !result.slug)
      result.slug = contentSlug(String(form.title || form.name || ''), crypto.randomUUID());
    return result;
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (pendingUploads) return;
    setSaving(true);
    setError('');
    try {
      const data = await cmsRequest<FormData>(
        apiFor(resource) + (id ? '/' + id : ''),
        id || resource === 'settings' ? 'PATCH' : 'POST',
        payload(),
      );
      setDirty(false);
      setForm((previous) => ({
        ...previous,
        ...data,
        ...(resource === 'services' ? { categoryId: (data.category as { id?: string })?.id ?? data.categoryId } : {}),
      }));
      notifications.show({ title: 'Изменения сохранены', message: 'Данные успешно записаны.', color: 'green' });
      if (!id && resource !== 'settings')
        router.push('/admin/' + resourceRoutes[resource] + (resource === 'admins' ? '' : '/' + String(data.id)));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  if (loadError)
    return (
      <Stack className="admin-panel">
        <Title order={1}>Не удалось загрузить запись</Title>
        <Alert color="red">{error}</Alert>
        <Button
          onClick={() => {
            setLoading(true);
            setLoadError(false);
            setError('');
            setLoadVersion((v) => v + 1);
          }}
        >
          Повторить загрузку
        </Button>
      </Stack>
    );
  if (loading)
    return (
      <Stack className="admin-panel">
        <Skeleton height={36} />
        <Skeleton height={320} />
      </Stack>
    );
  return (
    <Stack className="admin-panel">
      <Group justify="space-between">
        <Title order={1}>
          {resource === 'settings'
            ? labels[resource]
            : `${id ? 'Редактирование' : 'Создание'}: ${labels[resource].toLowerCase()}`}
        </Title>
        <Link href={'/admin/' + resourceRoutes[resource]}>К списку</Link>
      </Group>
      {error && (
        <Alert color="red" role="alert">
          {error}
        </Alert>
      )}
      <form onSubmit={save} className="admin-editor">
        <Stack gap="lg">
          {resource === 'leads' && (
            <>
              <Title order={2}>{String(form.name ?? '')}</Title>
              <Text>{String(form.phone ?? '')}</Text>
              <Text>{String(form.message ?? '')}</Text>
              <Text c="dimmed">
                Источник: {String(form.sourceUrl ?? '')} · Уведомление:{' '}
                {(
                  {
                    pending: 'Ожидает отправки',
                    processing: 'Отправляется',
                    sent: 'Отправлено',
                    failed: 'Ошибка доставки',
                    disabled: 'Не настроено',
                  } as Record<string, string>
                )[String(form.notificationStatus)] ?? 'Не настроено'}
              </Text>
            </>
          )}
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {fields.map((field) => {
              const common = {
                label: field.label,
                required: field.required,
                disabled: saving || (field.name === 'priceRub' && form.priceMode === 'on_request'),
              };
              const value = String(form[field.name] ?? '');
              return field.kind === 'area' ? (
                <Textarea
                  key={field.name}
                  {...common}
                  value={value}
                  autosize
                  minRows={3}
                  maxRows={10}
                  onChange={(e) => set(field.name, e.currentTarget.value)}
                />
              ) : field.kind === 'number' ? (
                <NumberInput
                  key={field.name}
                  {...common}
                  min={0}
                  value={Number(form[field.name] ?? 0)}
                  onChange={(v) => set(field.name, Number(v))}
                />
              ) : field.kind === 'select' ? (
                <Select
                  key={field.name}
                  {...common}
                  data={field.choices}
                  value={value}
                  onChange={(v) => set(field.name, v)}
                />
              ) : field.kind === 'password' ? (
                <PasswordInput
                  key={field.name}
                  {...common}
                  minLength={8}
                  autoComplete="new-password"
                  description="Не менее 8 символов; сервер также проверяет длину в байтах."
                  value={value}
                  onChange={(e) => set(field.name, e.currentTarget.value)}
                />
              ) : (
                <TextInput
                  key={field.name}
                  {...common}
                  value={value}
                  type={field.name === 'email' ? 'email' : 'text'}
                  onChange={(e) => set(field.name, e.currentTarget.value)}
                />
              );
            })}
          </SimpleGrid>
          {['services', 'service-categories', 'posts', 'projects', 'blog-categories'].includes(resource) && (
            <Text size="sm" c="dimmed">
              Адрес страницы создаётся автоматически и сохраняется при переименовании.
            </Text>
          )}
          {resource === 'services' && (
            <>
              <Select
                label="Категория"
                required
                searchable
                data={categories}
                value={String(form.categoryId ?? (form.category as { id?: string })?.id ?? '')}
                onChange={(v) => set('categoryId', v)}
              />
              <MediaPicker
                onUploadingChange={uploadState}
                label="Изображение услуги"
                value={form.mediaId as string | null}
                onChange={(v) => set('mediaId', v)}
              />
              {!form.mediaId && typeof form.imagePath === 'string' && (
                <Text size="sm" c="dimmed">
                  Сохраняется существующее изображение услуги.
                </Text>
              )}
            </>
          )}
          {['posts', 'projects', 'blog-categories'].includes(resource) && (
            <>
              <MediaPicker
                onUploadingChange={uploadState}
                label="Обложка для карточки и страницы"
                value={form.coverId as string | null}
                onChange={(v) => set('coverId', v)}
              />
            </>
          )}
          {resource === 'posts' && (
            <>
              <MultiSelect
                label="Категории статьи"
                searchable
                data={categories}
                value={(form.categoryIds as string[]) ?? []}
                onChange={(v) => set('categoryIds', v)}
              />
              <RichEditor
                onUploadingChange={uploadState}
                label="Содержимое статьи"
                value={(form.body as RichNode) ?? emptyDoc}
                onChange={(v) => set('body', v)}
              />
            </>
          )}
          {resource === 'projects' && (
            <>
              <MediaPicker
                onUploadingChange={uploadState}
                multiple
                label="Галерея проекта"
                value={(form.galleryIds as string[]) ?? []}
                onChange={(v) => set('galleryIds', v)}
              />
              <MultiSelect
                label="Связанные услуги"
                data={services}
                searchable
                value={(form.serviceIds as string[]) ?? []}
                onChange={(v) => set('serviceIds', v)}
              />
            </>
          )}
          {resource === 'settings' && (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <NumberInput
                  label="Широта карты"
                  value={Number(form.latitude)}
                  onChange={(v) => set('latitude', Number(v))}
                />
                <NumberInput
                  label="Долгота карты"
                  value={Number(form.longitude)}
                  onChange={(v) => set('longitude', Number(v))}
                />
              </SimpleGrid>
            </>
          )}
          {!['settings', 'admins'].includes(resource) && (
            <Select
              label={resource === 'leads' ? 'Статус' : 'Видимость на сайте'}
              data={
                resource === 'services'
                  ? [...publication, { value: 'hidden', label: 'Скрыта' }]
                  : resource === 'service-categories'
                    ? [
                        { value: 'published', label: 'Опубликована' },
                        { value: 'hidden', label: 'Скрыта' },
                      ]
                    : resource === 'leads'
                      ? [
                          { value: 'new', label: 'Новая' },
                          { value: 'in_progress', label: 'В работе' },
                          { value: 'completed', label: 'Завершена' },
                          { value: 'spam', label: 'Спам' },
                        ]
                      : publication
              }
              value={String(form.status ?? 'draft')}
              onChange={(v) => set('status', v)}
            />
          )}
          <Group>
            <Button
              type="submit"
              loading={saving}
              disabled={pendingUploads > 0 || (resource === 'services' && !categories.length)}
            >
              Сохранить
            </Button>
            {['posts', 'projects'].includes(resource) && (
              <Button variant="light" onClick={() => setPreview(true)}>
                Предпросмотр
              </Button>
            )}
            {id && form.status === 'published' && ['services', 'posts', 'projects'].includes(resource) && (
              <Link href={`/${resource === 'posts' ? 'blog' : resource}/${String(form.slug)}`} target="_blank">
                Открыть публичную страницу
              </Link>
            )}
            {dirty && (
              <Text size="sm" c="dimmed">
                Есть несохранённые изменения
              </Text>
            )}
          </Group>
        </Stack>
      </form>
      <Modal opened={preview} onClose={() => setPreview(false)} title="Предпросмотр" size="xl">
        {typeof form.coverId === 'string' && form.coverId && (
          <Image
            src={'/api/admin/cms/media/' + form.coverId + '/file'}
            alt="Обложка материала"
            radius="md"
            mb="lg"
            mah={320}
            fit="cover"
          />
        )}
        <Title order={2}>{String(form.title ?? form.name ?? '')}</Title>
        <Text>{String(form.excerpt ?? '')}</Text>
        {resource === 'posts' ? (
          <RichContent document={(form.body as RichNode) ?? emptyDoc} privateMedia />
        ) : (
          <Stack>
            {['task', 'solution', 'result'].map((name) => (
              <Text key={name}>{String(form[name] ?? '')}</Text>
            ))}
          </Stack>
        )}
      </Modal>
      <Modal opened={!!leave} onClose={() => setLeave(null)} title="Есть несохранённые изменения">
        <Text>Покинуть страницу и потерять изменения?</Text>
        <Group mt="md">
          <Button variant="default" onClick={() => setLeave(null)}>
            Остаться
          </Button>
          <Button
            color="red"
            className="admin-danger-button"
            onClick={() => {
              const target = leave;
              setDirty(false);
              setLeave(null);
              if (target) router.push(target);
            }}
          >
            Покинуть страницу
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
