import { login } from '../../src/api/login.js';

it('creates a session for login', () => {
  expect(login('u1').userId).toBe('u1');
});
