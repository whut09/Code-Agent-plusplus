import { apiConfig } from './config.js';

export function startServer() {
  return `api:${apiConfig.apiUrl}`;
}
