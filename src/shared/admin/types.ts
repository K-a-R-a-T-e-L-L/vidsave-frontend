export type AdminRole = 'ADMIN' | 'USER';

export interface AdminProfile {
  id: string;
  email: string;
  role: AdminRole;
}

export interface AdminAuthResponse {
  user: AdminProfile;
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

export class InvalidAdminBackendResponse extends Error {
  constructor() {
    super('Invalid administrator authentication response');
    this.name = 'InvalidAdminBackendResponse';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => key in value);
}

export function parseAdminProfile(value: unknown): AdminProfile {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['id', 'email', 'role']) ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    typeof value.email !== 'string' ||
    value.email.length === 0 ||
    (value.role !== 'ADMIN' && value.role !== 'USER')
  ) {
    throw new InvalidAdminBackendResponse();
  }

  return { id: value.id, email: value.email, role: value.role };
}

export function parseAdminAuthResponse(value: unknown): AdminAuthResponse {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['user', 'accessToken', 'refreshToken', 'accessExpiresIn', 'refreshExpiresIn']) ||
    typeof value.accessToken !== 'string' ||
    !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value.accessToken) ||
    typeof value.refreshToken !== 'string' ||
    !/^[A-Za-z0-9_-]{64}$/.test(value.refreshToken) ||
    typeof value.accessExpiresIn !== 'number' ||
    !Number.isSafeInteger(value.accessExpiresIn) ||
    value.accessExpiresIn <= 0 ||
    typeof value.refreshExpiresIn !== 'number' ||
    !Number.isSafeInteger(value.refreshExpiresIn) ||
    value.refreshExpiresIn <= value.accessExpiresIn
  ) {
    throw new InvalidAdminBackendResponse();
  }

  return {
    user: parseAdminProfile(value.user),
    accessToken: value.accessToken,
    refreshToken: value.refreshToken,
    accessExpiresIn: value.accessExpiresIn,
    refreshExpiresIn: value.refreshExpiresIn,
  };
}
