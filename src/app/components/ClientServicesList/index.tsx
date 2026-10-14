'use client';
import { animated } from '@/app/lib/animated';
import { useGetSizingWindow } from '@/hooks/useGetSizingWindow/useGetSizingWindow';
import { useEffect, useLayoutEffect } from 'react';

interface ClientServicesListProps {
  children?: React.ReactNode;
}

const ClientServicesList = ({ children }: ClientServicesListProps) => {
  const [Width] = useGetSizingWindow();

  useEffect(() => {
    document.documentElement.classList.remove('no-js');
  }, []);

  useLayoutEffect(() => {
    animated();
  }, [Width]);

  return <div>{children}</div>;
};

export default ClientServicesList;
