import { useAuthState } from './useAuthState';

it('marks auth state timed out', () => {
  expect(useAuthState(0, 16 * 60 * 1000).timedOut).toBe(true);
});
