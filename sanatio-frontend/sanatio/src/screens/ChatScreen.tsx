import React from 'react';
import HeaderBar from '../components/HeaderBar';
import Screen from '../components/Screen';
import EmptyState from '../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../navigation/RootNavigator';
import { useAuth } from '../store/auth';
import { useTranslation } from 'react-i18next';

export default function ChatScreen() {
  const { accessToken } = useAuth();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const requireAuth = () => rootNavigation.navigate('RequireAuth');
  const { t } = useTranslation();

  return (
    <>
      <HeaderBar title={t('chat:title')} />
      <Screen>
        {accessToken ? (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title={t('chat:emptyAuthTitle')}
            description={t('chat:emptyAuthDescription')}
          />
        ) : (
          <EmptyState
            icon="log-in-outline"
            title={t('chat:emptyGuestTitle')}
            description={t('chat:emptyGuestDescription')}
            actionLabel={t('chat:cta')}
            onAction={requireAuth}
          />
        )}
      </Screen>
    </>
  );
}
