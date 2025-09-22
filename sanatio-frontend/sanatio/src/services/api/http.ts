import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../config';

type Tokens = { accessToken: string | null; refreshToken: string | null };

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

let tokens: Tokens = { accessToken: null, refreshToken: null };
let isRefreshing = false;
let pending: Array<(token: string | null) => void> = [];

function logAxiosError(error: AxiosError) {
  const { config, response, message } = error;
  const method = (config?.method || 'get').toUpperCase();
  const url = config?.baseURL ? `${config.baseURL}${config.url || ''}` : config?.url;
  if (response) {
    console.error('[API]', `${method} ${url}`, '->', response.status, response.statusText, {
      data: response.data,
      headers: response.headers,
    });
  } else {
    console.error('[API]', `${method} ${url}`, 'failed before response:', message);
  }
}

export async function loadTokens() {
  const [a, r] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  tokens = { accessToken: a || null, refreshToken: r || null };
}

export async function saveTokens(accessToken: string | null, refreshToken?: string | null) {
  tokens.accessToken = accessToken;
  if (accessToken) await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  else await SecureStore.deleteItemAsync(ACCESS_KEY);

  if (typeof refreshToken !== 'undefined') {
    tokens.refreshToken = refreshToken;
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    else await SecureStore.deleteItemAsync(REFRESH_KEY);
  }
}

function attachAuth(config: InternalAxiosRequestConfig) {
  if (tokens.accessToken) {
    config.headers = config.headers || {};
    (config.headers as any)['Authorization'] = `Bearer ${tokens.accessToken}`;
  }
  return config;
}

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => pending.push(resolve));
  }
  isRefreshing = true;
  try {
    if (!tokens.refreshToken) return null;
    const resp = await axios.post(`${Config.AUTH_URL}/auth/refresh-token`, {
      refreshToken: tokens.refreshToken,
    });
    const newAccess = resp.data?.accessToken as string | undefined;
    if (newAccess) await saveTokens(newAccess);
    pending.forEach((fn) => fn(newAccess || null));
    pending = [];
    return newAccess || null;
  } catch (e) {
    logAxiosError(e as AxiosError);
    pending.forEach((fn) => fn(null));
    pending = [];
    return null;
  } finally {
    isRefreshing = false;
  }
}

function createClient(baseURL: string): AxiosInstance {
  const instance = axios.create({ baseURL, timeout: 15000 });
  instance.interceptors.request.use(attachAuth);
  instance.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
      logAxiosError(error);
      const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      const status = error.response?.status;
      if (status === 401 && original && !original._retry) {
        original._retry = true;
        const newAccess = await refreshAccessToken();
        if (newAccess) {
          original.headers = original.headers || {};
          (original.headers as any)['Authorization'] = `Bearer ${newAccess}`;
          return instance(original);
        }
      }
      throw error;
    }
  );
  return instance;
}

export const api = {
  auth: createClient(Config.AUTH_URL),
  patient: createClient(Config.PATIENT_URL),
  doctor: createClient(Config.DOCTOR_URL),
  billing: createClient(Config.BILLING_URL),
};
