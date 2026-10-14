'use client';

import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import type { ReactNode } from 'react';

const semanticVariables = {
  '--mantine-color-text': 'var(--site-text)',
  '--mantine-color-body': 'var(--site-bg)',
  '--mantine-color-dimmed': 'var(--site-muted)',
  '--mantine-color-placeholder': 'var(--site-subtle)',
  '--mantine-color-default': 'var(--site-surface)',
  '--mantine-color-default-hover': 'var(--site-bg-secondary)',
  '--mantine-color-default-color': 'var(--site-text)',
  '--mantine-color-default-border': 'var(--site-border)',
  '--mantine-color-error': 'var(--site-danger)',
};
const colorSchemeManager = localStorageColorSchemeManager({ key: 'vidsave_theme' });

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      defaultColorScheme="light"
      cssVariablesResolver={() => ({ variables: {}, light: semanticVariables, dark: semanticVariables })}
      colorSchemeManager={colorSchemeManager}
      theme={{
        primaryColor: 'blue',
        fontFamily: 'Manrope Variable, Manrope, sans-serif',
        components: {
          Modal: { defaultProps: { closeButtonProps: { 'aria-label': 'Закрыть' } } },
          Drawer: { defaultProps: { closeButtonProps: { 'aria-label': 'Закрыть' } } },
        },
      }}
    >
      {children}
    </MantineProvider>
  );
}
