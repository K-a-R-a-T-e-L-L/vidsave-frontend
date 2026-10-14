'use client';
import {
  AppShell,
  ActionIcon,
  Burger,
  Breadcrumbs,
  Drawer,
  Group,
  Stack,
  Text,
  Button,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconLayoutDashboard,
  IconFileText,
  IconMail,
  IconSettings,
  IconUsers,
  IconBuilding,
  IconCategory,
  IconTools,
  IconArrowLeft,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { logoutAdminAction } from '@/app/(admin)/admin/(protected)/logout-action';
const navigation = [
  ['', 'Обзор', IconLayoutDashboard],
  ['services', 'Услуги', IconTools],
  ['service-categories', 'Категории услуг', IconCategory],
  ['blog', 'Блог', IconFileText],
  ['blog-categories', 'Категории блога', IconCategory],
  ['projects', 'Портфолио', IconBuilding],
  ['leads', 'Заявки', IconMail],
  ['settings', 'Контакты', IconSettings],
  ['admins', 'Администраторы', IconUsers],
] as const;
export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname(),
    section = path.split('/')[2] ?? '';
  const current = navigation.find((item) => item[0] === section)?.[1] ?? 'Панель управления';
  const [opened, setOpened] = useState(false);
  const { setColorScheme } = useMantineColorScheme();
  const theme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const links = (
    <Stack gap={4} p="sm">
      {navigation.map(([slug, label, Icon]) => (
        <Link
          key={slug}
          href={`/admin${slug ? '/' + slug : ''}`}
          className="admin-nav-item"
          aria-current={section === slug ? 'page' : undefined}
          onClick={() => setOpened(false)}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
      <Link href="/" className="admin-nav-item">
        <IconArrowLeft size={18} />
        На сайт
      </Link>
      <form action={logoutAdminAction}>
        <Button fullWidth variant="light" type="submit">
          Выход
        </Button>
      </form>
    </Stack>
  );
  return (
    <AppShell
      header={{ height: 68 }}
      navbar={{ width: 250, breakpoint: 'md', collapsed: { mobile: true } }}
      padding="md"
    >
      <AppShell.Header style={{ background: 'var(--site-elevated)', borderColor: 'var(--site-border)' }}>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group wrap="nowrap">
            <Burger
              opened={opened}
              onClick={() => setOpened(true)}
              hiddenFrom="md"
              size="sm"
              aria-label="Открыть меню администратора"
            />
            <div>
              <Text fw={800}>{current}</Text>
              <Breadcrumbs styles={{ breadcrumb: { fontSize: 12 } }}>
                <Link href="/admin">Панель управления</Link>
                <Text size="xs">{current}</Text>
              </Breadcrumbs>
            </div>
          </Group>
          <ActionIcon
            variant="default"
            aria-label="Переключить цветовую тему"
            onClick={() => setColorScheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <IconMoon className="admin-theme-light" size={19} aria-hidden="true" />
            <IconSun className="admin-theme-dark" size={19} aria-hidden="true" />
          </ActionIcon>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar
        style={{ background: 'var(--site-surface)', borderColor: 'var(--site-border)', overflowY: 'auto' }}
      >
        {links}
      </AppShell.Navbar>
      <Drawer opened={opened} onClose={() => setOpened(false)} title="Разделы администрирования">
        {links}
      </Drawer>
      <AppShell.Main style={{ minWidth: 0 }}>{children}</AppShell.Main>
    </AppShell>
  );
}
