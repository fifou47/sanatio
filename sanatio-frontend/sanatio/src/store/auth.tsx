import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, loadTokens, saveTokens } from '../services/api/http';
import { jwtDecode } from 'jwt-decode';
import { toAppError } from '../services/api/errors';
import { normalizePhone } from '../utils/phone';
import { ensurePatientProfile, getPatientByContact, getStoredAppPhone, setStoredPatientId } from '../services/patient';

const SESSION_KEY = 'session_id';

type AuthUser = {
  id: string;
  email: string;
  roles: string[];
};

type AuthContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  loading: boolean;
  signIn: (emailOrPhone: string, password: string) => Promise<void>;
  signUpPatient: (data: {
    name: string;
    email: string;
    phone: string;
    dialCode: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type MainTabRoute = 'Home' | 'Chat' | 'Consultations' | 'Billing' | 'Settings' | 'Profile';
let pendingProtectedRoute: MainTabRoute | null = null;

export function setPendingProtectedRoute(route: MainTabRoute) {
  pendingProtectedRoute = route;
}

export function consumePendingProtectedRoute(defaultRoute: MainTabRoute = 'Home'): MainTabRoute {
  const route = pendingProtectedRoute ?? defaultRoute;
  pendingProtectedRoute = null;
  return route;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccess] = useState<string | null>(null);
  const [refreshToken, setRefresh] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await loadTokens();
        const a = await SecureStore.getItemAsync('access_token');
        const r = await SecureStore.getItemAsync('refresh_token');
        const s = await SecureStore.getItemAsync(SESSION_KEY);
        setAccess(a || null);
        setRefresh(r || null);
        setSessionId(s || null);
        if (a) updateUserFromToken(a, s || undefined);
        // Try silent refresh if access is missing and refresh exists
        if (!a && r) {
          try {
            const resp = await api.auth.post('/auth/refresh-token', { refreshToken: r });
            const newAccess = resp.data?.accessToken as string | undefined;
            const newSession = resp.data?.sessionId as string | undefined;
            if (newAccess) {
              await saveTokens(newAccess);
              setAccess(newAccess);
              if (newSession) {
                await SecureStore.setItemAsync(SESSION_KEY, newSession);
                setSessionId(newSession);
              }
              updateUserFromToken(newAccess, newSession);
            }
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const signIn = async (emailOrPhone: string, password: string) => {
  try {
    const resp = await api.auth.post('/auth/login', { emailOrPhone, password });
    const a = resp.data?.accessToken as string | undefined;
    const r = resp.data?.refreshToken as string | undefined;
    const s = resp.data?.sessionId as string | undefined;
    if (!a) throw toAppError(new Error('Réponse inattendue du serveur.'));

    await saveTokens(a, r || null);
    if (s) {
      await SecureStore.setItemAsync(SESSION_KEY, s);
      setSessionId(s);
    }
    setAccess(a);
    setRefresh(r || null);
    updateUserFromToken(a, s);

    // 👉 Récupérer le patient existant par contact (email / téléphone local)
    const payload: any = jwtDecode(a);
    const email = payload?.email ?? null;
    const userId = payload?.sub;
    const localPhone = await getStoredAppPhone();

    const found = await getPatientByContact({ email, phone: localPhone });
    if (found && (found._id || found.id)) {
      await setStoredPatientId(String(found._id || found.id));
      return; // on a récupéré le dossier, c'est bon
    }

    // Pas trouvé ? On tente de créer/assurer le patient avec les infos du compte
    let account: { name?: string | null; phone?: string | null } = {};
    try {
      const u = await api.auth.get(`/users/${userId}`);
      account = u?.data ?? {};
    } catch {
      // non bloquant
    }

    const safeName =
      (account?.name && String(account.name).trim()) ||
      (email ? String(email).split('@')[0] : 'Patient');

    const safePhone =
      (localPhone && String(localPhone).trim()) ||
      (account?.phone && String(account.phone).trim()) ||
      '+000000000';

    await ensurePatientProfile({
      name: safeName,
      email: (email || 'unknown@example.com').toLowerCase(),
      phone: safePhone,
    });
  } catch (err) {
    throw toAppError(err, 'Identifiants invalides ou connexion impossible.');
  }
};


  const signOut = async () => {
    try {
      if (accessToken) await api.auth.post('/auth/logout');
    } catch (err) {
      // Nous purgeons quand même la session, mais conservons l’erreur pour un éventuel suivi.
      console.warn('[Auth] Échec de la déconnexion distante:', err);
    }
    await saveTokens(null, null);
    await setStoredPatientId(null).catch(() => {});
    setAccess(null);
    setRefresh(null);
    setUser(null);
    setSessionId(null);
    await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
  };

  const signUpPatient = async (data: {
    name: string;
    email: string;
    phone: string;
    dialCode: string;
    password: string;
  }) => {
    try {
      const { dialCode, ...rest } = data;
      await api.auth.post('/users', {
        ...rest,
        name: rest.name.trim(),
        email: rest.email.trim(),
        phone: normalizePhone(rest.phone, dialCode),
      });


      await signIn(rest.email.trim(), rest.password);


    } catch (err) {
      throw toAppError(err, 'Impossible de créer le compte patient.');
    }
  };

  function updateUserFromToken(token: string, session?: string) {
    try {
      const payload: any = jwtDecode(token);
      setUser({ id: payload?.sub, email: payload?.email, roles: payload?.roles || [] });
      const payloadSession = payload?.sessionId as string | undefined;
      const effectiveSession = session || payloadSession || null;
      if (effectiveSession && effectiveSession !== sessionId) {
        setSessionId(effectiveSession);
        SecureStore.setItemAsync(SESSION_KEY, effectiveSession).catch(() => {});
      }
    } catch (e) {
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({ accessToken, refreshToken, sessionId, loading, signIn, signUpPatient, signOut, user }),
    [accessToken, refreshToken, sessionId, loading, user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
