import 'server-only';

import {
  assertAdminBackendSuccess,
  readAdminBackendJson,
  requestAdminBackend,
  AdminBackendHttpError,
} from '@/shared/api/admin-backend';
import { readAdminCookies } from './session';
import { parseAdminProfile, type AdminProfile } from './types';

export class AdminUnauthenticated extends Error {
  constructor() {
    super('Administrator session is not authenticated');
    this.name = 'AdminUnauthenticated';
  }
}

export class AdminPageBackendUnavailable extends Error {
  constructor() {
    super('Administrator session cannot currently be verified');
    this.name = 'AdminPageBackendUnavailable';
  }
}

export async function requireAdmin(): Promise<AdminProfile> {
  const { accessToken, refreshToken } = await readAdminCookies();
  if (!accessToken) {
    if (refreshToken) throw new AdminPageBackendUnavailable();
    throw new AdminUnauthenticated();
  }

  let response: Response;
  try {
    response = await requestAdminBackend('auth/me', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    assertAdminBackendSuccess(response);
    return parseAdminProfile(await readAdminBackendJson(response));
  } catch (error) {
    if (error instanceof AdminBackendHttpError && error.status === 401) {
      throw new AdminUnauthenticated();
    }
    throw new AdminPageBackendUnavailable();
  }
}
