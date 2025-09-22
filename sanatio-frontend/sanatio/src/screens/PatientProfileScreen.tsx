import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  Text,
  Snackbar,
  Portal,
  Dialog,
  Button,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/Screen';
import HeaderBar from '../components/HeaderBar';
import PrimaryButton from '../components/PrimaryButton';
import Avatar from '../components/Avatar';
import {
  Colors as ThemeColors,
  Radius as ThemeRadius,
  Spacing as ThemeSpacing,
  Shadows as ThemeShadows,
} from '../theme/theme';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api/http';
import { toAppError } from '../services/api/errors';
import { useAuth } from '../store/auth';
import { getStoredPatientId } from '../services/patient';
import { RootParamList } from '../navigation/RootNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type PatientProfileRoute = RouteProp<RootParamList, 'PatientProfile'>;
type Navigation = NativeStackNavigationProp<RootParamList>;

type PatientDocument = {
  url: string;
  type?: string;
  dateUpload?: string;
  name?: string;
};

type PatientDto = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  insuranceNumber?: string;
  medicalHistory?: string[];
  allergies?: string[];
  currentTreatments?: string[];
  documents?: PatientDocument[];
  languages?: string[];
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
  gender?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  nationality?: string;
};

type EditableSection = 'identity' | 'summary' | 'contacts';

const Colors = ThemeColors;
const Radius = ThemeRadius;
const Spacing = ThemeSpacing as Record<string, number> & typeof ThemeSpacing;
const Shadows = ThemeShadows;

