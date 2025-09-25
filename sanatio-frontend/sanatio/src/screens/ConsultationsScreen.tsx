<<<<<<< Updated upstream
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
=======
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
>>>>>>> Stashed changes
import HeaderBar from '../components/HeaderBar';
import Screen from '../components/Screen';
import { useAuth } from '../store/auth';
<<<<<<< Updated upstream
import { useTranslation } from 'react-i18next';
import { api } from '../services/api'; // Supposons un service API

// Supposons une interface pour les consultations
interface Consultation {
  _id: string;
  reason: string;
  startTime: string;
  type: 'VIDEO' | 'VOICE' | 'CHAT';
}
=======
import { RootParamList } from '../navigation/RootNavigator';
import { api } from '../services/api/http';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ConsultationStackParamList } from '../navigation/ConsultationsStack';

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
  // Montre la trace exacte dans la console (où on a appelé logError/guardAsync)
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
  startTime: Date;     // date transformée
  doctorId?: string;
  doctorName?: string;
  type: ConsultType;
  reason?: string;
  status?: string;
};
>>>>>>> Stashed changes

export default function ConsultationsScreen() {
  const { accessToken, user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<ConsultationStackParamList, 'ConsultationsHome'>>();
  const { t } = useTranslation();
  const isDoctor = !!user?.roles?.includes('doctor');

<<<<<<< Updated upstream
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  const isDoctor = user?.roles?.includes('doctor');

  useEffect(() => {
    if (accessToken) {
      // TODO: Le service `api` doit être configuré pour inclure le jeton d'authentification
      // dans les en-têtes pour que cet appel fonctionne.
      // Exemple: api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      api.get('/consultations') // Cet endpoint doit retourner les consultations de l'utilisateur connecté
        .then(response => setConsultations(response.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [accessToken]);

  const handleJoinCall = async (consultationId: string) => {
    try {
      // 1. Obtenir le jeton du backend
      const response = await api.post(`/consultations/${consultationId}/join`);
      const { token } = response.data;

      // 2. Naviguer vers l'écran d'appel
      const livekitUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';
      rootNavigation.navigate('Call', { url: livekitUrl, token });

    } catch (error) {
      console.error("Erreur pour rejoindre l'appel:", error);
      // Afficher une alerte à l'utilisateur
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <>
      <HeaderBar title={isDoctor ? t('consultations:titleDoctor') : t('consultations:titlePatient')} />
      <Screen>
        {!accessToken ? (
          <EmptyState
            icon="lock-closed-outline"
            title={t('consultations:emptyGuestTitle')}
            description={t('consultations:emptyGuestDescription')}
            actionLabel={t('consultations:cta')}
            onAction={requireAuth}
          />
        ) : consultations.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={isDoctor ? t('consultations:emptyDoctorTitle') : t('consultations:emptyPatientTitle')}
            description={isDoctor ? t('consultations:emptyDoctorDescription') : t('consultations:emptyPatientDescription')}
          />
        ) : (
          <FlatList
            data={consultations}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.consultationItem}>
                <Text style={styles.consultationReason}>{item.reason}</Text>
                <Text>{new Date(item.startTime).toLocaleString()}</Text>
                {item.type === 'VIDEO' && (
                  <TouchableOpacity style={styles.joinButton} onPress={() => handleJoinCall(item._id)}>
                    <Text style={styles.joinButtonText}>Rejoindre l'appel vidéo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
=======
  const [consultations, setConsultations] = useState<Consult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Date sélectionnée (YYYY-MM-DD)
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  /** Chargement des consultations depuis l’API */
  const fetchConsultations = useCallback(async () => {
    if (!accessToken) {
      console.warn('[Consultations] Pas de token, fetch ignoré');
      return;
    }
    setLoading(true);
    setError(null);

    await guardAsync('fetchConsultations', async () => {
      const params: any = {};
      if (isDoctor) params.doctorId = (user as any)?.id || (user as any)?._id;
      else params.patientId = (user as any)?.id || (user as any)?._id;

      console.log('[fetchConsultations] params =>', params);
      const resp = await api.consult.get('/consultations', { params });
      const raw = resp?.data || [];
      console.log('[fetchConsultations] response count =>', raw.length);

      const data: Consult[] = raw.map((c: any) => ({
        ...c,
        startTime: new Date(c.startTime),
      }));

      // Un petit aperçu en console pour la journée sélectionnée
      const preview = data
        .filter((c) => toDateKey(c.startTime) === selectedDate)
        .map((c) => ({ id: c._id, startTime: c.startTime, type: c.type, doctor: c.doctorName || c.doctorId }));
      if (preview.length) {
        console.table(preview);
      }

      setConsultations(data);
      return { total: data.length };
    }, (msg) => setError(msg))
      .finally?.(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [accessToken, isDoctor, user, selectedDate]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  /** Liste des consultations pour le jour sélectionné */
  const consultationsForSelectedDay = useMemo(() => {
    return consultations
      .filter((c) => toDateKey(c.startTime) === selectedDate)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [consultations, selectedDate]);

  // Marquage des dates avec au moins une consultation
  const markedDates = useMemo(() => {
    const marks: { [date: string]: any } = {};
    consultations.forEach((c) => {
      const key = toDateKey(c.startTime);
      marks[key] = {
        ...marks[key],
        marked: true,
        dotColor: Colors.primary,
      };
    });
    // surligner la date sélectionnée
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: Colors.primary,
    };
    return marks;
  }, [consultations, selectedDate]);

  // Actions pour créer et rejoindre
  const onRefresh = () => {
    setRefreshing(true);
    console.log('[onRefresh] Pull to refresh');
    fetchConsultations();
  };

  const handleSchedule = () => {
    console.log('[handleSchedule] navigate ScheduleConsultation', { mode: 'normal' });
    navigation.navigate('ScheduleConsultation' as any, { mode: 'normal' });
  };

  const handleUrgent = async () => {
    if (!user) {
      console.warn('[handleUrgent] user manquant');
      return;
    }
    setCreating(true);
    setError(null);

    await guardAsync('handleUrgent', async () => {
      const payload = {
        patientId: (user as any).id || (user as any)._id,
        startTime: new Date().toISOString(),
        duration: 30,
        type: 'VIDEO' as ConsultType,
        reason: t('consultations:urgentReason') || 'Urgence',
      };
      console.log('[handleUrgent] payload =>', payload);

      const resp = await api.consult.post('/consultations', payload);
      console.log('[handleUrgent] created =>', resp?.data?._id);

      setSnackbar(t('consultations:urgentCreated') || 'Consultation urgente créée');
      await fetchConsultations();
      setSelectedDate(toDateKey(new Date()));
      return resp?.data;
    }, (msg) => setError(msg))
      .finally?.(() => setCreating(false));
  };

  const handleJoin = async (c: Consult) => {
    setError(null);
    await guardAsync('handleJoin', async () => {
      console.log('[handleJoin] join =>', { id: c._id, type: c.type, start: c.startTime });
      await api.consult.put(`/consultations/${c._id}/status`, { status: 'ONGOING' });
      // TODO: navigation selon type
      // navigation.navigate('VideoCall', { consultId: c._id }) ...
      return { id: c._id, status: 'ONGOING' };
    }, (msg) => setError(msg));
  };

  return (
    <>
      <HeaderBar
        title={isDoctor ? t('consultations:titleDoctor') : t('consultations:titlePatient')}
        onBack={() => {
          console.log('[HeaderBar onBack]');
          navigation.goBack();
        }}
        style={styles.headerBar}
      />
      <Screen scroll={false} padded={false} style={styles.screen}>
        {!accessToken ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {t('consultations:emptyGuestTitle') || 'Veuillez vous connecter pour consulter vos rendez-vous.'}
            </Text>
          </View>
        ) : (
          <>
            {/* Calendrier mensuel */}
            <Calendar
              onDayPress={(day: DateData) => {
                console.log('[Calendar onDayPress]', day);
                setSelectedDate(day.dateString);
              }}
              markedDates={markedDates}
              style={styles.calendar}
              theme={{
                selectedDayBackgroundColor: Colors.primary,
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
                monthTextColor: Colors.text,
                textSectionTitleColor: Colors.textSecondary,
              }}
            />

            {/* Actions Urgent / Planifier */}
            <View style={styles.actionRow}>
              <Button
                mode="contained"
                style={styles.actionButton}
                onPress={handleUrgent}
                loading={creating}
                disabled={creating}
                accessibilityLabel="create-urgent-consultation"
              >
                {t('consultations:urgentButton') || 'Urgent'}
              </Button>
              <Button
                mode="contained"
                style={styles.actionButton}
                onPress={handleSchedule}
                accessibilityLabel="navigate-schedule-consultation"
              >
                {t('consultations:scheduleButton') || 'Planifier'}
              </Button>
            </View>

            {/* Liste des consultations du jour */}
            <View style={{ flex: 1 }}>
              {loading ? (
                <View style={styles.loaderWrap}>
                  <ActivityIndicator size="large" />
                </View>
              ) : consultationsForSelectedDay.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t('consultations:noConsultations') || 'Aucune consultation ce jour.'}
                </Text>
              ) : (
                <FlatList
                  data={consultationsForSelectedDay}
                  keyExtractor={(item) => item._id}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={[Colors.primary]}
                    />
                  }
                  renderItem={({ item }) => (
                    <Card style={styles.consultCard} onPress={() => handleJoin(item)}>
                      <Card.Content>
                        <View style={styles.cardRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.consultDate}>{formatDateTime(item.startTime)}</Text>
                            <Text style={styles.consultDoctor}>{item.doctorName || item.doctorId}</Text>
                            {item.reason ? (
                              <Text style={styles.consultReason}>{item.reason}</Text>
                            ) : null}
                          </View>
                          <View style={styles.cardActionsRow}>
                            <Chip
                              mode="flat"
                              style={[styles.typeChip, typeColorStyle(item.type)]}
                              textStyle={{ color: '#FFFFFF', fontSize: 10 }}
                            >
                              {item.type}
                            </Chip>
                            <Button
                              mode="contained"
                              compact
                              style={styles.joinButton}
                              onPress={() => handleJoin(item)}
                              accessibilityLabel={`join-${item._id}`}
                            >
                              {t('consultations:join') || 'Rejoindre'}
                            </Button>
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

        {/* Snackbar success */}
        {snackbar && (
          <Snackbar
            visible={!!snackbar}
            onDismiss={() => setSnackbar(null)}
            duration={4000}
            action={{ label: t('common:ok') || 'OK', onPress: () => setSnackbar(null) }}
            style={styles.snackbar}
          >
            {snackbar}
          </Snackbar>
        )}
        {/* Snackbar erreur */}
        {error && (
          <Snackbar
            visible={!!error}
            onDismiss={() => setError(null)}
            duration={5000}
            action={{ label: t('common:ok') || 'OK', onPress: () => setError(null) }}
            style={styles.snackbarError}
          >
            {error}
          </Snackbar>
>>>>>>> Stashed changes
        )}
      </Screen>
    </>
  );
}

<<<<<<< Updated upstream
const styles = StyleSheet.create({
  consultationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  consultationReason: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  joinButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
=======
/* Helpers */
const toDateKey = (d: Date) => {
  // Évite les surprises de fuseau en forçant YYYY-MM-DD local
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDateTime = (date: Date) =>
  date.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

function typeColorStyle(type: ConsultType) {
  switch (type) {
    case 'VIDEO':
      return { backgroundColor: '#2B66F6' };
    case 'VOICE':
      return { backgroundColor: '#1C8BF8' };
    case 'CHAT':
      return { backgroundColor: '#4CAF50' };
    default:
      return { backgroundColor: '#2B66F6' };
  }
}

/* Styles */
const Colors = {
  primary: '#2B66F6',
  background: '#F4F6FB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  headerBar: { backgroundColor: Colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  calendar: { marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12, paddingHorizontal: 8 },
  actionButton: { flex: 1 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  consultCard: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    elevation: 1,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardActionsRow: { justifyContent: 'flex-end', alignItems: 'center' },
  consultDate: { fontSize: 14, fontWeight: '600', color: Colors.text },
  consultDoctor: { fontSize: 12, color: Colors.textSecondary },
  consultReason: { fontSize: 12, color: Colors.textSecondary },
  typeChip: { marginBottom: 4 },
  joinButton: { paddingHorizontal: 8, marginLeft: 8 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginVertical: 20 },
  snackbar: { backgroundColor: Colors.primary },
  snackbarError: { backgroundColor: '#EF4444' },
>>>>>>> Stashed changes
});
