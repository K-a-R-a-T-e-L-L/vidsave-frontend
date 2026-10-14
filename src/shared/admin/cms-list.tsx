'use client';
import {
  Alert,
  Badge,
  Button,
  Group,
  Pagination,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Modal,
} from '@mantine/core';
import Link from 'next/link';
import { catalogServicePrice } from '@/app/lib/catalog-format';
import type { CatalogService } from '@/app/lib/catalog-types';
import { useEffect, useState } from 'react';
import { cmsRequest } from './cms-client';
import { apiFor, resourceRoutes, type Resource } from './cms-editor';
const names: Partial<Record<Resource, string>> = {
  services: 'Услуги',
  'service-categories': 'Категории услуг',
  posts: 'Статьи блога',
  'blog-categories': 'Категории блога',
  projects: 'Портфолио',
  leads: 'Заявки',
  admins: 'Администраторы',
};
export const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  published: 'Опубликовано',
  hidden: 'Скрыто',
  archived: 'В архиве',
  new: 'Новая',
  in_progress: 'В работе',
  completed: 'Завершена',
  spam: 'Спам',
  sent: 'Отправлено',
  pending: 'Ожидает отправки',
  processing: 'Отправляется',
  failed: 'Ошибка доставки',
  disabled: 'Не настроено',
};
export function CmsList({ resource }: { resource: Resource }) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState<string | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0),
    [remove, setRemove] = useState<string | null>(null),
    [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(page), limit: '30' });
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    cmsRequest<Record<string, unknown> | Record<string, unknown>[]>(apiFor(resource) + '?' + query)
      .then((result) => {
        if (!active) return;
        setError('');
        const rows = Array.isArray(result) ? result : (result.items as Record<string, unknown>[]);
        setItems(rows ?? []);
        setTotal(Array.isArray(result) ? result.length : Number(result.total ?? rows?.length ?? 0));
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [resource, page, search, status, version]);
  const local = ['service-categories', 'admins'].includes(resource);
  const visible = local
    ? items.filter(
        (item) =>
          String(item.title ?? item.name ?? item.email ?? (item.document as { title?: string })?.title ?? '')
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (!status || item.status === status),
      )
    : items;
  const rowTitle = (item: Record<string, unknown>) =>
    String(item.title ?? item.name ?? item.email ?? (item.document as { title?: string })?.title ?? 'Страница');
  const canCreate = !['pages', 'leads', 'settings'].includes(resource);
  const contentResource = ['services', 'service-categories', 'posts', 'projects', 'blog-categories'].includes(resource);
  async function toggleVisibility(item: Record<string, unknown>) {
    if (busy) return;
    const id = String(item.id);
    setBusy(id);
    setError('');
    try {
      const status =
        item.status === 'published'
          ? ['services', 'service-categories'].includes(resource)
            ? 'hidden'
            : 'archived'
          : 'published';
      let payload: Record<string, unknown> = { status };
      if (['posts', 'projects', 'blog-categories'].includes(resource)) {
        const current = await cmsRequest<Record<string, unknown>>(apiFor(resource) + '/' + id);
        const fields = [
          'title',
          'slug',
          'excerpt',
          'seoTitle',
          'seoDescription',
          'coverId',
          'ogImageId',
          ...(resource === 'posts'
            ? ['body', 'categoryIds']
            : resource === 'projects'
              ? ['objectType', 'task', 'solution', 'result', 'galleryIds', 'serviceIds']
              : ['sortOrder']),
        ];
        payload = {
          ...Object.fromEntries(fields.filter((key) => key in current).map((key) => [key, current[key]])),
          status,
        };
      }
      await cmsRequest(apiFor(resource) + '/' + id, 'PATCH', payload);
      setVersion((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }
  function visibilityButton(item: Record<string, unknown>) {
    return (
      contentResource && (
        <Button size="compact-sm" variant="light" disabled={!!busy} onClick={() => void toggleVisibility(item)}>
          {item.status === 'published' ? 'Скрыть' : 'Опубликовать'}
        </Button>
      )
    );
  }

  async function deleteRecord() {
    if (!remove) return;
    if (busy) return;
    setBusy(remove);
    try {
      await cmsRequest(apiFor(resource) + '/' + remove, 'DELETE');
      setRemove(null);
      setVersion((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
      setRemove(null);
    } finally {
      setBusy(null);
    }
  }
  return (
    <Stack className="admin-panel">
      <Group justify="space-between">
        <Title order={1}>{names[resource]}</Title>
        {canCreate && (
          <Button component={Link} href={'/admin/' + resourceRoutes[resource] + '/new'}>
            Создать
          </Button>
        )}
      </Group>
      <Group align="end">
        <TextInput
          label="Поиск"
          placeholder="Название или имя"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: 1, minWidth: 160 }}
        />
        {!['pages', 'admins'].includes(resource) && (
          <Select
            label="Статус"
            clearable
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            data={(resource === 'leads'
              ? ['new', 'in_progress', 'completed', 'spam']
              : resource === 'service-categories'
                ? ['published', 'hidden']
                : resource === 'services'
                  ? ['draft', 'published', 'hidden']
                  : ['draft', 'published', 'archived']
            ).map((value) => ({ value, label: statusLabels[value] }))}
          />
        )}
      </Group>
      {error && (
        <Alert color="red" className="admin-danger-button" role="alert">
          {error}
          <Button variant="subtle" onClick={() => setVersion((v) => v + 1)}>
            Повторить
          </Button>
        </Alert>
      )}
      {loading ? (
        <>
          <Skeleton height={50} />
          <Skeleton height={240} />
        </>
      ) : !visible.length ? (
        <Text c="dimmed">
          Записей пока нет. {canCreate ? 'Создайте первый материал.' : 'Измените фильтр или повторите запрос позже.'}
        </Text>
      ) : (
        <>
          <Table className="admin-table" highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Название</Table.Th>
                <Table.Th>Статус</Table.Th>
                <Table.Th>Данные</Table.Th>
                <Table.Th>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visible.map((item) => (
                <Table.Tr key={String(item.id)}>
                  <Table.Td style={{ maxWidth: 400, overflowWrap: 'anywhere' }}>{rowTitle(item)}</Table.Td>
                  <Table.Td>
                    {item.status ? (
                      <Badge variant="light">{statusLabels[String(item.status)] ?? 'Активен'}</Badge>
                    ) : (
                      <Text size="sm">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {resource === 'services'
                      ? catalogServicePrice(item as unknown as CatalogService)
                      : resource === 'leads'
                        ? String(item.phone ?? '')
                        : item.updatedAt
                          ? new Date(String(item.updatedAt)).toLocaleDateString('ru-RU')
                          : ''}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {resource !== 'admins' && (
                        <Button
                          size="compact-sm"
                          variant="light"
                          component={Link}
                          href={'/admin/' + resourceRoutes[resource] + '/' + String(item.id)}
                        >
                          {resource === 'leads' ? 'Открыть' : 'Редактировать'}
                        </Button>
                      )}
                      {visibilityButton(item)}
                      {contentResource && (
                        <Button
                          size="compact-sm"
                          variant="subtle"
                          color="red"
                          className="admin-danger-button"
                          onClick={() => setRemove(String(item.id))}
                        >
                          Удалить
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <SimpleGrid className="admin-cards" cols={1}>
            {visible.map((item) => (
              <Stack key={String(item.id)} p="md" className="admin-editor">
                <Text fw={700}>{rowTitle(item)}</Text>
                {!!item.status && <Badge variant="light">{statusLabels[String(item.status)] ?? 'Активен'}</Badge>}
                {resource !== 'admins' && (
                  <Button
                    variant="light"
                    component={Link}
                    href={'/admin/' + resourceRoutes[resource] + '/' + String(item.id)}
                  >
                    Открыть
                  </Button>
                )}
                {visibilityButton(item)}
                {contentResource && (
                  <Button
                    variant="subtle"
                    color="red"
                    className="admin-danger-button"
                    onClick={() => setRemove(String(item.id))}
                  >
                    Удалить
                  </Button>
                )}
              </Stack>
            ))}
          </SimpleGrid>
        </>
      )}
      {!local && total > 30 && <Pagination value={page} onChange={setPage} total={Math.ceil(total / 30)} />}
      <Modal opened={!!remove} onClose={() => setRemove(null)} title="Удаление записи">
        <Text>
          Удалить «{rowTitle(items.find((item) => item.id === remove) ?? {})}»? Это действие нельзя отменить. Если
          категория используется, сначала перенесите её материалы в другую категорию.
        </Text>
        <Group mt="md">
          <Button variant="default" onClick={() => setRemove(null)}>
            Отмена
          </Button>
          <Button color="red" className="admin-danger-button" loading={!!busy} onClick={deleteRecord}>
            Удалить
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
