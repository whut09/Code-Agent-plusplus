export interface AuthState { loggedIn: boolean; timedOut: boolean; userName?: string; }

export function useAuthState(lastSeenAt: number, now = Date.now()): AuthState {
  const timedOut = now - lastSeenAt > 15 * 60 * 1000;
  return { loggedIn: !timedOut, timedOut, userName: timedOut ? undefined : 'Ada' };
}
