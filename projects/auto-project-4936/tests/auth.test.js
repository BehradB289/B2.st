```js
/**
 * ─── Authentication Tests ───
 * Uses Vitest to test register, login, and auth guard.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app, server } from '../src/server.js';

const BASE = `http://localhost:${server.address().port}`;

// Helper
async function api(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  return { status: res.status, data: await res.json() };
}

const TEST_USER = {
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  username: `testuser_${Date.now()}`,
  displayName: 'Test User',
};

let authToken = '';

afterAll(() => {
  server.close();
});

describe('POST /auth/register', () => {
  it('should register a new user', async () => {
    const { status, data } = await api('POST', '/auth/register', TEST_USER);
    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
    expect(data.data.user.email).toBe(TEST_USER.email.toLowerCase());
    expect(data.data.user.username).toBe(TEST_USER.username.toLowerCase());
    expect(data.data.user).not.toHaveProperty('passwordHash');
    authToken = data.data.token;
  });

  it('should reject duplicate email', async () => {
    const { status, data } = await api('POST', '/auth/register', TEST_USER);
    expect(status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('EMAIL_EXISTS');
  });

  it('should reject invalid email', async () => {
    const { status, data } = await api('POST', '/auth/register', {
      ...TEST_USER,
      email: 'not-an-email',
      username: 'unique_user_999',
    });
    expect(status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject short password', async () => {
    const { status, data } = await api('POST', '/auth/register', {
      ...TEST_USER,
      email: 'new@example.com',
      username: 'unique_user_998',
      password: '123',
    });
    expect(status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid username', async () => {
    const { status, data } = await api('POST', '/auth/register', {
      ...TEST_USER,
      email: 'new2@example.com',
      username: 'ab',
    });
    expect(status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /auth/login', () => {
  it('should login with correct credentials', async () => {
    const { status, data } = await api('POST', '/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.token).toBeDefined();
    expect(data.data.user.email).toBe(TEST_USER.email.toLowerCase());
  });

  it('should reject wrong password', async () => {
    const { status, data } = await api('POST', '/auth/login', {
      email: TEST_USER.email,
      password: 'WrongPassword!',
    });
    expect(status).toBe(401);
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject non-existent email', async () => {
    const { status, data } = await api('POST', '/auth/login', {
      email: 'nobody@example.com',
      password: 'whatever123',
    });
    expect(status).toBe(401);
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /auth/me', () => {
  it('should return user profile with valid token', async () => {
    const { status, data } = await api('GET', '/auth/me', null, authToken);
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe(TEST_USER.email.toLowerCase());
  });

  it('should reject request without token', async () => {
    const { status, data } = await api('GET', '/auth/me');
    expect(status).toBe(401);
    expect(data.error.code).toBe('AUTH_MISSING');
  });

  it('should reject invalid token', async () => {
    const { status, data } = await api('GET', '/auth/me', null, 'invalid.token.here');
    expect(status).toBe(401);
    expect(data.error.code).toBe('TOKEN_INVALID');
  });
});

describe('GET /api/health', () => {
  it('should return health status', async () => {
    const { status, data } = await api('GET', '/api/health');
    expect(status).toBe(200);
    expect(data.data.status).toBe('ok');
    expect(data.data.service).toBe('LinkBox');
  });
});
```