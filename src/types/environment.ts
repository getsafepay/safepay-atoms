export enum Environment {
  Development = 'development',
  Production = 'production',
  Sandbox = 'sandbox',
  Local = 'local',
}

export type EnvironmentInput = Environment | string | undefined | null;

export function toEnvironment(env: EnvironmentInput): Environment {
  if (!env) return Environment.Production;
  if (typeof env !== 'string') return env;
  switch (env.toLowerCase().trim()) {
    case 'development':
      return Environment.Development;
    case 'production':
      return Environment.Production;
    case 'sandbox':
      return Environment.Sandbox;
    case 'local':
      return Environment.Local;
    default:
      const message =
        `[Safepay Atoms] Invalid environment "${env}". ` +
        'Valid values: development, production, sandbox, local.';
      // Throw to fail fast and surface misconfiguration (no console logging)
      throw new Error(message);
  }
}
