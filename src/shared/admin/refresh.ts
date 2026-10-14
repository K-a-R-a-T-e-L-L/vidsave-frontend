import 'server-only';

import { assertAdminBackendSuccess, readAdminBackendJson, requestAdminBackend } from '@/shared/api/admin-backend';
import { singleFlightRefresh } from './refresh-registry';
import { parseAdminAuthResponse, type AdminAuthResponse } from './types';

async function refreshOnce(refreshToken: string): Promise<AdminAuthResponse> {
  const response = await requestAdminBackend('auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  assertAdminBackendSuccess(response);
  return parseAdminAuthResponse(await readAdminBackendJson(response));
}

export function refreshAdminSession(refreshToken: string) {
  return singleFlightRefresh(refreshToken, () => refreshOnce(refreshToken));
}
