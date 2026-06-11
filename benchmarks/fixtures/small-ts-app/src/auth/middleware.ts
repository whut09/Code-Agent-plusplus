import { isSessionExpired, type Session } from './session.js';

export function requireActiveSession(session: Session): boolean {
  return !isSessionExpired(session);
}
