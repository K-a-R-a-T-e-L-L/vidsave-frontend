import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = process.cwd();

async function loadTypeScript(relativePath) {
  const source = await readFile(path.join(root, relativePath), 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal(diagnostics?.filter((item) => item.category === ts.DiagnosticCategory.Error).length, 0);
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}

const [config, contract, refresh] = await Promise.all([
  loadTypeScript('src/shared/admin/session-config.ts'),
  loadTypeScript('src/shared/admin/types.ts'),
  loadTypeScript('src/shared/admin/refresh-registry.ts'),
]);

test('backend URL accepts only absolute credential-free HTTP(S) origins without query or fragment', () => {
  assert.equal(config.parseBackendInternalUrl('http://backend:3001').origin, 'http://backend:3001');
  for (const value of [
    'relative/path',
    'ftp://backend',
    'http://user:pass@backend',
    'http://backend?secret=x',
    'http://backend/#fragment',
  ]) {
    assert.throws(() => config.parseBackendInternalUrl(value));
  }
});

test('session cookies are host-only, HttpOnly, Lax, path-scoped, and environment-secure', () => {
  const production = config.adminSessionCookieOptions(240, true);
  const development = config.adminSessionCookieOptions(3600, false);
  assert.deepEqual(production, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 240 });
  assert.equal(development.secure, false);
  assert.equal('domain' in production, false);
});

test('JWT expiry decoding is used only for the fifteen-second refresh window', () => {
  const expiry = Math.floor(Date.now() / 1000) + 30;
  const token = `header.${Buffer.from(JSON.stringify({ exp: expiry, role: 'ADMIN' })).toString('base64url')}.signature`;
  assert.equal(config.isAccessTokenNearExpiry(token), false);
  assert.equal(config.isAccessTokenNearExpiry(token, (expiry - 10) * 1000), true);
  assert.equal(config.isAccessTokenNearExpiry('not-a-jwt'), true);
});

test('backend authentication payloads are validated before tokens are used', () => {
  const user = { id: 'a1', email: 'admin@example.com', role: 'ADMIN' };
  const good = {
    user,
    accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MDAwMDAwMDB9.signature',
    refreshToken: 'A'.repeat(64),
    accessExpiresIn: 240,
    refreshExpiresIn: 3600,
  };
  assert.deepEqual(contract.parseAdminAuthResponse(good), good);
  assert.throws(() => contract.parseAdminAuthResponse({ ...good, accessToken: '' }));
  assert.throws(() => contract.parseAdminAuthResponse({ ...good, user: { ...user, role: 'ROOT' } }));
  assert.throws(() => contract.parseAdminAuthResponse({ ...good, refreshExpiresIn: '3600' }));
  assert.deepEqual(contract.parseAdminProfile(user), user);
  assert.throws(() => contract.parseAdminProfile({ ...user, passwordHash: 'must not be exposed' }));
});

test('concurrent refresh calls for one token share a single backend operation and clear the in-flight entry', async () => {
  let calls = 0;
  const operation = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { accessToken: 'fresh' };
  };
  const [first, second] = await Promise.all([
    refresh.singleFlightRefresh('same-refresh-token', operation),
    refresh.singleFlightRefresh('same-refresh-token', operation),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);

  const third = await refresh.singleFlightRefresh('same-refresh-token', operation);
  assert.equal(calls, 2);
  assert.deepEqual(third, { accessToken: 'fresh' });
});

test('single-flight refresh does not share operations across different tokens', async () => {
  let calls = 0;
  const operation = async () => {
    calls += 1;
    return calls;
  };
  const results = await Promise.all([
    refresh.singleFlightRefresh('token-one', operation),
    refresh.singleFlightRefresh('token-two', operation),
  ]);
  assert.deepEqual(results, [1, 2]);
  assert.equal(calls, 2);
});
