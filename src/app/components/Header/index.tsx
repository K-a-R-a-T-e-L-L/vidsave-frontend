'use client';

import { ActionIcon, Burger, Button, Drawer, Tooltip } from '@mantine/core';
import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconArrowUpRight, IconMoon, IconPhone, IconSun, IconMapPin, IconChevronDown } from '@tabler/icons-react';
import BrandLogo from '../BrandLogo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useContactData } from '@/app/components/CmsContent';
import { publicNavigation } from '@/app/lib/site';
import styles from './styles.module.scss';

const navigation = publicNavigation;

export default function Header() {
  const { contactData, settings } = useContactData();
  const pathname = usePathname();
  const [menuOpened, setMenuOpened] = useState(false);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const closeMenu = () => setMenuOpened(false);
  const toggleTheme = () => setColorScheme(isDark ? 'light' : 'dark');
  const requestHref = '#request';
  const active = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className={`${styles.header} ${pathname === '/' ? styles.homeHeader : ''}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="ВИДЕОХРАНИТЕЛЬ — на главную">
          <BrandLogo />
        </Link>

        <nav className={styles.desktopNav} aria-label="Основная навигация">
          <details
            className={styles.serviceMenu}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.currentTarget.removeAttribute('open');
                event.currentTarget.querySelector('summary')?.focus();
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute('open');
            }}
          >
            <summary className={styles.navLink}>
              Услуги <IconChevronDown size={13} aria-hidden="true" />
            </summary>
            <div className={styles.serviceDropdown}>
              {navigation
                .filter((item) => ['/services', '/for-home', '/for-business', '/blog'].includes(item.href))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
                  >
                    {item.href === '/services' ? 'Все услуги' : item.label}
                  </Link>
                ))}
            </div>
          </details>
          {navigation
            .filter((item) => ['/projects', '/about', '/contacts'].includes(item.href))
            .map((item) => (
              <Link
                className={styles.navLink}
                href={item.href}
                key={item.href}
                aria-current={active(item.href) ? 'page' : undefined}
              >
                {item.href === '/projects' ? 'Проекты' : item.label}
              </Link>
            ))}
        </nav>

        <div className={styles.actions}>
          <div className={styles.location}>
            <IconMapPin size={19} aria-hidden="true" />
            <span>
              Кемерово<small>и Кемеровская область</small>
            </span>
          </div>
          <Link
            className={styles.phone}
            href={contactData.phoneHref}
            aria-label={'Позвонить: ' + contactData.phoneLabel}
          >
            <IconPhone size={17} aria-hidden="true" />
            <span>
              {contactData.phoneLabel}
              <small>{settings.hours}</small>
            </span>
          </Link>
          <Tooltip label="Переключить цветовую тему" withArrow>
            <ActionIcon
              className={styles.themeButton}
              variant="default"
              size="lg"
              radius="xl"
              onClick={toggleTheme}
              aria-label="Переключить цветовую тему"
              title="Переключить цветовую тему"
            >
              <IconMoon className={styles.darkThemeIcon} size={19} aria-hidden="true" />
              <IconSun className={styles.lightThemeIcon} size={19} aria-hidden="true" />
            </ActionIcon>
          </Tooltip>
          <Button
            component={Link}
            href={requestHref}
            className={styles.headerCta}
            rightSection={<IconArrowUpRight size={17} />}
          >
            Оставить заявку
          </Button>
          <Burger
            className={styles.mobileBurger}
            opened={menuOpened}
            onClick={() => setMenuOpened((opened) => !opened)}
            aria-label={menuOpened ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpened}
            aria-controls="mobile-navigation"
          />
        </div>
      </div>

      <Drawer
        opened={menuOpened}
        onClose={closeMenu}
        title={<span className={styles.drawerTitle}>Навигация</span>}
        position="right"
        size="min(88vw, 380px)"
        id="mobile-navigation"
        classNames={{ content: styles.drawerContent, header: styles.drawerHeader, body: styles.drawerBody }}
      >
        <nav className={styles.mobileNav} aria-label="Мобильная навигация">
          {navigation.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              onClick={closeMenu}
              aria-current={active(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link className={styles.mobilePhone} href={contactData.phoneHref} onClick={closeMenu}>
            <IconPhone size={18} aria-hidden="true" /> {contactData.phoneLabel}
          </Link>
          <Button
            component={Link}
            href={requestHref}
            onClick={closeMenu}
            fullWidth
            className={styles.mobileCta}
            rightSection={<IconArrowUpRight size={17} />}
          >
            Получить консультацию
          </Button>
        </nav>
      </Drawer>
    </header>
  );
}
