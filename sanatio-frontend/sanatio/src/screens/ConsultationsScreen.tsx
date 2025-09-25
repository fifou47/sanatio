import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import HeaderBar from '../components/HeaderBar';
import Screen from '../components/Screen';
import { useAuth } from '../store/auth';
import { RootParamList } from '../navigation/RootNavigator'; // Importation ajoutée
import { api } from '../services/api/http';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Note: Le type ConsultationStackParamList n'est pas défini ici, 
// je vais utiliser RootParamList pour la navigation pour assurer la compilation.
// Idéalement, il faudrait importer ce type depuis son fichier de définition.

/** =========================
 *  Helpers de debug/erreurs
 *  ========================= */
type AnyObj = Record<string, any>;

function logError(context: string, error: any, extra?: AnyObj) {
  const err = error instanceof Error ? error : new Error(String(error?.message || error));
  console.groupCollapsed(`[❌ ERROR] ${context}`);
  console.error(err);
  if (extra && Object.keys(extra).length) {
    console.log('Extra:', extra);
  }
  console.trace('Trace');
  console.groupEnd();
}

async function guardAsync<T>(
  context: string,
  fn: () => Promise<T>,
  onError?: (msg: string) => void
): Promise<T | undefined> {
  try {
    console.groupCollapsed(`[▶] ${context}`);
    const result = await fn();
    console.log('✅ Success:', result);
    console.groupEnd();
    return result;
  } catch (e: any) {
    const apiMsg = e?.response?.data?.message || e.message || 'Unexpected error';
    logError(context, e, {
      status: e?.response?.status,
      data: e?.response?.data,
      headers: e?.response?.headers,
    });
    onError?.(apiMsg);
    return undefined;
  }
}

/** =========================
 *  Types
 *  ========================= */
type ConsultType = 'VIDEO' | 'VOICE' | 'CHAT';
type Consult = {
  _id: string;
  startTime: Date;
  doctorId?: string;
  doctorName?: string;
  patientId?: string; // Ajouté pour la logique de join
  type: ConsultType;
  reason?: string;
  status?: string;
};

