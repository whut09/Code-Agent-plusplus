import { refreshSession, type Session } from '../auth/session.js';

export function login(userId: string): Session {
  return refreshSession({ userId, expiresAt: 0 }, 30 * 60 * 1000);
}
