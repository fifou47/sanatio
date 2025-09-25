import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Text } from 'react-native-paper';
import Screen from '../components/Screen';
import HeaderBar from '../components/HeaderBar';
import PrimaryButton from '../components/PrimaryButton';
import Avatar from '../components/Avatar';
import { useAuth } from '../store/auth';
import { ensurePatientProfile, getStoredPatientId } from '../services/patient';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../navigation/RootNavigator';
import { api } from '../services/api/http';
import { Colors, Radius, Shadows, Spacing } from '../theme/theme';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const { user } = useAuth();
  const [patientId, setPatientId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [account, setAccount] = useState<{ name?: string | null; phone?: string | null } | null>(null);
  const { t } = useTranslation();
  const isMounted = useRef(true);

  useEffect(() => () => {
    isMounted.current = false;
  }, []);

  const reloadAccount = useCallback(async () => {
    if (!user?.id) return null;
    if (isMounted.current) setAccountLoading(true);
    try {
      const resp = await api.auth.get(`/users/${user.id}`);
      const details = resp.data ?? null;
      if (isMounted.current) setAccount(details);
      return details;
    } catch (err) {
      console.warn('[Profile] Unable to fetch user details', err);
      return null;
    } finally {
      if (isMounted.current) setAccountLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setPatientId(null);
      setAccount(null);
      return;
    }
    let cancelled = false;
    getStoredPatientId().then((id) => {
      if (!cancelled && isMounted.current) setPatientId(id);
    });
    reloadAccount();
    return () => {
      cancelled = true;
    };
  }, [user, reloadAccount]);

  async function completePatient() {
    if (!user?.email) return;
    setBusy(true);
    try {
      const details = account ?? (await reloadAccount()) ?? {};
      const accountName = typeof details.name === 'string' ? details.name : null;
      const accountPhone = typeof details.phone === 'string' ? details.phone : null;
      const normalizedPhone = accountPhone?.trim() && accountPhone.trim().length > 0 ? accountPhone.trim() : '+000000000';
      const created = await ensurePatientProfile({
        name: accountName || user.email?.split('@')[0] || 'Patient',
        email: user.email,
        phone: normalizedPhone,
      });
      console.log('[Profile] Created patient profile', created);
      const id = created?._id || created?.id || null;
      if (isMounted.current) setPatientId(id);
    } finally {
      if (isMounted.current) setBusy(false);
    }
  }

  const handleViewPatient = useCallback(() => {
    if (!patientId) return;
    navigation.navigate('PatientProfile', { patientId });
  }, [navigation, patientId]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    try {
      console.log('[Profile] Refreshing account and patient ID');
      await reloadAccount();
      const stored = await getStoredPatientId();
      console.log('[Profile] Refreshed patient ID', stored);
      if (isMounted.current) setPatientId(stored);
    } finally {
      if (isMounted.current) setBusy(false);
    }
  }, [reloadAccount, user]);

  const displayName = useMemo(() => {
    if (account?.name && account.name.trim().length > 0) return account.name.trim();
    const emailName = user?.email?.split('@')[0];
    if (emailName && emailName.length > 0) return emailName;
    return t('profile:unknownValue');
  }, [account?.name, t, user?.email]);

  const phoneValue = useMemo(() => {
    const phone = account?.phone?.trim();
    return phone && phone.length > 0 ? phone : t('profile:unknownValue');
  }, [account?.phone, t]);

  const roleChips = useMemo(() => {
    const roles = user?.roles ?? [];
    if (!roles.length) {
      return (
        <View key="none" style={[styles.heroChip, styles.heroChipMuted]}>
          <Text style={[styles.heroChipText, styles.heroChipTextMuted]}>{t('profile:rolesEmpty')}</Text>
        </View>
      );
    }
    return roles.map((role) => {
      const label = t(`profile:rolesMap.${role}` as const, { defaultValue: role });
      return (
        <View key={role} style={styles.heroChip}>
          <Text style={styles.heroChipText}>{label}</Text>
        </View>
      );
    });
  }, [t, user?.roles]);

  const cardRoleChips = useMemo(() => {
    const roles = user?.roles ?? [];
    if (!roles.length) {
      return (
        <View key="none" style={[styles.rolePill, styles.rolePillMuted]}>
          <Text style={[styles.rolePillText, styles.rolePillTextMuted]}>{t('profile:rolesEmpty')}</Text>
        </View>
      );
    }
    return roles.map((role) => {
      const label = t(`profile:rolesMap.${role}` as const, { defaultValue: role });
      return (
        <View key={role} style={styles.rolePill}>
          <Text style={styles.rolePillText}>{label}</Text>
        </View>
      );
    });
  }, [t, user?.roles]);

  const isPatientLinked = Boolean(patientId);
  const patientStatusLabel = t(isPatientLinked ? 'profile:patientStatusLinked' : 'profile:patientStatusMissing');
  const patientDescription = t(
    isPatientLinked ? 'profile:patientCardDescriptionLinked' : 'profile:patientCardDescriptionMissing',
  );

  return (
    <>
      <HeaderBar title={t('profile:title')} />
      <Screen padded={false} contentContainerStyle={styles.screenContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Avatar name={displayName} size={68} />
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroGreeting}>{t('profile:heroGreeting', { name: displayName })}</Text>
              <Text style={styles.heroSubtitle}>{t('profile:heroSubtitle')}</Text>
            </View>
          </View>
          {accountLoading ? (
            <View style={styles.heroLoader}>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={styles.heroLoaderText}>{t('profile:loadingAccount')}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile:patientSection')}</Text>
          <View style={[styles.card, styles.patientCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t('profile:patientCardTitle')}</Text>
              <View style={[styles.statusBadge, isPatientLinked ? styles.statusLinked : styles.statusMissing]}>
                <Text style={isPatientLinked ? styles.statusLinkedText : styles.statusMissingText}>{patientStatusLabel}</Text>
              </View>
            </View>

            <Text style={styles.cardDescription}>{patientDescription}</Text>
            <View style={styles.cardActions}>
              <PrimaryButton
                onPress={isPatientLinked ? handleViewPatient : completePatient}
                loading={!isPatientLinked && busy}
                style={styles.primaryAction}
              >
                {t(isPatientLinked ? 'profile:viewRecordCta' : 'profile:createRecordCta')}
              </PrimaryButton>
              <Button
                mode="outlined"
                onPress={handleRefresh}
                loading={busy && isPatientLinked}
                disabled={busy && !isPatientLinked}
                style={styles.secondaryAction}
                contentStyle={styles.secondaryActionContent}
              >
                {t('profile:refreshCta')}
              </Button>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile:contactSection')}</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile:email')}</Text>
              <Text style={styles.infoValue}>{user?.email || t('profile:unknownValue')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('profile:phone')}</Text>
              <Text style={styles.infoValue}>{phoneValue}</Text>
            </View>
          </View>
        </View>



      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: Spacing.s24,
    paddingTop: Spacing.s24,
    paddingBottom: Spacing.s32,
    gap: Spacing.s24,
    backgroundColor: Colors.background,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.s24,
    gap: Spacing.s20,
    ...Shadows.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s16,
  },
  heroTextWrap: {
    flex: 1,
    gap: Spacing.s8,
  },
  heroGreeting: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 20,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s12,
  },
  heroChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: Spacing.s12,
  },
  heroChipMuted: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroChipText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroChipTextMuted: {
    color: 'rgba(255,255,255,0.72)',
  },
  heroLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
    paddingVertical: Spacing.s8,
    paddingHorizontal: Spacing.s12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  heroLoaderText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    gap: Spacing.s12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.s20,
    gap: Spacing.s16,
    ...Shadows.sm,
  },
  infoRow: {
    gap: Spacing.s4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.outline,
    opacity: 0.6,
  },
  rolesRow: {
    gap: Spacing.s8,
  },
  rolesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s8,
  },
  rolePill: {
    borderRadius: 16,
    paddingHorizontal: Spacing.s12,
    paddingVertical: Spacing.s4,
    backgroundColor: Colors.primarySoft,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  rolePillMuted: {
    backgroundColor: '#E2E8F0',
  },
  rolePillTextMuted: {
    color: Colors.textMuted,
  },
  patientCard: {
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    backgroundColor: '#F8FBFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.s12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statusBadge: {
    borderRadius: 14,
    paddingVertical: Spacing.s4,
    paddingHorizontal: Spacing.s12,
  },
  statusLinked: {
    backgroundColor: Colors.successSoft,
  },
  statusMissing: {
    backgroundColor: Colors.errorSoft,
  },
  statusLinkedText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  statusMissingText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 15,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s12,
  },
  primaryAction: {
    flexGrow: 1,
  },
  secondaryAction: {
    borderRadius: 20,
    flexGrow: 1,
  },
  secondaryActionContent: {
    height: 54,
  },
});
