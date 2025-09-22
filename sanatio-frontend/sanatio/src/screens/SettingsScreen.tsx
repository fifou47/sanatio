
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Surface, Switch, Text } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import HeaderBar from '../components/HeaderBar';
import Screen from '../components/Screen';
import SettingRow from '../components/SettingRow';
import PrimaryButton from '../components/PrimaryButton';
import { Colors, Radius, Shadows, Spacing } from '../theme/theme';
import { useAuth } from '../store/auth';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../theme/ThemeProvider';
import type { SettingsStackParamList } from '../navigation/SettingsStack';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

export default function SettingsScreen({ navigation }: Props) {
  const { signOut, user } = useAuth();
  const { t, i18n } = useTranslation();
  const { isDark, toggleMode } = useThemeMode();
  const version =
    Constants.expoConfig?.version ??
    (Constants.manifest as any)?.version ??
    '1.0.0';

  const handleLanguage = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next).catch((err) => console.warn('[i18n] language switch failed', err));
  };

  return (
    <>
      <HeaderBar title={t('settings:title')} />
      <Screen contentContainerStyle={styles.container}>
        <Surface style={styles.card} elevation={2}>
          <View style={styles.cardIcon}>
            <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
          </View>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {user ? t('settings:heroTitleUser') : t('settings:heroTitleGuest')}
          </Text>
          <Text variant="bodyMedium" style={styles.cardSubtitle}>
            {user ? t('settings:heroSubtitleUser') : t('settings:heroSubtitleGuest')}
          </Text>
          {user ? (
            <PrimaryButton onPress={() => navigation.getParent()?.navigate('Profile')}>
              {t('settings:profileButton')}
            </PrimaryButton>
          ) : (
            <PrimaryButton onPress={() => navigation.getParent()?.navigate('AuthStack', { screen: 'Login' })}>
              {t('settings:signin')}
            </PrimaryButton>
          )}
          {!user ? (
            <Button mode="text" onPress={() => navigation.getParent()?.navigate('AuthStack', { screen: 'Signup' })}>
              {t('settings:signup')}
            </Button>
          ) : null}
        </Surface>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings:generalSection')}
          </Text>
          <Surface style={styles.sectionCard} elevation={1}>
            <SettingRow
              icon="color-palette-outline"
              title={t('settings:appearance')}
              description={isDark ? t('settings:appearanceDark') : t('settings:appearanceLight')}
              rightElement={<Switch value={isDark} onValueChange={toggleMode} />}
            />
            <SettingRow
              icon="language-outline"
              title={t('settings:language')}
              description={t('settings:languageDescription')}
              value={i18n.language === 'fr' ? t('common:french') : t('common:english')}
              onPress={handleLanguage}
            />
            <SettingRow
              icon="earth-outline"
              title={t('settings:country')}
              description={t('settings:countryDescription')}
              value="France"
            />
            {user ? (
              <SettingRow
                icon="lock-closed-outline"
                title={t('settings:sessionsTitle')}
                description={t('settings:sessionsDescription')}
                onPress={() => navigation.navigate('ActiveSessions')}
              />
            ) : null}
          </Surface>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings:privacySection')}
          </Text>
          <Surface style={styles.sectionCard} elevation={1}>
            <SettingRow
              icon="shield-outline"
              title={t('settings:preferences')}
              description={t('settings:preferencesDescription')}
              onPress={() => navigation.navigate('Preferences')}
            />
            <SettingRow
              icon="document-text-outline"
              title={t('settings:legal')}
              description={t('settings:legalDescription')}
              onPress={() => navigation.navigate('Legal')}
            />
          </Surface>
        </View>

        <Surface style={styles.footerCard} elevation={0}>
          <PrimaryButton mode="outlined" onPress={signOut}>
            {t('settings:signOut')}
          </PrimaryButton>
          <Text variant="labelSmall" style={styles.version}>
            {t('settings:version', { version })}
          </Text>
        </Surface>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.s24,
    paddingBottom: Spacing.s32,
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.s24,
    gap: Spacing.s16,
    backgroundColor: Colors.primarySoft,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: Colors.text,
  },
  cardSubtitle: {
    color: Colors.textMuted,
  },
  section: {
    gap: Spacing.s12,
  },
  sectionTitle: {
    color: Colors.text,
  },
  sectionCard: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  footerCard: {
    borderRadius: Radius.xl,
    padding: Spacing.s20,
    gap: Spacing.s12,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  version: {
    color: Colors.textMuted,
  },
});
