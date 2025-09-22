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
  Card,
  Chip,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import Screen from '../components/Screen';
import HeaderBar from '../components/HeaderBar';
import Avatar from '../components/Avatar';
import PrimaryButton from '../components/PrimaryButton';
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

type EditableSection = 'personal' | 'medical' | 'contact' | 'emergency';

const Colors = {
  primary: '#2B66F6',
  background: '#F4F6FB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  chipBackground: '#EEF2FF',
  chipText: '#3646A2',
  error: '#EF4444',
};

const Spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
};

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

  const openEditDialog = useCallback(
    (section: EditableSection) => {
      if (!patient || !canEditProfile) return;
      const base: Record<string, any> = {};

      if (section === 'personal') {
        base.name = patient.name ?? '';
        base.email = patient.email ?? '';
        base.phone = patient.phone ?? '';
        base.dateOfBirth = patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '';
        base.gender = patient.gender ?? '';
        base.nationality = patient.nationality ?? '';
        base.languages = (patient.languages ?? []).join(', ');
      }

      if (section === 'medical') {
        base.bloodGroup = patient.bloodGroup ?? '';
        base.insuranceNumber = patient.insuranceNumber ?? '';
        base.allergies = (patient.allergies ?? []).join(', ');
        base.medicalHistory = (patient.medicalHistory ?? []).join('\n');
        base.currentTreatments = (patient.currentTreatments ?? []).join('\n');
      }

      if (section === 'contact') {
        base.addressLine1 = patient.address?.line1 ?? '';
        base.addressLine2 = patient.address?.line2 ?? '';
        base.addressCity = patient.address?.city ?? '';
        base.addressRegion = patient.address?.region ?? '';
        base.addressPostalCode = patient.address?.postalCode ?? '';
        base.addressCountry = patient.address?.country ?? '';
      }

      if (section === 'emergency') {
        base.emergencyName = patient.emergencyContact?.name ?? '';
        base.emergencyRelation = patient.emergencyContact?.relation ?? '';
        base.emergencyPhone = patient.emergencyContact?.phone ?? '';
      }

      setFormValues(base);
      setEditingSection(section);
    },
    [canEditProfile, patient],
  );

  const handleSaveSection = async () => {
    if (!patientId || !patient || !editingSection) return;
    const section = editingSection;
    const getValue = (key: string) => ((formValues[key] ?? '') as string).trim();
    let payload: Record<string, any> | null = null;

    if (section === 'personal') {
      const name = getValue('name');
      const emailRaw = getValue('email');
      const phoneRaw = getValue('phone');
      const dateValue = getValue('dateOfBirth');
      const languages = getValue('languages')
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean);

      if (!name) {
        setSnackbar(t('patientProfile:validationNameRequired'));
        return;
      }
      if (!emailRaw) {
        setSnackbar(t('patientProfile:validationEmailRequired'));
        return;
      }

      let dateOfBirth: string | null = null;
      if (dateValue) {
        const parsed = new Date(dateValue);
        if (!Number.isNaN(parsed.getTime())) {
          dateOfBirth = parsed.toISOString();
        }
      }

      payload = {
        name,
        email: emailRaw.toLowerCase(),
        phone: phoneRaw || null,
        dateOfBirth,
        gender: getValue('gender') || null,
        nationality: getValue('nationality') || null,
        languages,
      };
    } else if (section === 'medical') {
      const allergies = getValue('allergies')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const medicalHistory = getValue('medicalHistory')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      const currentTreatments = getValue('currentTreatments')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

      payload = {
        bloodGroup: getValue('bloodGroup') || null,
        insuranceNumber: getValue('insuranceNumber') || null,
        allergies,
        medicalHistory,
        currentTreatments,
      };
    } else if (section === 'contact') {
      payload = {
        address: {
          line1: getValue('addressLine1') || null,
          line2: getValue('addressLine2') || null,
          city: getValue('addressCity') || null,
          region: getValue('addressRegion') || null,
          postalCode: getValue('addressPostalCode') || null,
          country: getValue('addressCountry') || null,
        },
      };
    } else if (section === 'emergency') {
      payload = {
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

  const renderInfoRow = (label: string, value: string) => (
    <View key={label} style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value.trim() || t('patientProfile:notProvided')}
      </Text>
    </View>
  );

  const renderChipList = (title: string, items?: string[]) => (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items && items.length ? (
        <View style={styles.chipRow}>
          {items.map((item, index) => (
            <Chip key={`${item}-${index}`} style={styles.chip} textStyle={styles.chipText}>
              {item}
            </Chip>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>{t('patientProfile:empty')}</Text>
      )}
    </View>
  );

  const renderBulletList = (
    title: string,
    items?: string[],
    iconName: keyof typeof Icon.glyphMap = 'circle-small',
  ) => (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items && items.length ? (
        <View style={styles.listContainer}>
          {items.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.listItem}>
              <Icon name={iconName} size={18} color={Colors.primary} style={styles.listIcon} />
              <Text style={styles.listItemText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>{t('patientProfile:empty')}</Text>
      )}
    </View>
  );

  const renderHeroCard = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.heroRow}>
          <Avatar name={patient?.name} uri={patient?.avatarUrl} size={72} />
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={2}>
              {patient?.name || t('patientProfile:unknownPatient')}
            </Text>
            {patient?.email ? <Text style={styles.heroSubtitle}>{patient.email}</Text> : null}
            {patient?.phone ? <Text style={styles.heroSubtitle}>{patient.phone}</Text> : null}
          </View>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.heroStatsRow}>
          {renderInfoRow(t('patientProfile:birthDate'), ageDisplay || t('patientProfile:notProvided'))}
          {renderInfoRow(t('patientProfile:gender'), patient?.gender || '')}
          {renderInfoRow(t('patientProfile:nationality'), patient?.nationality || '')}
        </View>
      </Card.Content>
      {canEditProfile ? (
        <Card.Actions style={styles.cardActions}>
          <Button mode="contained" icon="pencil" onPress={() => openEditDialog('personal')}>
            {t('patientProfile:editIdentityAction')}
          </Button>
        </Card.Actions>
      ) : null}
    </Card>
  );

  const renderOverviewCard = () => (
    <Card style={styles.card}>
      <Card.Title
        title={t('patientProfile:overviewSection')}
        titleNumberOfLines={2}
        titleStyle={styles.cardTitle}
        left={(props) => <Icon {...props} name="account-box" color={Colors.primary} size={26} />}
      />
      <Card.Content>
        <View style={styles.infoGrid}>
          {renderInfoRow(t('patientProfile:email'), patient?.email || '')}
          {renderInfoRow(t('patientProfile:phone'), patient?.phone || '')}
        </View>
        <Divider style={styles.divider} />
        {renderChipList(t('patientProfile:languages'), patient?.languages)}
      </Card.Content>
    </Card>
  );

  const renderContactCard = () => (
    <Card style={styles.card}>
      <Card.Title
        title={t('patientProfile:contactsSection')}
        titleStyle={styles.cardTitle}
        left={(props) => <Icon {...props} name="map-marker-radius" color={Colors.primary} size={26} />}
      />
      <Card.Content>
        <Text style={styles.infoLabel}>{t('patientProfile:address')}</Text>
        <Text style={styles.infoValue}>
          {[
            patient?.address?.line1,
            patient?.address?.line2,
            patient?.address?.city,
            patient?.address?.postalCode,
            patient?.address?.country,
          ]
            .filter(Boolean)
            .join(', ') || t('patientProfile:notProvided')}
        </Text>
      </Card.Content>
      {canEditProfile ? (
        <Card.Actions style={styles.cardActions}>
          <Button mode="outlined" onPress={() => openEditDialog('contact')} icon="map-marker">
            {t('patientProfile:editContactTitle')}
          </Button>
        </Card.Actions>
      ) : null}
    </Card>
  );

  const renderEmergencyCard = () => (
    <Card style={styles.card}>
      <Card.Title
        title={t('patientProfile:emergencyContact')}
        titleStyle={styles.cardTitle}
        left={(props) => <Icon {...props} name="phone-alert" color={Colors.primary} size={26} />}
      />
      <Card.Content>
        {patient?.emergencyContact ? (
          <View style={styles.infoGrid}>
            {renderInfoRow(t('patientProfile:emergencyName'), patient.emergencyContact.name || '')}
            {renderInfoRow(t('patientProfile:emergencyRelation'), patient.emergencyContact.relation || '')}
            {renderInfoRow(t('patientProfile:emergencyPhone'), patient.emergencyContact.phone || '')}
          </View>
        ) : (
          <Text style={styles.emptyText}>{t('patientProfile:notProvided')}</Text>
        )}
      </Card.Content>
      {canEditProfile ? (
        <Card.Actions style={styles.cardActions}>
          <Button mode="outlined" onPress={() => openEditDialog('emergency')} icon="phone">
            {t('patientProfile:editEmergencyTitle')}
          </Button>
        </Card.Actions>
      ) : null}
    </Card>
  );

  const renderMedicalCard = () => (
    <Card style={styles.card}>
      <Card.Title
        title={t('patientProfile:medicalInfo')}
        titleStyle={styles.cardTitle}
        left={(props) => <Icon {...props} name="medical-bag" color={Colors.primary} size={26} />}
      />
      <Card.Content>
        <View style={styles.infoGrid}>
          {renderInfoRow(t('patientProfile:bloodGroup'), patient?.bloodGroup || '')}
          {renderInfoRow(t('patientProfile:insurance'), patient?.insuranceNumber || '')}
        </View>
        <Divider style={styles.divider} />
        {renderChipList(t('patientProfile:allergies'), patient?.allergies)}
        <Divider style={styles.divider} />
        {renderBulletList(t('patientProfile:medicalHistory'), patient?.medicalHistory)}
        <Divider style={styles.divider} />
        {renderBulletList(t('patientProfile:currentTreatments'), patient?.currentTreatments, 'pill')}
      </Card.Content>
      {canEditProfile ? (
        <Card.Actions style={styles.cardActions}>
          <Button mode="outlined" onPress={() => openEditDialog('medical')} icon="pencil">
            {t('patientProfile:editMedicalTitle')}
          </Button>
        </Card.Actions>
      ) : null}
    </Card>
  );

  const renderDocumentsCard = () => (
    <Card style={styles.card}>
      <Card.Title
        title={t('patientProfile:documentsSection')}
        titleStyle={styles.cardTitle}
        left={(props) => <Icon {...props} name="file-document" color={Colors.primary} size={26} />}
      />
      <Card.Content>
        {canManageDocuments ? (
          <PrimaryButton
            loading={uploading}
            onPress={handleUploadDocument}
            style={styles.uploadButton}
            icon="upload"
          >
            {t('patientProfile:uploadButton')}
          </PrimaryButton>
        ) : (
          <Text style={styles.emptyText}>{t('patientProfile:documentsReadOnly')}</Text>
        )}
        <Divider style={styles.divider} />
        {patient?.documents && patient.documents.length ? (
          patient.documents.map((doc, index) => (
            <Pressable
              key={`${doc.url}-${index}`}
              style={styles.documentRow}
              onPress={() => doc.url && Linking.openURL(doc.url)}
            >
              <Icon name="file-document-outline" size={26} color={Colors.primary} />
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.name || t('patientProfile:document')}</Text>
                <Text style={styles.documentMeta}>
                  {doc.dateUpload
                    ? new Date(doc.dateUpload).toLocaleDateString()
                    : t('patientProfile:notProvided')}
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color={Colors.textSecondary} />
            </Pressable>
          ))
        ) : (
          <Text style={styles.emptyText}>{t('patientProfile:noDocuments')}</Text>
        )}
      </Card.Content>
    </Card>
  );

  const getDialogTitle = () => {
    switch (editingSection) {
      case 'personal':
        return t('patientProfile:editPersonalTitle');
      case 'medical':
        return t('patientProfile:editMedicalTitle');
      case 'contact':
        return t('patientProfile:editContactTitle');
      case 'emergency':
        return t('patientProfile:editEmergencyTitle');
      default:
        return '';
    }
  };

  const renderEditDialog = () => {
    if (!editingSection) return null;

    return (
      <Portal>
        <Dialog visible onDismiss={closeEditDialog} style={styles.dialog}>
          <Dialog.Title>{getDialogTitle()}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              {editingSection === 'personal' && (
                <>
                  <TextInput
                    label={t('patientProfile:name')}
                    value={getFormValue('name')}
                    onChangeText={(text) => updateFormValue('name', text)}
                    mode="outlined"
                    autoCapitalize="words"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:email')}
                    value={getFormValue('email')}
                    onChangeText={(text) => updateFormValue('email', text)}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:phone')}
                    value={getFormValue('phone')}
                    onChangeText={(text) => updateFormValue('phone', text)}
                    mode="outlined"
                    keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'phone-pad'}
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:birthDatePlaceholder')}
                    value={getFormValue('dateOfBirth')}
                    onChangeText={(text) => updateFormValue('dateOfBirth', text)}
                    mode="outlined"
                    placeholder="YYYY-MM-DD"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:gender')}
                    value={getFormValue('gender')}
                    onChangeText={(text) => updateFormValue('gender', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:nationality')}
                    value={getFormValue('nationality')}
                    onChangeText={(text) => updateFormValue('nationality', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:languages')}
                    value={getFormValue('languages')}
                    onChangeText={(text) => updateFormValue('languages', text)}
                    mode="outlined"
                    placeholder={t('patientProfile:languagesPlaceholderHint')}
                    style={styles.input}
                  />
                </>
              )}

              {editingSection === 'medical' && (
                <>
                  <TextInput
                    label={t('patientProfile:bloodGroup')}
                    value={getFormValue('bloodGroup')}
                    onChangeText={(text) => updateFormValue('bloodGroup', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:insurance')}
                    value={getFormValue('insuranceNumber')}
                    onChangeText={(text) => updateFormValue('insuranceNumber', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:allergies')}
                    value={getFormValue('allergies')}
                    onChangeText={(text) => updateFormValue('allergies', text)}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    placeholder={t('patientProfile:languagesPlaceholderHint')}
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:medicalHistory')}
                    value={getFormValue('medicalHistory')}
                    onChangeText={(text) => updateFormValue('medicalHistory', text)}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    placeholder="Un élément par ligne"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:currentTreatments')}
                    value={getFormValue('currentTreatments')}
                    onChangeText={(text) => updateFormValue('currentTreatments', text)}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    placeholder="Un traitement par ligne"
                    style={styles.input}
                  />
                </>
              )}

              {editingSection === 'contact' && (
                <>
                  <TextInput
                    label={t('patientProfile:addressLine1')}
                    value={getFormValue('addressLine1')}
                    onChangeText={(text) => updateFormValue('addressLine1', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:addressLine2')}
                    value={getFormValue('addressLine2')}
                    onChangeText={(text) => updateFormValue('addressLine2', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:city')}
                    value={getFormValue('addressCity')}
                    onChangeText={(text) => updateFormValue('addressCity', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:region')}
                    value={getFormValue('addressRegion')}
                    onChangeText={(text) => updateFormValue('addressRegion', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:postalCode')}
                    value={getFormValue('addressPostalCode')}
                    onChangeText={(text) => updateFormValue('addressPostalCode', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:country')}
                    value={getFormValue('addressCountry')}
                    onChangeText={(text) => updateFormValue('addressCountry', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                </>
              )}

              {editingSection === 'emergency' && (
                <>
                  <TextInput
                    label={t('patientProfile:emergencyName')}
                    value={getFormValue('emergencyName')}
                    onChangeText={(text) => updateFormValue('emergencyName', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:emergencyRelation')}
                    value={getFormValue('emergencyRelation')}
                    onChangeText={(text) => updateFormValue('emergencyRelation', text)}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label={t('patientProfile:emergencyPhone')}
                    value={getFormValue('emergencyPhone')}
                    onChangeText={(text) => updateFormValue('emergencyPhone', text)}
                    mode="outlined"
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeEditDialog} disabled={savingSection !== null}>
              {t('patientProfile:cancel')}
            </Button>
            <Button onPress={handleSaveSection} loading={savingSection !== null} mode="contained">
              {t('patientProfile:save')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{t('patientProfile:loadingState')}</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle" size={48} color={Colors.error} />
      <Text style={styles.errorTitle}>{t('patientProfile:errorLoad')}</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <Button mode="contained" onPress={handleRefresh} style={styles.retryButton}>
        {t('patientProfile:retry')}
      </Button>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="account-off" size={48} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>{t('patientProfile:noDataTitle')}</Text>
      <Text style={styles.emptySubtitle}>{t('patientProfile:noDataSubtitle')}</Text>
    </View>
  );

  const renderContent = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (!patient) return renderEmpty();

    return (
      <View style={styles.sectionStack}>
        {renderHeroCard()}
        {renderOverviewCard()}
        {renderContactCard()}
        {renderEmergencyCard()}
        {renderMedicalCard()}
        {renderDocumentsCard()}
      </View>
    );
  };

  return (
    <>
      <HeaderBar title={t('patientProfile:title')} onBack={() => navigation.goBack()} style={styles.headerBar} />
      <Screen scroll={false} padded={false} style={styles.screen}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </Screen>

      {renderEditDialog()}

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={4000}
        action={{ label: t('common:ok'), onPress: () => setSnackbar(null) }}
        style={styles.snackbar}
      >
        {snackbar}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    backgroundColor: Colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  sectionStack: {
    gap: Spacing.lg,
  },
  card: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    elevation: 2,
    shadowColor: 'rgba(15, 23, 42, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  infoRow: {
    width: '48%',
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.text,
  },
  sectionBlock: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    backgroundColor: Colors.chipBackground,
  },
  chipText: {
    color: Colors.chipText,
    fontWeight: '600',
  },
  listContainer: {
    gap: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  listIcon: {
    marginRight: Spacing.xs,
  },
  listItemText: {
    flex: 1,
    color: Colors.text,
  },
  divider: {
    marginVertical: Spacing.sm,
    backgroundColor: Colors.border,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  documentMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  uploadButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.error,
  },
  errorMessage: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  input: {
    marginBottom: Spacing.md,
  },
  snackbar: {
    backgroundColor: Colors.primary,
  },
});
