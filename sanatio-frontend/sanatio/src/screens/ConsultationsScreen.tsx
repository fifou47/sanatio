import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import HeaderBar from '../components/HeaderBar';
import Screen from '../components/Screen';
import EmptyState from '../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../navigation/RootNavigator';
import { useAuth } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api'; // Supposons un service API

// Supposons une interface pour les consultations
interface Consultation {
  _id: string;
  reason: string;
  startTime: string;
  type: 'VIDEO' | 'VOICE' | 'CHAT';
}

export default function ConsultationsScreen() {
  const { accessToken, user } = useAuth();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const requireAuth = () => rootNavigation.navigate('RequireAuth');
  const { t } = useTranslation();

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
        )}
      </Screen>
    </>
  );
}

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
});
