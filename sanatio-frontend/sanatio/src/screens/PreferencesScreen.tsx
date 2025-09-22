
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import Screen from '../components/Screen';
import HeaderBar from '../components/HeaderBar';
import SettingRow from '../components/SettingRow';
import { Colors, Radius, Shadows, Spacing } from '../theme/theme';
import { useTranslation } from 'react-i18next';

type Toggle = {
  key: string;
  title: string;
  description: string;
};

export default function PreferencesScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const [state, setState] = React.useState<Record<string, boolean>>({
    notifications: true,
    email: true,
    tips: false,
  });

  const toggles = useMemo<Toggle[]>(
    () => [
      {
        key: 'notifications',
        title: t('preferences:toggles.notifications.title'),
        description: t('preferences:toggles.notifications.description'),
      },
      {
        key: 'email',
        title: t('preferences:toggles.email.title'),
        description: t('preferences:toggles.email.description'),
      },
      {
        key: 'tips',
        title: t('preferences:toggles.tips.title'),
        description: t('preferences:toggles.tips.description'),
      },
    ],
    [i18n.language, t],
  );

  const handleToggle = (key: string) => {
    setState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <HeaderBar title={t('preferences:title')} onBack={() => navigation.goBack()} />
      <Screen contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('preferences:notificationsHeader')}
          </Text>
          <View style={styles.card}>
            {toggles.map((toggle) => (
              <SettingRow
                key={toggle.key}
                icon="notifications-outline"
                title={toggle.title}
                description={toggle.description}
                rightElement={
                  <Switch value={state[toggle.key]} onValueChange={() => handleToggle(toggle.key)} />
                }
              />
            ))}
          </View>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.s24,
    paddingBottom: Spacing.s32,
  },
  section: {
    gap: Spacing.s12,
  },
  sectionTitle: {
    color: Colors.text,
  },
  card: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadows.sm,
  },
});
