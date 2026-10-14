'use client';
import { Alert, Button, Group, Paper, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cmsRequest } from './cms-client';
export function CmsDashboard() {
  const [data, setData] = useState<Record<string, unknown> | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    cmsRequest('/api/admin/cms/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <Stack className="admin-panel">
      <Title order={1}>Обзор сайта</Title>
      {error && <Alert color="red">{error}</Alert>}
      {!data && !error ? (
        <Skeleton height={180} />
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {[
            ['services', 'Услуг'],
            ['categories', 'Категорий услуг'],
            ['posts', 'Опубликованных статей'],
            ['drafts', 'Черновиков статей'],
            ['projects', 'Опубликованных проектов'],
            ['leads', 'Новых заявок'],
          ].map(([key, label]) => (
            <Paper
              key={key}
              p="lg"
              radius="md"
              withBorder
              style={{ background: 'var(--site-surface)', borderColor: 'var(--site-border)' }}
            >
              <Text size="xl" fw={800}>
                {String(data?.[key] ?? '—')}
              </Text>
              <Text c="dimmed" size="sm">
                {label}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}
      <Group>
        <Button component={Link} href="/admin/blog/new">
          Создать статью
        </Button>
        <Button variant="light" component={Link} href="/admin/projects/new">
          Добавить проект
        </Button>
        <Button variant="light" component={Link} href="/admin/services/new">
          Создать услугу
        </Button>
      </Group>
      <Title order={2}>Последние заявки</Title>
      {(data?.recent as Record<string, unknown>[] | undefined)?.length ? (
        (data?.recent as Record<string, unknown>[]).map((lead) => (
          <Paper withBorder p="md" radius="md" key={String(lead.id)}>
            <Group justify="space-between">
              <div>
                <Text fw={700}>{String(lead.name)}</Text>
                <Text size="sm" c="dimmed">
                  {String(lead.phone)}
                </Text>
              </div>
              <Button variant="light" component={Link} href={'/admin/leads/' + lead.id}>
                Открыть заявку
              </Button>
            </Group>
          </Paper>
        ))
      ) : (
        <Text c="dimmed">Заявок пока нет.</Text>
      )}
    </Stack>
  );
}
