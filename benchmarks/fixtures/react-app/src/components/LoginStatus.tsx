import { useAuthState } from '../auth/useAuthState';

export function LoginStatus({ lastSeenAt }: { lastSeenAt: number }) {
  const auth = useAuthState(lastSeenAt);
  return auth.timedOut ? <p>Session timed out</p> : <p>Signed in as {auth.userName}</p>;
}
