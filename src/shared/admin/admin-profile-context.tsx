'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AdminProfile } from './types';

const AdminProfileContext = createContext<AdminProfile | null>(null);

export function AdminProfileProvider({ profile, children }: { profile: AdminProfile; children: ReactNode }) {
  return <AdminProfileContext.Provider value={profile}>{children}</AdminProfileContext.Provider>;
}

export function useAdminProfile(): AdminProfile {
  const profile = useContext(AdminProfileContext);
  if (!profile) throw new Error('Admin profile is not available');
  return profile;
}
