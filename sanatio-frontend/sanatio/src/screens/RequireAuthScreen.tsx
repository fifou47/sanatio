import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootParamList } from '../navigation/RootNavigator';
import PrimaryButton from '../components/PrimaryButton';
import BrandLogo from '../components/BrandLogo';
import { Colors, Radius, Shadows, Spacing } from '../theme/theme';
import { useTranslation } from 'react-i18next';
import { consumePendingProtectedRoute } from '../store/auth';

type Props = NativeStackScreenProps<RootParamList, 'RequireAuth'>;

export default function RequireAuthScreen({ navigation }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const handleLogin = () => {
    navigation.navigate('AuthStack', { screen: 'Login' });
  };

  const handleSignup = () => {
    navigation.navigate('AuthStack', { screen: 'Signup' });
  };

  return (
    <View style={styles.overlay}>
      <Pressable
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel={t('common:cancel')}
        onPress={() => {
          consumePendingProtectedRoute('Home');
          navigation.goBack();
        }}
      />
      <View style={styles.center}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <BrandLogo size={40} tagline={t('auth:requireAuth.tagline')} />
          <Text variant="headlineMedium" style={styles.title}>
            {t('auth:requireAuth.title')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t('auth:requireAuth.subtitle')}
          </Text>
          <PrimaryButton style={styles.action} onPress={handleLogin}>
            {t('auth:requireAuth.login')}
          </PrimaryButton>
          <PrimaryButton mode="outlined" onPress={handleSignup}>
            {t('auth:requireAuth.signup')}
          </PrimaryButton>
          <Button mode="text" onPress={() => {
            consumePendingProtectedRoute('Home');
            navigation.goBack();
          }}>
            {t('auth:requireAuth.guest')}
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: Spacing.s24,
  },
  center: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.xl,
    padding: Spacing.s24,
    gap: Spacing.s16,
    ...Shadows.lg,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.textMuted,
  },
  action: {
    marginTop: Spacing.s8,
  },
});
