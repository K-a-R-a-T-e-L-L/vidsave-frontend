'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@mantine/core';

// Keep the polymorphic Link function inside the client boundary, not in RSC props.
export default function ActionLink({
  href,
  children,
  rightSection,
  variant,
}: {
  href: string;
  children: ReactNode;
  rightSection?: ReactNode;
  variant?: 'subtle';
}) {
  return (
    <Button
      component={Link}
      href={href}
      size="md"
      rightSection={rightSection}
      variant={variant}
      style={variant === 'subtle' ? { color: 'var(--site-accent)' } : undefined}
    >
      {children}
    </Button>
  );
}
