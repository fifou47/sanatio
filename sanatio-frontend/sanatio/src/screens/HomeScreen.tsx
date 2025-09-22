import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import Screen from '../components/Screen';
import HeaderBar from '../components/HeaderBar';
import PrimaryButton from '../components/PrimaryButton';
import BrandLogo from '../components/BrandLogo';
import { Spacing, Radius, Shadows, Colors } from '../theme/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../store/auth';
import { useTranslation } from 'react-i18next';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const services = useMemo(
    () => [
      {
        key: 'chat',
        title: t('home:services.chat.title'),
        description: t('home:services.chat.description'),
        icon: 'chatbubble-ellipses-outline' as const,
      },
      {
        key: 'consultations',
        title: t('home:services.consultations.title'),
        description: t('home:services.consultations.description'),
        icon: 'medkit-outline' as const,
      },
      {
        key: 'billing',
        title: t('home:services.billing.title'),
        description: t('home:services.billing.description'),
        icon: 'card-outline' as const,
      },
    ],
    [i18n.language, t],
  );

  const goToAuth = () => {
    if (user) {
      navigation.navigate('Profile');
    } else {
      navigation.getParent?.()?.navigate('AuthStack', { screen: 'Login' });
    }
  };

  return (
    <>
      <HeaderBar title={t('home:headerTitle')} />
      <Screen contentContainerStyle={styles.container}> 
        <Surface style={styles.hero} elevation={0}>
          <View style={styles.heroTop}>
            <BrandLogo tagline={t('home:heroTagline')} centered={false} />
            <Ionicons name="heart-circle" size={52} color={Colors.success} />
          </View>
          <Text variant="headlineMedium" style={styles.heroTitle}>
            {t('home:heroTitle')}
          </Text>
          <Text variant="bodyMedium" style={styles.heroSubtitle}>
            {t('home:heroSubtitle')}
          </Text>
          <PrimaryButton onPress={goToAuth}>
            {user ? t('home:ctaSigned') : t('home:ctaGuest')}
          </PrimaryButton>
        </Surface>

        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">{t('home:servicesHeader')}</Text>
          <Text variant="bodyMedium" style={styles.sectionSubtitle}>
            {t('home:servicesDescription')}
          </Text>
        </View>

        <View style={styles.cards}>
          {services.map((service) => (
            <Surface key={service.key} style={styles.card} elevation={2}>
              <View style={styles.cardIcon}>
                <Ionicons name={service.icon} size={28} color={Colors.primary} />
              </View>
              <Text variant="titleMedium">{service.title}</Text>
              <Text variant="bodyMedium" style={styles.cardDescription}>
                {service.description}
              </Text>
            </Surface>
          ))}
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
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.s24,
    backgroundColor: Colors.primarySoft,
    gap: Spacing.s16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    color: Colors.text,
  },
  heroSubtitle: {
    color: Colors.textMuted,
  },
  sectionHeader: {
    gap: Spacing.s8,
  },
  sectionSubtitle: {
    color: Colors.textMuted,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s16,
  },
  card: {
    flexBasis: '48%',
    borderRadius: Radius.lg,
    padding: Spacing.s16,
    gap: Spacing.s12,
    ...Shadows.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDescription: {
    color: Colors.textMuted,
  },
});
