import React from 'react';
import HeaderBar from '../components/HeaderBar';
import Screen from '../components/Screen';
import EmptyState from '../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../navigation/RootNavigator';
import { useAuth } from '../store/auth';
import { useTranslation } from 'react-i18next';

export default function BillingScreen() {
  const { accessToken } = useAuth();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const requireAuth = () => rootNavigation.navigate('RequireAuth');
  const { t } = useTranslation();

  return (
    <>
      <HeaderBar title={t('billing:title')} />
      <Screen>
        {accessToken ? (
          <EmptyState
            icon="card-outline"
            title={t('billing:emptyAuthTitle')}
            description={t('billing:emptyAuthDescription')}
          />
        ) : (
          <EmptyState
            icon="shield-checkmark-outline"
            title={t('billing:emptyGuestTitle')}
            description={t('billing:emptyGuestDescription')}
            actionLabel={t('billing:cta')}
            onAction={requireAuth}
          />
        )}
      </Screen>
    </>
  );
}
