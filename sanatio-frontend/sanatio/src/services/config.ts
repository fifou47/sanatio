type IceServer = { urls: string | string[]; username?: string; credential?: string };

function env(name: string, fallback?: string) {
  const v = process.env[name];
  return (v ?? fallback ?? '').toString();
}

const GATEWAY = env('EXPO_PUBLIC_GATEWAY_URL');

function join(base: string, path: string) {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export const Config = {
  AUTH_URL: GATEWAY ? join(GATEWAY, '') : env('EXPO_PUBLIC_AUTH_URL', 'http://auth.localhost'),
  PATIENT_URL: GATEWAY ? join(GATEWAY, '') : env('EXPO_PUBLIC_PATIENT_URL', 'http://patient.localhost'),
  DOCTOR_URL: GATEWAY ? join(GATEWAY, '') : env('EXPO_PUBLIC_DOCTOR_URL', 'http://doctor.localhost'),
  BILLING_URL: GATEWAY ? join(GATEWAY, '') : env('EXPO_PUBLIC_BILLING_URL', 'http://billing.localhost'),
  WS_URL: env('EXPO_PUBLIC_WS_URL', 'ws://consult.localhost'),
  ICE_SERVERS(): IceServer[] {
    try {
      const raw = env('EXPO_PUBLIC_ICE_SERVERS', '[{"urls":["stun:stun.l.google.com:19302"]}]');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [{ urls: ['stun:stun.l.google.com:19302'] }];
    }
  },
  DEBUG: env('EXPO_PUBLIC_ENABLE_DEBUG', 'true') === 'true',
};

export function logConfig() {
  if (!Config.DEBUG) return;
  console.log('[Config]', {
    AUTH_URL: Config.AUTH_URL,
    PATIENT_URL: Config.PATIENT_URL,
    DOCTOR_URL: Config.DOCTOR_URL,
    BILLING_URL: Config.BILLING_URL,
    WS_URL: Config.WS_URL,
  });
}

