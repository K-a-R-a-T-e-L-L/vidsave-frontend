'use client';
import { Alert, Button, FileInput, Group, Image, Stack, Text } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { cmsRequest } from './cms-client';
export type MediaItem = {
  id: string;
  title: string;
  alt: string;
  width: number;
  height: number;
  size: number;
  url: string;
  previewUrl: string;
};
export function MediaPicker({
  label,
  value,
  onChange,
  multiple = false,
  onUploadingChange,
}: {
  label: string;
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  multiple?: boolean;
  onUploadingChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const created = useRef<string[]>([]);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const uploadedFiles = created.current;
    return () => {
      mounted.current = false;
      for (const id of uploadedFiles) void cmsRequest('/api/admin/cms/media/' + id, 'DELETE').catch(() => {});
    };
  }, []);
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  async function upload(files: File[]) {
    if (!files.length || busy) return;
    if (multiple && selected.length + files.length > 40) {
      setError('В галерее может быть не больше 40 фотографий.');
      return;
    }
    setBusy(true);
    setError('');
    onUploadingChange?.(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        if (file.size > 8 * 1024 * 1024) throw Error('Изображение должно быть не больше 8 МБ.');
        const bytes = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.onerror = () => reject(Error('Не удалось прочитать файл.'));
          reader.readAsDataURL(file);
        });
        const item = await cmsRequest<MediaItem>('/api/admin/cms/media', 'POST', {
          title: file.name.slice(0, 255),
          alt: file.name.replace(/\.[^.]+$/, '').slice(0, 500),
          mime: file.type,
          bytes,
        });
        if (!mounted.current) {
          await cmsRequest('/api/admin/cms/media/' + item.id, 'DELETE').catch(() => {});
          break;
        }
        created.current.push(item.id);
        uploaded.push(item.id);
      }
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      if (!mounted.current) return;
      if (uploaded.length) onChange(multiple ? [...selected, ...uploaded] : uploaded[0]);
      setBusy(false);
      onUploadingChange?.(false);
    }
  }
  return (
    <Stack gap="xs" data-media-uploading={busy || undefined}>
      <FileInput
        label={label}
        placeholder={busy ? 'Загрузка…' : multiple ? 'Добавить фотографии' : 'Загрузить изображение'}
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={multiple}
        value={multiple ? [] : null}
        disabled={busy}
        onChange={(files) => void upload(Array.isArray(files) ? files : files ? [files] : [])}
      />
      {error && (
        <Alert color="red" role="alert">
          {error}
        </Alert>
      )}
      {busy && (
        <Text size="sm" role="status">
          Загружаем изображение…
        </Text>
      )}
      <Group>
        {selected.map((id, index) => (
          <Stack key={id} gap={4} w={130}>
            <Image src={'/api/admin/cms/media/' + id + '/file'} alt={label} h={90} radius="md" fit="cover" />
            <Group gap={2}>
              {multiple && (
                <>
                  <Button
                    aria-label="Переместить фото раньше"
                    size="compact-xs"
                    variant="light"
                    disabled={busy || index === 0}
                    onClick={() => {
                      const next = [...selected];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      onChange(next);
                    }}
                  >
                    ←
                  </Button>
                  <Button
                    aria-label="Переместить фото позже"
                    size="compact-xs"
                    variant="light"
                    disabled={busy || index === selected.length - 1}
                    onClick={() => {
                      const next = [...selected];
                      [next[index + 1], next[index]] = [next[index], next[index + 1]];
                      onChange(next);
                    }}
                  >
                    →
                  </Button>
                </>
              )}
              <Button
                size="compact-xs"
                variant="subtle"
                disabled={busy}
                onClick={() => onChange(multiple ? selected.filter((v) => v !== id) : null)}
              >
                Убрать
              </Button>
            </Group>
          </Stack>
        ))}
      </Group>
    </Stack>
  );
}
