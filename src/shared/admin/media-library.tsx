'use client';
import {
  Alert,
  Button,
  FileInput,
  Group,
  Image,
  Modal,
  Pagination,
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
import { useEffect, useState } from 'react';
import { cmsRequest } from './cms-client';
import type { MediaItem } from './media-picker';

export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [search, setSearch] = useState(''),
    [usage, setUsage] = useState<string | null>(null),
    [file, setFile] = useState<File | null>(null),
    [title, setTitle] = useState(''),
    [alt, setAlt] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [version, setVersion] = useState(0),
    [editing, setEditing] = useState<MediaItem | null>(null),
    [remove, setRemove] = useState<MediaItem | null>(null);
  useEffect(() => {
    let active = true;
    cmsRequest<{ items: MediaItem[]; total: number }>(
      `/api/admin/cms/media?search=${encodeURIComponent(search)}&page=${page}${usage ? '&status=' + usage : ''}`,
    )
      .then((r) => {
        if (active) {
          setItems(r.items);
          setTotal(r.total);
        }
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
  }, [search, page, usage, version]);
  async function upload() {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      setError('Допустимы JPEG, PNG, WebP и AVIF размером до 8 МБ.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const bytes = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await cmsRequest('/api/admin/cms/media', 'POST', { title: title || file.name, alt, mime: file.type, bytes });
      setFile(null);
      setTitle('');
      setAlt('');
      setVersion((v) => v + 1);
      notifications.show({
        title: 'Изображение загружено',
        message: 'Теперь его можно выбрать в редакторе.',
        color: 'green',
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  async function save() {
    if (!editing) return;
    try {
      await cmsRequest('/api/admin/cms/media/' + editing.id, 'PATCH', { title: editing.title, alt: editing.alt });
      setEditing(null);
      setVersion((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function deleteMedia() {
    if (!remove) return;
    try {
      await cmsRequest('/api/admin/cms/media/' + remove.id, 'DELETE');
      setRemove(null);
      setVersion((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
      setRemove(null);
    }
  }
  return (
    <Stack className="admin-panel">
      <Title order={1}>Медиабиблиотека</Title>
      {error && (
        <Alert color="red" className="admin-danger-button" role="alert">
          {error}
        </Alert>
      )}
      <Stack className="admin-editor">
        <FileInput
          label="Новое изображение"
          accept="image/jpeg,image/png,image/webp,image/avif"
          value={file}
          onChange={setFile}
          clearable
        />
        <TextInput label="Название изображения" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        <Textarea label="Альтернативное описание" value={alt} onChange={(e) => setAlt(e.currentTarget.value)} />
        <Button onClick={upload} loading={saving} disabled={!file}>
          Загрузить
        </Button>
        <Text size="sm" c="dimmed">
          Формат и размер проверяются сервером. Неопубликованные изображения доступны только администратору.
        </Text>
      </Stack>
      <Group>
        <TextInput
          label="Поиск изображений"
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          style={{ flex: 1 }}
        />
        <Select
          label="Использование"
          clearable
          value={usage}
          onChange={(v) => {
            setUsage(v);
            setPage(1);
          }}
          data={[
            { value: 'used', label: 'Используемые' },
            { value: 'unused', label: 'Неиспользуемые' },
          ]}
        />
      </Group>
      {loading ? (
        <Skeleton height={250} />
      ) : items.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {items.map((item) => (
            <Stack key={item.id} className="admin-editor" gap="sm">
              <Image src={item.previewUrl} alt={item.alt} h={190} fit="cover" radius="md" />
              <Text fw={700}>{item.title}</Text>
              <Text size="sm" c="dimmed">
                {item.width} × {item.height} · {Math.ceil(item.size / 1024)} КБ
              </Text>
              <Group>
                <Button variant="light" onClick={() => setEditing(item)}>
                  Редактировать
                </Button>
                <Button color="red" className="admin-danger-button" variant="subtle" onClick={() => setRemove(item)}>
                  Удалить
                </Button>
              </Group>
            </Stack>
          ))}
        </SimpleGrid>
      ) : (
        <Text c="dimmed">Изображений пока нет.</Text>
      )}
      {total > 24 && <Pagination total={Math.ceil(total / 24)} value={page} onChange={setPage} />}
      <Modal opened={!!editing} onClose={() => setEditing(null)} title="Описание изображения">
        <Stack>
          <TextInput
            label="Название"
            value={editing?.title ?? ''}
            onChange={(e) => setEditing(editing ? { ...editing, title: e.currentTarget.value } : null)}
          />
          <Textarea
            label="Альтернативное описание"
            value={editing?.alt ?? ''}
            onChange={(e) => setEditing(editing ? { ...editing, alt: e.currentTarget.value } : null)}
          />
          <Button onClick={save}>Сохранить описание</Button>
        </Stack>
      </Modal>
      <Modal opened={!!remove} onClose={() => setRemove(null)} title="Удаление изображения">
        <Text>Удалить файл? Используемые изображения удалить нельзя.</Text>
        <Group mt="md">
          <Button variant="default" onClick={() => setRemove(null)}>
            Отмена
          </Button>
          <Button color="red" className="admin-danger-button" onClick={deleteMedia}>
            Удалить
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}
