import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api/http';

const KEY = 'patient_profile_id';

export type PatientCreate = {
  name: string;
  email: string;
  phone: string;
};

export async function getStoredPatientId() {
  return (await AsyncStorage.getItem(KEY)) || null;
}

export async function setStoredPatientId(id: string | null) {
  if (id) await AsyncStorage.setItem(KEY, id);
  else await AsyncStorage.removeItem(KEY);
}

export async function fetchPatient(id: string) {
  const resp = await api.patient.get(`/patients/${id}`);
  return resp.data;
}

export async function createPatientMinimal(data: PatientCreate) {
  const resp = await api.patient.post('/patients', data);
  return resp.data;
}

// Ensure a patient profile exists for this user.
// Strategy: if we have a stored patient id, try GET. If 404, recreate.
export async function ensurePatientProfile(data: PatientCreate) {
  const stored = await getStoredPatientId();
  if (stored) {
    try {
      const patient = await fetchPatient(stored);
      const desiredPhone = data.phone?.trim();
      const isPlaceholder = desiredPhone === '+000000000';
      if (desiredPhone && !isPlaceholder && patient?.phone !== desiredPhone) {
        await api.patient.patch(`/patients/${stored}`, { phone: desiredPhone });
        return { ...patient, phone: desiredPhone };
      }
      return patient;
    } catch (e: any) {
      // fallthrough to create
    }
  }
  const created = await createPatientMinimal(data);
  const id = created?._id || created?.id; // backend returns Mongo _id normally
  if (id) await setStoredPatientId(id);
  return created;
}
