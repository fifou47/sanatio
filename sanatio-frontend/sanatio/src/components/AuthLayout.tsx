import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import BrandLogo from './BrandLogo';
import { Radius, Shadows, Spacing, Colors } from '../theme/theme';
import { useTranslation } from 'react-i18next';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tagline?: string;
};

export default function AuthLayout({ title, subtitle, children, footer, tagline }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();
  const heroTagline = tagline ?? t('auth:tagline');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', default: undefined })}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.heroWrapper}>
          <View style={[styles.pill, { backgroundColor: Colors.primarySoft }]} />
          <View style={[styles.pillSecondary, { backgroundColor: Colors.successSoft }]} />
          <BrandLogo tagline={heroTagline} />
          <Text variant="displaySmall" style={styles.heroTitle}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodyMedium" style={styles.heroSubtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Surface style={styles.card} elevation={3}>
          {children}
        </Surface>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.s24,
    paddingBottom: Spacing.s32,
    paddingTop: Spacing.s32,
    gap: Spacing.s24,
  },
  heroWrapper: {
    alignItems: 'center',
    gap: Spacing.s12,
    position: 'relative',
    overflow: 'hidden',
  },
  heroTitle: {
    textAlign: 'center',
  },
  heroSubtitle: {
    textAlign: 'center',
    color: Colors.textMuted,
  },
  card: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.s24,
    paddingHorizontal: Spacing.s20,
    ...Shadows.md,
    gap: Spacing.s16,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.s12,
  },
  pill: {
    position: 'absolute',
    top: -60,
    right: 32,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.4,
  },
  pillSecondary: {
    position: 'absolute',
    top: -20,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.3,
  },
});

