import React from 'react';
import HeaderBar from '../components/HeaderBar';
import Screen from '../components/Screen';
import EmptyState from '../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../navigation/RootNavigator';
import { useAuth } from '../store/auth';
import { useTranslation } from 'react-i18next';

export default function ConsultationsScreen() {
  const { accessToken, user } = useAuth();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const requireAuth = () => rootNavigation.navigate('RequireAuth');
  const { t } = useTranslation();

  const isDoctor = user?.roles?.includes('doctor');
  const title = isDoctor ? t('consultations:emptyDoctorTitle') : t('consultations:emptyPatientTitle');
  const description = isDoctor
    ? t('consultations:emptyDoctorDescription')
    : t('consultations:emptyPatientDescription');

  return (
    <>
      <HeaderBar title={isDoctor ? t('consultations:titleDoctor') : t('consultations:titlePatient')} />
      <Screen>
        {accessToken ? (
          <EmptyState
            icon="calendar-outline"
            title={title}
            description={description}
          />
        ) : (
          <EmptyState
            icon="lock-closed-outline"
            title={t('consultations:emptyGuestTitle')}
            description={t('consultations:emptyGuestDescription')}
            actionLabel={t('consultations:cta')}
            onAction={requireAuth}
          />
        )}
      </Screen>
    </>
  );
}
