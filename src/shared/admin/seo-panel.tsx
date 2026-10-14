'use client';
import { Alert, Button, Paper, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cmsRequest } from './cms-client';
import { resourceRoutes, type Resource } from './cms-editor';
export function SeoPanel() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    cmsRequest<{ pages: Record<string, unknown>[]; content: Record<string, unknown>[] }>('/api/admin/cms/seo')
      .then((data) => setRows([...data.pages.map((p) => ({ ...p, kind: 'pages' })), ...data.content]))
      .catch((e) => setError(e.message));
  }, []);
  const counts = (field: string, value: unknown) => rows.filter((row) => row[field] && row[field] === value).length;
  return (
    <Stack className="admin-panel">
      <Title order={1}>SEO сайта</Title>
      <Text c="dimmed">
        Проверьте заголовки, описания и содержимое страниц. Изменения вносятся в редакторе соответствующего материала.
      </Text>
      {error && <Alert color="red">{error}</Alert>}
      {rows.map((row) => {
        const document = row.document as { title?: string; description?: string } | undefined;
        const title = String(row.seoTitle || row.title || row.name || document?.title || '');
        const description = String(row.seoDescription || row.excerpt || row.description || document?.description || '');
        const problems = [
          !row.seoTitle ? 'Используется заголовок по умолчанию' : '',
          !row.seoDescription ? 'Используется описание по умолчанию' : '',
          counts('seoTitle', row.seoTitle) > 1 ? 'Повторяется SEO-заголовок' : '',
          counts('seoDescription', row.seoDescription) > 1 ? 'Повторяется SEO-описание' : '',
          !(row.title || row.name || document?.title) ? 'Не заполнен H1' : '',
        ].filter(Boolean);
        return (
          <Paper key={String(row.kind) + String(row.id)} className="admin-editor">
            <Stack gap="xs">
              <Title order={2} size="h4">
                {String(row.title || row.name || document?.title || 'Страница')}
              </Title>
              <Text fw={700} c="blue">
                {title}
              </Text>
              <Text size="sm">{description}</Text>
              {problems.length > 0 && (
                <Text size="sm" c="var(--site-warning)">
                  {problems.join(' · ')}
                </Text>
              )}
              <Text size="xs" c="dimmed">
                {row.noindex
                  ? 'Исключена из индексации'
                  : row.status && row.status !== 'published'
                    ? 'Материал не опубликован'
                    : 'Доступна для индексации'}{' '}
                · Canonical: {String(row.canonical || 'формируется из URL материала')}
              </Text>
              <Button
                variant="light"
                component={Link}
                href={'/admin/' + resourceRoutes[row.kind as Resource] + '/' + row.id}
              >
                Редактировать SEO
              </Button>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
