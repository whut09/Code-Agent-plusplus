export interface AppConfig { apiUrl: string; featureFlag: boolean; }

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  return { apiUrl: env.API_URL ?? 'http://localhost:3000', featureFlag: env.FEATURE_FLAG === 'true' };
}
