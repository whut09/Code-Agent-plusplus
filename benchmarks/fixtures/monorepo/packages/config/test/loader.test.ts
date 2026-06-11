import { loadConfig } from '../src/loader.js';

it('loads shared config defaults', () => {
  expect(loadConfig({}).apiUrl).toContain('localhost');
});
