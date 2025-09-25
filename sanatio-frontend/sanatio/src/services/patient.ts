// services/patient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api/http';

const KEY = 'patient_profile_id';
const PHONE_KEY = 'user_phone';              // <- numéro stocké dans l'appli
const PLACEHOLDER_PHONE = '+000000000';

export type Patient = {
  _id?: string;
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type PatientCreate = {
  name: string;
  email: string;
  phone: string; // fallback si le local n'existe pas
};

// ------------------------
// Helpers storage / ids
// ------------------------
const getPid = (p?: Patient | null) => (p?._id ?? p?.id ?? null);

export async function getStoredPatientId(): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export async function setStoredPatientId(id: string | null) {
  try {
    if (id) await AsyncStorage.setItem(KEY, id);
    else await AsyncStorage.removeItem(KEY);
  } catch {}
}

// ⚠️ Téléphone stocké localement (vérité côté app)
export async function getStoredAppPhone(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(PHONE_KEY);
    return v ? v.trim() : null;
  } catch {
    return null;
  }
}

export async function setStoredAppPhone(phone: string | null): Promise<void> {
  try {
    if (phone && phone.trim()) {
      await AsyncStorage.setItem(PHONE_KEY, phone.trim());
    } else {
      await AsyncStorage.removeItem(PHONE_KEY);
    }
  } catch {}
}

// ------------------------
// API calls
// ------------------------
export async function fetchPatient(id: string): Promise<Patient> {
  const resp = await api.patient.get(`/patients/${id}`);
  return resp.data as Patient;
}

async function fetchPatientSafe(id: string): Promise<Patient | null> {
  try {
    return await fetchPatient(id);
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function createPatientMinimal(data: PatientCreate): Promise<Patient> {
  const payload = {
    name: String(data.name || '').trim(),
    email: String(data.email || '').trim().toLowerCase(),
    phone: String(data.phone || '').trim(),
  };
  const resp = await api.patient.post('/patients', payload);
  return resp.data as Patient;
}

// ------------------------
// Ensure
// ------------------------
/**
 * Garantit l'existence du dossier patient :
 * - utilise d'abord le téléphone **stocké localement** (PHONE_KEY),
 * - si absent, fallback sur `data.phone`,
 * - si différent du patient existant, patch le téléphone,
 * - si patient absent, le crée avec le téléphone local (ou fallback).
 */
// ✅ utilise d’abord le téléphone local ; met à jour si différent ; crée sinon
export async function ensurePatientProfile(data: PatientCreate) {
  const localPhone = (await getStoredAppPhone()) || '';
  const desiredPhone = (localPhone || data.phone || '').trim();
  const isPlaceholder = desiredPhone === PLACEHOLDER_PHONE;

  const stored = await getStoredPatientId();
  if (stored) {
    const patient = await fetchPatientSafe(stored);
    if (patient) {
      const cur = String(patient.phone || '').trim();
      if (desiredPhone && !isPlaceholder && cur !== desiredPhone) {
        try { await api.patient.patch(`/patients/${stored}`, { phone: desiredPhone }); return { ...patient, phone: desiredPhone }; }
        catch { return patient; }
      }
      return patient;
    }
  }

  const created = await createPatientMinimal({
    name: String(data.name||'').trim(),
    email: String(data.email||'').trim().toLowerCase(),
    phone: desiredPhone || PLACEHOLDER_PHONE,
  });
  const id = getPid(created);
  if (id) await setStoredPatientId(id);
  return created;
}


export async function getPatientByContact({
  email,
  phone,
}: {
  email?: string | null;
  phone?: string | null;
}): Promise<Patient | null> {
  const params: any = {};
  if (email) params.email = String(email).trim().toLowerCase();
  if (phone) params.phone = String(phone).trim();
  if (!params.email && !params.phone) return null;

  try {
    const resp = await api.patient.get('/patients', { params: { ...params, limit: 1 } });
    const rows = Array.isArray(resp.data) ? resp.data : [];
    return (rows[0] as Patient) || null;
  } catch {
    return null;
  }
}
