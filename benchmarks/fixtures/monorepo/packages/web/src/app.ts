import { webConfig } from './config.js';

export function renderApp() {
  return webConfig.featureFlag ? 'new-ui' : 'old-ui';
}
