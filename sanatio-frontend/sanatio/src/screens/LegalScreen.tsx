
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import HeaderBar from '../components/HeaderBar';
import Screen from '../components/Screen';
import { Colors, Radius, Shadows, Spacing } from '../theme/theme';
import { useTranslation } from 'react-i18next';

export default function LegalScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const legalItems = useMemo(
    () => [
      {
        title: t('legal:items.termsTitle'),
        description: t('legal:items.termsDescription'),
      },
      {
        title: t('legal:items.privacyTitle'),
        description: t('legal:items.privacyDescription'),
      },
      {
        title: t('legal:items.securityTitle'),
        description: t('legal:items.securityDescription'),
      },
    ],
    [i18n.language, t],
  );
  return (
    <>
      <HeaderBar title={t('legal:title')} onBack={() => navigation.goBack()} />
      <Screen contentContainerStyle={styles.container}>
        <View style={styles.card}>
          {legalItems.map((item) => (
            <View key={item.title} style={styles.item}>
              <Text variant="titleMedium" style={styles.itemTitle}>
                {item.title}
              </Text>
              <Text variant="bodyMedium" style={styles.itemDescription}>
                {item.description}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="labelSmall" style={styles.note}>
          {t('legal:contact')}
        </Text>
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
    backgroundColor: Colors.white,
    padding: Spacing.s24,
    gap: Spacing.s16,
    ...Shadows.sm,
  },
  item: {
    gap: Spacing.s8,
  },
  itemTitle: {
    color: Colors.text,
  },
  itemDescription: {
    color: Colors.textMuted,
  },
  note: {
    textAlign: 'center',
    color: Colors.textMuted,
  },
});
