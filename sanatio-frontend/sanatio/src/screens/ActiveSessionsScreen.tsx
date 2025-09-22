import React, { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Surface, Text, Switch, Snackbar } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Screen from '../components/Screen';
import HeaderBar from '../components/HeaderBar';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Radius, Shadows, Spacing } from '../theme/theme';
import { useAuth } from '../store/auth';
import { api } from '../services/api/http';
import { toAppError } from '../services/api/errors';
import { useTranslation } from 'react-i18next';
import { SettingsStackParamList } from '../navigation/SettingsStack';

type SessionItem = {
  sessionId: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeen: string;
  isCurrent: boolean;
};

type SessionsResponse = {
  autoLockEnabled: boolean;
  sessions: Array<{
    sessionId: string;
    userAgent: string | null;
    ip: string | null;
    createdAt: string;
    lastSeen: string;
    isCurrent: boolean;
  }>;
};

type Navigation = NativeStackNavigationProp<SettingsStackParamList, 'ActiveSessions'>;

export default function ActiveSessionsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  const { sessionId: currentSessionId, signOut } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.auth.get<SessionsResponse>('/auth/sessions');
      setAutoLockEnabled(Boolean(data.autoLockEnabled));
      setSessions(
        data.sessions.map((item) => ({
          sessionId: item.sessionId,
          userAgent: item.userAgent,
          ip: item.ip,
          createdAt: item.createdAt,
          lastSeen: item.lastSeen,
          isCurrent: item.isCurrent,
        })),
      );
    } catch (err) {
      const appError = toAppError(err, t('sessions:errorFetch'));
      const message = appError.code === 'ERR_NETWORK' ? t('common:offline') : appError.message;
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSessions();
    }, [fetchSessions]),
  );

  const formatDateTime = useMemo(() => new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }), []);

  const describeAgent = (userAgent: string | null) => {
    if (!userAgent) return t('sessions:unknownDevice');
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('Macintosh')) return 'macOS';
    if (userAgent.includes('Windows')) return 'Windows';
    return userAgent.slice(0, 64);
  };

  const handleTerminate = (session: SessionItem) => {
    Alert.alert(
      t('sessions:terminateTitle'),
      session.isCurrent ? t('sessions:terminateCurrent') : t('sessions:terminateOther'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('sessions:terminateButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.auth.delete(`/auth/sessions/${session.sessionId}`);
              if (session.sessionId === currentSessionId) {
                await signOut();
              } else {
                setSessions((prev) => prev.filter((item) => item.sessionId !== session.sessionId));
              }
              setSnackbar(t('sessions:terminateSuccess'));
            } catch (err) {
              const appError = toAppError(err, t('sessions:terminateError'));
              const message = appError.code === 'ERR_NETWORK' ? t('common:offline') : appError.message;
              setSnackbar(message);
            }
          },
        },
      ],
    );
  };

  const handleToggleAutoLock = async (value: boolean) => {
    const previous = autoLockEnabled;
    setAutoLockEnabled(value);
    try {
      await api.auth.post('/auth/sessions/lock', { enabled: value });
      setSnackbar(value ? t('sessions:autoLockEnabled') : t('sessions:autoLockDisabled'));
    } catch (err) {
      const appError = toAppError(err, t('sessions:autoLockError'));
      const message = appError.code === 'ERR_NETWORK' ? t('common:offline') : appError.message;
      setAutoLockEnabled(previous);
      setSnackbar(message);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  const renderSession = ({ item }: { item: SessionItem }) => (
    <Surface style={styles.sessionCard} elevation={1}>
      <View style={styles.sessionHeader}>
        <Text variant="titleMedium" style={styles.sessionTitle} accessibilityRole="text">
          {describeAgent(item.userAgent)}
        </Text>
        {item.isCurrent ? (
          <View style={styles.badgeCurrent} accessibilityLabel={t('sessions:currentBadge')}>
            <Text style={styles.badgeText}>{t('sessions:current')}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.sessionMeta} accessibilityLabel={t('sessions:ipLabel', { ip: item.ip ?? t('sessions:unknownIP') })}>
        {item.ip ?? t('sessions:unknownIP')}
      </Text>
      <Text style={styles.sessionMeta}>
        {t('sessions:createdAt', { date: formatDateTime.format(new Date(item.createdAt)) })}
      </Text>
      <Text style={styles.sessionMeta}>
        {t('sessions:lastSeen', { date: formatDateTime.format(new Date(item.lastSeen)) })}
      </Text>
      <PrimaryButton
        mode="outlined"
        onPress={() => handleTerminate(item)}
        accessibilityHint={t('sessions:terminateHint')}
      >
        {item.isCurrent ? t('sessions:terminateCurrentButton') : t('sessions:terminateButton')}
      </PrimaryButton>
    </Surface>
  );

  const content = () => {
    if (loading) {
      return (
        <View style={styles.skeletonWrapper}>
          {[0, 1, 2].map((key) => (
            <Surface key={key} style={[styles.sessionCard, styles.skeletonCard]}>
              <View style={[styles.skeletonLine, { width: '40%' }]} />
              <View style={[styles.skeletonLine, { width: '70%' }]} />
              <View style={[styles.skeletonLine, { width: '60%' }]} />
              <View style={[styles.skeletonLine, { width: '50%' }]} />
            </Surface>
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <Surface style={styles.errorSurface} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
          <PrimaryButton mode="outlined" onPress={fetchSessions}>
            {t('sessions:retry')}
          </PrimaryButton>
        </Surface>
      );
    }

    if (!sessions.length) {
      return (
        <Surface style={styles.emptySurface}>
          <Text style={styles.emptyTitle}>{t('sessions:emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('sessions:emptySubtitle')}</Text>
        </Surface>
      );
    }

    return (
      <View style={styles.listWrapper}>
        {sessions.map((session) => (
          <View key={session.sessionId}>{renderSession({ item: session })}</View>
        ))}
      </View>
    );
  };

  return (
    <>
      <HeaderBar title={t('sessions:title')} onBack={() => navigation.goBack()} />
      <Screen scroll={false} style={styles.screenRoot}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={styles.autoLockCard} elevation={1}>
            <View style={styles.autoLockContent}>
              <View>
                <Text variant="titleMedium" style={styles.sessionTitle}>
                  {t('sessions:autoLockTitle')}
                </Text>
                <Text style={styles.sessionMeta}>{t('sessions:autoLockDescription')}</Text>
              </View>
              <Switch value={autoLockEnabled} onValueChange={handleToggleAutoLock} />
            </View>
          </Surface>
          {content()}
        </ScrollView>
      </Screen>
      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={4000}
        action={{ label: t('common:ok'), onPress: () => setSnackbar(null) }}
      >
        {snackbar}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.s20,
    paddingBottom: Spacing.s32,
  },
  screenRoot: {
    flex: 1,
  },
  autoLockCard: {
    borderRadius: Radius.xl,
    padding: Spacing.s20,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  autoLockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.s16,
  },
  listWrapper: {
    gap: Spacing.s16,
  },
  sessionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.s20,
    backgroundColor: Colors.white,
    gap: Spacing.s12,
    ...Shadows.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionTitle: {
    color: Colors.text,
  },
  sessionMeta: {
    color: Colors.textMuted,
  },
  badgeCurrent: {
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s4,
  },
  badgeText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  skeletonWrapper: {
    gap: Spacing.s16,
  },
  skeletonCard: {
    backgroundColor: Colors.primarySoft,
  },
  skeletonLine: {
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    opacity: 0.5,
  },
  emptySurface: {
    borderRadius: Radius.xl,
    padding: Spacing.s24,
    gap: Spacing.s8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
  errorSurface: {
    borderRadius: Radius.xl,
    padding: Spacing.s20,
    gap: Spacing.s12,
    backgroundColor: Colors.errorSoft,
  },
  errorText: {
    color: Colors.error,
  },
});
