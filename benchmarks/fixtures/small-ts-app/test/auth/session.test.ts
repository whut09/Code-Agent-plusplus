import { isSessionExpired, refreshSession } from '../../src/auth/session.js';

it('detects expired sessions', () => {
  expect(isSessionExpired({ userId: 'u1', expiresAt: 1 }, 2)).toBe(true);
});

it('refreshes session ttl', () => {
  expect(refreshSession({ userId: 'u1', expiresAt: 0 }, 100).expiresAt).toBeGreaterThan(0);
});
