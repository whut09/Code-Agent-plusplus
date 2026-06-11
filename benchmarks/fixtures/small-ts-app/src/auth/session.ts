export interface Session { userId: string; expiresAt: number; }

export function isSessionExpired(session: Session, now = Date.now()): boolean {
  return session.expiresAt <= now;
}

export function refreshSession(session: Session, ttlMs: number): Session {
  return { ...session, expiresAt: Date.now() + ttlMs };
}
