'use client';
import { animated } from '@/app/lib/animated';
import { useGetSizingWindow } from '@/hooks/useGetSizingWindow/useGetSizingWindow';
import { useEffect, useLayoutEffect } from 'react';

interface ClientServiceProps {
  children?: React.ReactNode;
}

const ClientService = ({ children }: ClientServiceProps) => {
  const [Width] = useGetSizingWindow();

  useEffect(() => {
    document.documentElement.classList.remove('no-js');
  }, []);

  useLayoutEffect(() => {
    animated();
  }, [Width]);

  return children;
};

export default ClientService;
