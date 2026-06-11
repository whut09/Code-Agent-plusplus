import { apiConfig } from '../src/config.js';

it('loads api config through shared loader', () => {
  expect(apiConfig.apiUrl).toBeTruthy();
});