export default function PatientProfileScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<PatientProfileRoute>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [patient, setPatient] = useState<PatientDto | null>(null);
  const [patientId, setPatientId] = useState<string | null>(route.params?.patientId ?? null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingSection, setSavingSection] = useState<EditableSection | null>(null);
  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const requestIdRef = useRef(0);
  const patientRef = useRef<PatientDto | null>(null);
  const loadedPatientIdRef = useRef<string | null>(null);

  const setPatientState = useCallback((value: PatientDto | null) => {
    patientRef.current = value;
    loadedPatientIdRef.current = value?._id ?? null;
    setPatient(value);
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditingSection(null);
    setFormValues({});
  }, []);

  const updateFormValue = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const getFormValue = useCallback(
    (key: string) => ((formValues[key] ?? '') as string),
    [formValues],
  );

  useEffect(() => {
    if (!user) {
      requestIdRef.current += 1;
      setPatientId(null);
      setPatientState(null);
      setLoading(false);
      setRefreshing(false);
      setError(null);
      setSnackbar(null);
      setUploading(false);
      setSavingSection(null);
      closeEditDialog();
    }
  }, [user, closeEditDialog, setPatientState]);

  const canManageDocuments = useMemo(() => {
    const roles = user?.roles ?? [];
    const allowed = ['doctor', 'practitioner', 'admin', 'staff', 'patient'];
    return roles.some((role) => allowed.includes(role));
  }, [user?.roles]);

  const canEditProfile = useMemo(() => {
    const roles = user?.roles ?? [];
    const allowed = ['doctor', 'practitioner', 'admin', 'staff', 'patient'];
    return roles.some((role) => allowed.includes(role));
  }, [user?.roles]);

  const heroStats = useMemo(
    () => [
      {
        key: 'history',
        label: t('patientProfile:statsHistory'),
        value: (patient?.medicalHistory?.length ?? 0).toString(),
      },
      {
        key: 'treatments',
        label: t('patientProfile:statsTreatments'),
        value: (patient?.currentTreatments?.length ?? 0).toString(),
      },
      {
        key: 'documents',
        label: t('patientProfile:statsDocuments'),
        value: (patient?.documents?.length ?? 0).toString(),
      },
    ],
    [patient?.currentTreatments?.length, patient?.documents?.length, patient?.medicalHistory?.length, t],
  );

  const openEditDialog = useCallback(
    (section: EditableSection) => {
      if (!patient || !canEditProfile) return;
      const base: Record<string, any> = {};
      if (section === 'identity') {
        base.name = patient.name ?? '';
        base.email = patient.email ?? '';
        base.phone = patient.phone ?? '';
      }
      if (section === 'summary') {
        base.insuranceNumber = patient.insuranceNumber ?? '';
        base.bloodGroup = patient.bloodGroup ?? '';
        base.dateOfBirth = patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '';
        base.nationality = patient.nationality ?? '';
        base.languages = (patient.languages ?? []).join(', ');
        base.gender = patient.gender ?? '';
      }
      if (section === 'contacts') {
        base.addressLine1 = patient.address?.line1 ?? '';
        base.addressLine2 = patient.address?.line2 ?? '';
        base.addressCity = patient.address?.city ?? '';
        base.addressRegion = patient.address?.region ?? '';
        base.addressPostalCode = patient.address?.postalCode ?? '';
        base.addressCountry = patient.address?.country ?? '';
        base.emergencyName = patient.emergencyContact?.name ?? '';
        base.emergencyRelation = patient.emergencyContact?.relation ?? '';
        base.emergencyPhone = patient.emergencyContact?.phone ?? '';
      }
      setFormValues(base);
      setEditingSection(section);
    },
    [canEditProfile, patient],
  );

  const fetchPatient = useCallback(
    async (targetId: string, options?: { skipLoading?: boolean }) => {
      const { skipLoading = false } = options ?? {};
      const requestId = ++requestIdRef.current;
      if (!skipLoading) setLoading(true);
      setError(null);
      try {
        const { data } = await api.patient.get<PatientDto>(`/patients/${targetId}`);
        if (requestIdRef.current === requestId) {
          setPatientState(data);
        }
      } catch (err) {
        const appError = toAppError(err, t('patientProfile:errorLoad'));
        const message = appError.code === 'ERR_NETWORK' ? t('common:offline') : appError.message;
        if (requestIdRef.current === requestId) {
          const isNetworkError = appError.code === 'ERR_NETWORK';
          const hasLoadedCurrent = loadedPatientIdRef.current === targetId;
          if (!isNetworkError || !hasLoadedCurrent) {
            setPatientState(null);
            setError(message);
          } else {
            setSnackbar(message);
          }
        }
      } finally {
        if (requestIdRef.current === requestId) {
          if (!skipLoading) setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [setPatientState, t],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        setSnackbar(null);
        setError(null);
        setRefreshing(false);
        let id = route.params?.patientId ?? null;
        if (!id) {
          id = await getStoredPatientId();
        }
        if (!isActive) return;
        if (id) {
          setPatientId((current) => {
            if (current === id) {
              fetchPatient(id, { skipLoading: !!current });
              return current;
            }
            return id;
          });
        } else {
          setPatientState(null);
          setLoading(false);
          setError(t('patientProfile:noPatient'));
        }
      })();
      return () => {
        isActive = false;
      };
    }, [fetchPatient, route.params?.patientId, setPatientState, t]),
  );

  useEffect(() => {
    if (!patientId) return;
    fetchPatient(patientId);
  }, [fetchPatient, patientId]);

  const handleRefresh = () => {
    if (!patientId) return;
    setRefreshing(true);
    setSnackbar(null);
    setError(null);
    fetchPatient(patientId, { skipLoading: true });
  };

  const handleUploadDocument = async () => {
    if (!canManageDocuments || !patientId || !patient) return;
    const permission = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (permission.canceled || !permission.assets?.length) return;

    const asset = permission.assets[0];
    const fileUri = asset.uri;
    const fileName = asset.name ?? `document-${Date.now()}`;
    const mimeType = asset.mimeType ?? 'application/octet-stream';

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as any);

    setUploading(true);
    try {
      const uploadResp = await api.patient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const meta = uploadResp.data as { url: string; name: string; mime: string };
      const documents = [...(patient.documents ?? []), {
        url: meta.url,
        type: meta.mime,
        name: meta.name ?? fileName,
        dateUpload: new Date().toISOString(),
      }];
      await api.patient.patch(`/patients/${patientId}`, { documents });
      setSnackbar(t('patientProfile:uploadSuccess'));
      fetchPatient(patientId, { skipLoading: true });
    } catch (err) {
      const appError = toAppError(err, t('patientProfile:uploadError'));
      const message = appError.code === 'ERR_NETWORK' ? t('common:offline') : appError.message;
      setSnackbar(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSection = async () => {
    if (!patientId || !patient || !editingSection) return;
    const section = editingSection;
    const getValue = (key: string) => ((formValues[key] ?? '') as string).trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let payload: Record<string, any> | null = null;

    if (section === 'identity') {
      const name = getValue('name');
      const emailRaw = getValue('email');
      const phoneRaw = getValue('phone');

      if (!name) {
        setSnackbar(t('patientProfile:validationNameRequired'));
        return;
      }
      if (!emailRaw) {
        setSnackbar(t('patientProfile:validationEmailRequired'));
        return;
      }
      if (!emailPattern.test(emailRaw)) {
        setSnackbar(t('patientProfile:validationEmailInvalid'));
        return;
      }
      if (!phoneRaw) {
        setSnackbar(t('patientProfile:validationPhoneRequired'));
        return;
      }

      payload = {
        name,
        email: emailRaw.toLowerCase(),
        phone: phoneRaw,
      };
    } else if (section === 'summary') {
      const languages = ((formValues.languages ?? '') as string)
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean);
      const dateValue = getValue('dateOfBirth');
      let dateOfBirth: string | null = null;
      if (dateValue) {
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) {
          setSnackbar(t('patientProfile:validationDateInvalid'));
          return;
        }
        dateOfBirth = parsed.toISOString();
      }

      payload = {
        insuranceNumber: getValue('insuranceNumber') || null,
        bloodGroup: getValue('bloodGroup') || null,
        nationality: getValue('nationality') || null,
        languages,
        gender: getValue('gender') || null,
        dateOfBirth,
      };
    } else if (section === 'contacts') {
      payload = {
        address: {
          line1: getValue('addressLine1') || null,
          line2: getValue('addressLine2') || null,
          city: getValue('addressCity') || null,
          region: getValue('addressRegion') || null,
          postalCode: getValue('addressPostalCode') || null,
          country: getValue('addressCountry') || null,
        },
        emergencyContact: {
          name: getValue('emergencyName') || null,
          relation: getValue('emergencyRelation') || null,
          phone: getValue('emergencyPhone') || null,
        },
      };
    }

    if (!payload) return;

    setSavingSection(section);
    try {
      await api.patient.patch(`/patients/${patientId}`, payload);
      setSnackbar(t('patientProfile:updateSuccess'));
      closeEditDialog();
      fetchPatient(patientId, { skipLoading: true });
    } catch (err) {
      const appError = toAppError(err, t('patientProfile:updateError'));
      const message = appError.code === 'ERR_NETWORK' ? t('common:offline') : appError.message;
      setSnackbar(message);
    } finally {
      setSavingSection(null);
    }
  };

  const ageDisplay = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    const birthDate = new Date(patient.dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return null;
    const diff = Date.now() - birthDate.getTime();
    const ageDate = new Date(diff);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (!Number.isFinite(age)) return null;
    return t('patientProfile:ageYears', { count: age });
  }, [patient?.dateOfBirth, t]);

  const renderChipRow = (items?: string[], emptyKey?: string) => {
    if (!items || !items.length) {
      return <Text style={styles.muted}>{emptyKey ? t(emptyKey as any) : t('patientProfile:empty')}</Text>;
    }
    return (
      <View style={styles.chipRow}>
        {items.map((item, index) => (
          <View key={`${item}-${index}`} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderHeroCard = () => (
    <View style={styles.heroCard} accessibilityRole="header">
      <View style={styles.heroHeader}>
        <Avatar name={patient?.name} uri={patient?.avatarUrl} size={68} />
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>{patient?.name || t('patientProfile:unknownPatient')}</Text>
          {patient?.email ? <Text style={styles.heroSubtitle}>{patient.email}</Text> : null}
          {patient?.phone ? <Text style={styles.heroSubtitle}>{patient.phone}</Text> : null}
        </View>
      </View>
      <View style={styles.heroMetaRow}>
        {ageDisplay ? (
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{ageDisplay}</Text>
          </View>
        ) : null}
        {patient?.nationality ? (
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{patient.nationality}</Text>
          </View>
        ) : null}
        {patient?.insuranceNumber ? (
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{patient.insuranceNumber}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.heroStatsRow}>
        {heroStats.map((stat) => (
          <View key={stat.key} style={styles.heroStatCard}>
            <Text style={styles.heroStatValue}>{stat.value}</Text>
            <Text style={styles.heroStatLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      {canEditProfile ? (
        <Button
          mode="contained-tonal"
          onPress={() => openEditDialog('identity')}
          style={styles.heroButton}
        >
          {t('patientProfile:editIdentityAction')}
        </Button>
      ) : null}
    </View>
  );

  const overviewTiles = useMemo(
    () => [
      { label: t('patientProfile:insurance'), value: patient?.insuranceNumber ?? null },
      { label: t('patientProfile:bloodGroup'), value: patient?.bloodGroup ?? null },
      {
        label: t('patientProfile:birthDate'),
        value: patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : null,
      },
      { label: t('patientProfile:gender'), value: patient?.gender ?? null },
      { label: t('patientProfile:nationality'), value: patient?.nationality ?? null },
      {
        label: t('patientProfile:languages'),
        value: (patient?.languages ?? []).join(', '),
      },
    ],
    [patient?.bloodGroup, patient?.dateOfBirth, patient?.gender, patient?.insuranceNumber, patient?.languages, patient?.nationality, t],
  );

  const renderOverviewSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('patientProfile:overviewSection')}</Text>
        {canEditProfile ? (
          <Button mode="outlined" onPress={() => openEditDialog('summary')}>
            {t('patientProfile:editSummaryAction')}
          </Button>
        ) : null}
      </View>
      <View style={styles.card}>
        <View style={styles.infoGrid}>
          {overviewTiles.map((tile) => (
            <View key={tile.label} style={styles.infoTile}>
              <Text style={styles.infoLabel}>{tile.label}</Text>
              <Text style={styles.infoValue}>{tile.value && tile.value.trim() ? tile.value : t('patientProfile:notProvided')}</Text>
            </View>
          ))}
        </View>
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>{t('patientProfile:tabs.allergies')}</Text>
          {renderChipRow(patient?.allergies, 'patientProfile:noAllergies')}
        </View>
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>{t('patientProfile:tabs.treatments')}</Text>
          {patient?.currentTreatments?.length ? (
            <View style={styles.listBlock}>
              {patient.currentTreatments.map((item, idx) => (
                <Text key={`${item}-${idx}`} style={styles.listBlockItem}>
                  • {item}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>{t('patientProfile:noTreatments')}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderListCard = (title: string, items?: string[], emptyKey?: string) => (
    <View style={styles.card} key={title}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items && items.length ? (
        <View style={styles.listBlock}>
          {items.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.listBlockItem}>
              • {item}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.muted}>{emptyKey ? t(emptyKey as any) : t('patientProfile:empty')}</Text>
      )}
    </View>
  );

  const renderMedicalSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('patientProfile:medicalSection')}</Text>
      <View style={styles.cardStack}>
        {renderListCard(t('patientProfile:tabs.history'), patient?.medicalHistory, 'patientProfile:noHistory')}
        {renderListCard(t('patientProfile:tabs.allergies'), patient?.allergies, 'patientProfile:noAllergies')}
        {renderListCard(t('patientProfile:tabs.treatments'), patient?.currentTreatments, 'patientProfile:noTreatments')}
      </View>
    </View>
  );

  const renderDocumentsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('patientProfile:documentsSection')}</Text>
        {canManageDocuments ? (
          <PrimaryButton
            loading={uploading}
            onPress={handleUploadDocument}
            style={styles.uploadButton}
          >
            {t('patientProfile:uploadButton')}
          </PrimaryButton>
        ) : null}
      </View>
      <View style={[styles.card, styles.documentsCard]}>
        {!canManageDocuments ? (
          <Text style={styles.muted}>{t('patientProfile:documentsReadOnly')}</Text>
        ) : null}
        {patient?.documents && patient.documents.length ? (
          <View style={styles.documentList}>
            {patient.documents.map((doc, index) => (
              <Pressable
                key={`${doc.url}-${index}`}
                style={({ pressed }) => [styles.documentItem, pressed && styles.documentItemPressed]}
                onPress={() => Linking.openURL(doc.url)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.documentTitle}>{doc.name ?? t('patientProfile:document')}</Text>
                  {(() => {
                    const uploadedAt = doc.dateUpload ? new Date(doc.dateUpload) : null;
                    const formatted = uploadedAt && !Number.isNaN(uploadedAt.getTime()) ? uploadedAt.toLocaleString() : null;
                    const meta = [doc.type, formatted].filter(Boolean).join(' • ');
                    return <Text style={styles.muted}>{meta || t('patientProfile:notProvided')}</Text>;
                  })()}
                </View>
                <Text style={styles.documentChevron}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.muted}>{t('patientProfile:noDocuments')}</Text>
        )}
      </View>
    </View>
  );

  const renderContactsSection = () => {
    const address = patient?.address;
    const emergency = patient?.emergencyContact;
    const addressLines = [address?.line1, address?.line2].filter(Boolean).join('\n');
    const locality = [address?.postalCode, address?.city].filter(Boolean).join(' ');

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('patientProfile:contactsSection')}</Text>
          {canEditProfile ? (
            <Button mode="outlined" onPress={() => openEditDialog('contacts')}>
              {t('patientProfile:editContactsAction')}
            </Button>
          ) : null}
        </View>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('patientProfile:address')}</Text>
            <Text style={styles.infoValue}>
              {addressLines || locality || address?.country ? (
                [addressLines, locality, address?.country].filter(Boolean).join('\n')
              ) : (
                t('patientProfile:notProvided')
              )}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('patientProfile:emergencyContact')}</Text>
            <Text style={styles.infoValue}>
              {[emergency?.name, emergency?.relation, emergency?.phone].filter(Boolean).join(' • ') || t('patientProfile:notProvided')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{t('patientProfile:loadingState')}</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorCard} accessibilityRole="alert">
      <Text style={styles.errorTitle}>{t('patientProfile:errorLoad')}</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <PrimaryButton onPress={handleRefresh}>{t('patientProfile:retry')}</PrimaryButton>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{t('patientProfile:noDataTitle')}</Text>
      <Text style={styles.muted}>{t('patientProfile:noDataSubtitle')}</Text>
    </View>
  );

  const renderBody = () => {
    if (loading) return renderLoadingState();
    if (error) return renderErrorState();
    if (!patient) return renderEmptyState();
    return (
      <>
        {renderHeroCard()}
        {renderOverviewSection()}
        {renderMedicalSection()}
        {renderDocumentsSection()}
        {renderContactsSection()}
      </>
    );
  };

  return (
    <>
      <HeaderBar title={t('patientProfile:title')} onBack={() => navigation.goBack()} />
      <Screen scroll={false} style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {renderBody()}
        </ScrollView>
      </Screen>

      {editingSection ? (
        <Portal>
          <Dialog visible onDismiss={closeEditDialog}>
            <Dialog.Title>
              {editingSection === 'identity'
                ? t('patientProfile:editIdentityTitle')
                : editingSection === 'summary'
                ? t('patientProfile:editSummaryTitle')
                : t('patientProfile:editContactsTitle')}
            </Dialog.Title>
            <Dialog.Content>
              {editingSection === 'identity' ? (
                <View style={styles.dialogContent}>
                  <TextInput
                    label={t('patientProfile:name')}
                    value={getFormValue('name')}
                    onChangeText={(text) => updateFormValue('name', text)}
                    mode="outlined"
                    autoCapitalize="words"
                  />
                  <TextInput
                    label={t('patientProfile:email')}
                    value={getFormValue('email')}
                    onChangeText={(text) => updateFormValue('email', text)}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TextInput
                    label={t('patientProfile:phone')}
                    value={getFormValue('phone')}
                    onChangeText={(text) => updateFormValue('phone', text)}
                    mode="outlined"
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'phone-pad'}
                  />
                </View>
              ) : editingSection === 'summary' ? (
                <View style={styles.dialogContent}>
                  <TextInput
                    label={t('patientProfile:insurance')}
                    value={getFormValue('insuranceNumber')}
                    onChangeText={(text) => updateFormValue('insuranceNumber', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:bloodGroup')}
                    value={getFormValue('bloodGroup')}
                    onChangeText={(text) => updateFormValue('bloodGroup', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:birthDatePlaceholder')}
                    value={getFormValue('dateOfBirth')}
                    onChangeText={(text) => updateFormValue('dateOfBirth', text)}
                    mode="outlined"
                    placeholder="YYYY-MM-DD"
                  />
                  <TextInput
                    label={t('patientProfile:nationality')}
                    value={getFormValue('nationality')}
                    onChangeText={(text) => updateFormValue('nationality', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:gender')}
                    value={getFormValue('gender')}
                    onChangeText={(text) => updateFormValue('gender', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:languagesPlaceholder')}
                    value={getFormValue('languages')}
                    onChangeText={(text) => updateFormValue('languages', text)}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    placeholder={t('patientProfile:languagesPlaceholderHint')}
                  />
                </View>
              ) : (
                <View style={styles.dialogContent}>
                  <TextInput
                    label={t('patientProfile:addressLine1')}
                    value={getFormValue('addressLine1')}
                    onChangeText={(text) => updateFormValue('addressLine1', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:addressLine2')}
                    value={getFormValue('addressLine2')}
                    onChangeText={(text) => updateFormValue('addressLine2', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:city')}
                    value={getFormValue('addressCity')}
                    onChangeText={(text) => updateFormValue('addressCity', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:region')}
                    value={getFormValue('addressRegion')}
                    onChangeText={(text) => updateFormValue('addressRegion', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:postalCode')}
                    value={getFormValue('addressPostalCode')}
                    onChangeText={(text) => updateFormValue('addressPostalCode', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:country')}
                    value={getFormValue('addressCountry')}
                    onChangeText={(text) => updateFormValue('addressCountry', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:emergencyName')}
                    value={getFormValue('emergencyName')}
                    onChangeText={(text) => updateFormValue('emergencyName', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:emergencyRelation')}
                    value={getFormValue('emergencyRelation')}
                    onChangeText={(text) => updateFormValue('emergencyRelation', text)}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('patientProfile:emergencyPhone')}
                    value={getFormValue('emergencyPhone')}
                    onChangeText={(text) => updateFormValue('emergencyPhone', text)}
                    mode="outlined"
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'phone-pad'}
                  />
                </View>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeEditDialog} disabled={savingSection !== null}>
                {t('patientProfile:cancel')}
              </Button>
              <Button onPress={handleSaveSection} loading={savingSection !== null}>
                {t('patientProfile:save')}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      ) : null}

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
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.s24,
    paddingTop: Spacing.s24,
    paddingBottom: Spacing.s32,
    gap: Spacing.s24,
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
  heroTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s12,
  },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: Spacing.s12,
  },
  metaPillText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: Spacing.s12,
  },
  heroStatCard: {
    flex: 1,
    minWidth: 110,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    gap: Spacing.s4,
  },
  heroStatValue: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroButton: {
    alignSelf: 'flex-start',
  },
  section: {
    gap: Spacing.s16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
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
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s12,
  },
  infoTile: {
    flexGrow: 1,
    minWidth: 150,
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.md,
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    gap: Spacing.s4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  subSection: {
    gap: Spacing.s8,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s8,
  },
  chip: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    paddingVertical: Spacing.s4,
    paddingHorizontal: Spacing.s12,
  },
  chipText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  listBlock: {
    gap: Spacing.s4,
  },
  listBlockItem: {
    color: Colors.text,
    fontSize: 14,
  },
  cardStack: {
    gap: Spacing.s16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  documentsCard: {
    gap: Spacing.s12,
  },
  documentList: {
    gap: Spacing.s12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    paddingVertical: Spacing.s12,
    paddingHorizontal: Spacing.s16,
    backgroundColor: Colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.outline,
  },
  documentItemPressed: {
    backgroundColor: Colors.primarySoft,
  },
  documentTitle: {
    color: Colors.text,
    fontWeight: '600',
  },
  documentChevron: {
    fontSize: 22,
    color: Colors.textMuted,
    marginLeft: Spacing.s12,
  },
  uploadButton: {
    alignSelf: 'flex-start',
  },
  infoRow: {
    gap: Spacing.s4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.outline,
    opacity: 0.6,
  },
  muted: {
    color: Colors.textMuted,
  },
  loadingState: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.s24,
    alignItems: 'center',
    gap: Spacing.s12,
    ...Shadows.sm,
  },
  loadingText: {
    color: Colors.textMuted,
  },
  errorCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.s24,
    gap: Spacing.s12,
    ...Shadows.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.error,
  },
  errorMessage: {
    color: Colors.text,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.s24,
    gap: Spacing.s8,
    alignItems: 'flex-start',
    ...Shadows.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  dialogContent: {
    gap: Spacing.s16,
  },
});