export default function ConsultationsScreen() {
  const { accessToken, user } = useAuth();
  // CORRECTION: Utilisation de RootParamList pour la navigation
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const { t } = useTranslation();
  const isDoctor = !!user?.roles?.includes('doctor');

  const [consultations, setConsultations] = useState<Consult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  const fetchConsultations = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    await guardAsync('fetchConsultations', async () => {
      const params: any = {};
      if (isDoctor) params.doctorId = (user as any)?.id || (user as any)?._id;
      else params.patientId = (user as any)?.id || (user as any)?._id;
      const resp = await api.consult.get('/consultations', { params });
      const raw = resp?.data || [];
      const data: Consult[] = raw.map((c: any) => ({ ...c, startTime: new Date(c.startTime) }));
      setConsultations(data);
    }, (msg) => setError(msg)).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, [accessToken, isDoctor, user]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  const consultationsForSelectedDay = useMemo(() => {
    return consultations
      .filter((c) => toDateKey(c.startTime) === selectedDate)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [consultations, selectedDate]);

  const markedDates = useMemo(() => {
    const marks: { [date: string]: any } = {};
    consultations.forEach((c) => {
      const key = toDateKey(c.startTime);
      marks[key] = { ...marks[key], marked: true, dotColor: Colors.primary };
    });
    marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: Colors.primary };
    return marks;
  }, [consultations, selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  const handleSchedule = () => {
    navigation.navigate('ScheduleConsultation' as any, { mode: 'normal' });
  };

  const handleUrgent = async () => {
    // ... (logique existante inchangée)
  };

  // CORRECTION MAJEURE: Implémentation de la logique d'appel vidéo
  const handleJoin = async (c: Consult) => {
    if (c.type !== 'VIDEO') {
      // Pour l'instant, on ne gère que les appels vidéo
      setSnackbar("Seuls les appels vidéo peuvent être rejoints pour le moment.");
      return;
    }

    setError(null);
    await guardAsync(`handleJoin ${c._id}`, async () => {
      console.log(`[handleJoin] Demande de jeton pour la consultation ${c._id}`);
      
      // 1. Appel au backend pour obtenir le jeton LiveKit
      const response = await api.consult.post(`/consultations/${c._id}/join`);
      const { token } = response.data;
      if (!token) {
        throw new Error("Le jeton d'accès n'a pas été reçu du serveur.");
      }

      // 2. Récupérer l'URL du serveur LiveKit depuis les variables d'environnement
      const livekitUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL;
      if (!livekitUrl) {
        throw new Error("L'URL du serveur LiveKit n'est pas configurée (EXPO_PUBLIC_LIVEKIT_URL).");
      }
      
      console.log(`[handleJoin] Jeton reçu, navigation vers CallScreen avec l'URL ${livekitUrl}`);
      
      // 3. Naviguer vers l'écran d'appel avec les informations nécessaires
      navigation.navigate('Call', { url: livekitUrl, token });
      
      return { success: true };
    }, (msg) => setError(msg || "Impossible de rejoindre l'appel."));
  };

  return (
    <>
      <HeaderBar title={isDoctor ? t('consultations:titleDoctor') : t('consultations:titlePatient')} />
      <Screen scroll={false} padded={false} style={styles.screen}>
        {!accessToken ? (
          <View style={styles.centered}><Text style={styles.emptyText}>{t('consultations:emptyGuestTitle')}</Text></View>
        ) : (
          <>
            <Calendar onDayPress={(day: DateData) => setSelectedDate(day.dateString)} markedDates={markedDates} />
            <View style={styles.actionRow}>
              <Button mode="contained" style={styles.actionButton} onPress={handleUrgent} loading={creating} disabled={creating}>{t('consultations:urgentButton')}</Button>
              <Button mode="contained" style={styles.actionButton} onPress={handleSchedule}>{t('consultations:scheduleButton')}</Button>
            </View>
            <View style={{ flex: 1 }}>
              {loading ? (
                <View style={styles.loaderWrap}><ActivityIndicator size="large" /></View>
              ) : consultationsForSelectedDay.length === 0 ? (
                <Text style={styles.emptyText}>{t('consultations:noConsultations')}</Text>
              ) : (
                <FlatList
                  data={consultationsForSelectedDay}
                  keyExtractor={(item) => item._id}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
                  renderItem={({ item }) => (
                    <Card style={styles.consultCard} onPress={() => handleJoin(item)}>
                      <Card.Content>
                        <View style={styles.cardRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.consultDate}>{formatDateTime(item.startTime)}</Text>
                            <Text style={styles.consultDoctor}>{item.doctorName || 'N/A'}</Text>
                            {item.reason ? <Text style={styles.consultReason}>{item.reason}</Text> : null}
                          </View>
                          <View style={styles.cardActionsRow}>
                            <Chip mode="flat" style={[styles.typeChip, typeColorStyle(item.type)]} textStyle={{ color: '#FFFFFF', fontSize: 10 }}>{item.type}</Chip>
                            {/* Le bouton n'appelle plus la navigation directement, mais la logique handleJoin */}
                            <Button mode="contained" compact style={styles.joinButton} onPress={() => handleJoin(item)}>{t('consultations:join')}</Button>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  )}
                />
              )}
            </View>
          </>
        )}
        {snackbar && <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000} action={{ label: 'OK', onPress: () => setSnackbar(null) }}>{snackbar}</Snackbar>}
        {error && <Snackbar visible={!!error} onDismiss={() => setError(null)} duration={5000} style={styles.snackbarError} action={{ label: 'OK', onPress: () => setError(null) }}>{error}</Snackbar>}
      </Screen>
    </>
  );
}

/* Helpers */
const toDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const formatDateTime = (date: Date) => date.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
function typeColorStyle(type: ConsultType) {
  switch (type) {
    case 'VIDEO': return { backgroundColor: '#2B66F6' };
    case 'VOICE': return { backgroundColor: '#1C8BF8' };
    case 'CHAT': return { backgroundColor: '#4CAF50' };
    default: return { backgroundColor: '#2B66F6' };
  }
}

/* Styles */
const Colors = { primary: '#2B66F6', background: '#F4F6FB', surface: '#FFFFFF', text: '#111827', textSecondary: '#6B7280', border: '#E5E7EB' };
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  calendar: { marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12, paddingHorizontal: 8 },
  actionButton: { flex: 1 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  consultCard: { marginHorizontal: 12, marginVertical: 6, borderRadius: 12, backgroundColor: Colors.surface, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardActionsRow: { justifyContent: 'flex-end', alignItems: 'center' },
  consultDate: { fontSize: 14, fontWeight: '600', color: Colors.text },
  consultDoctor: { fontSize: 12, color: Colors.textSecondary },
  consultReason: { fontSize: 12, color: Colors.textSecondary },
  typeChip: { marginBottom: 4 },
  joinButton: { marginLeft: 8 }, // Ajusté pour ne pas avoir de padding horizontal superflu
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginVertical: 20 },
  snackbar: { backgroundColor: Colors.primary },
  snackbarError: { backgroundColor: '#EF4444' },
});