/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * Refonte — Écran de planification de consultation (TSX)
 * - Design System inspiré d'Apple : finesse, précision, hiérarchie visuelle claire
 * - Typographie soignée avec différents weights et spacing
 * - Shadows subtiles et cohérentes
 * - Animations fluides et micro-interactions
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Searchbar,
  RadioButton,
  Chip,
  HelperText,
  Portal,
  Modal,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';

// Composants maison
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import HeaderBar from '../components/HeaderBar';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import Screen from '../components/Screen';
import Tag from '../components/Tag';

import { useAuth } from '../store/auth';
import { api } from '../services/api/http';

/* --- Design System Apple-inspired --- */
const Colors = {
  // Couleurs principales
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D2',
  
  // Backgrounds
  background: '#F2F2F7',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F2F2F7',
  
  // Surfaces
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Textes
  label: '#000000',
  labelSecondary: '#3C3C43',
  labelTertiary: '#3C3C4399',
  labelQuaternary: '#3C3C432E',
  
  // System colors
  systemRed: '#FF3B30',
  systemOrange: '#FF9500',
  systemYellow: '#FFCC00',
  systemGreen: '#34C759',
  systemBlue: '#007AFF',
  systemIndigo: '#5856D6',
  systemPurple: '#AF52DE',
  systemPink: '#FF2D92',
  
  // Separators
  separator: '#3C3C434A',
  separatorOpaque: '#C6C6C8',
  
  // Fills
  fill: '#78788033',
  fillSecondary: '#78788028',
  fillTertiary: '#7676801E',
  
  // Chips & Tags
  chipBg: '#007AFF0F',
  chipBgSelected: '#007AFF',
  chipText: '#007AFF',
  chipTextSelected: '#FFFFFF',
  
  // Success/Error states
  success: '#34C759',
  successBg: '#34C7590F',
  error: '#FF3B30',
  errorBg: '#FF3B300F',
};

const Typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
};

const Spacing = {
  xxxs: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  xxxxl: 40,
};

const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  continuous: 28, // Apple's continuous corner radius
};

const Shadows = {
  // Shadows subtiles inspirées d'iOS
  level1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  level3: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  level4: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
};

/* --- Dépendances optionnelles (drop-down, time picker, calendar) --- */
type DropDownType = React.ComponentType<{
  label: string;
  visible: boolean;
  showDropDown: () => void;
  onDismiss: () => void;
  value: string | null;
  setValue: (v: string | null) => void;
  list: { label: string; value: string }[];
  mode?: 'outlined' | 'flat';
  style?: any;
}> | null;
let DropDown: DropDownType = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DropDown = require('react-native-paper-dropdown')?.default ?? null;
} catch {
  DropDown = null;
}

type DateTimePickerModalType = React.ComponentType<{
  isVisible: boolean;
  mode: 'time' | 'date' | 'datetime';
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}> | null;
let DateTimePickerModal: DateTimePickerModalType = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  DateTimePickerModal = require('react-native-modal-datetime-picker')?.default ?? null;
} catch {
  DateTimePickerModal = null;
}

type CalendarType = React.ComponentType<{
  onDayPress: (d: { dateString: string }) => void;
  markedDates: Record<string, { selected: boolean }>;
  style?: any;
}> | null;
let Calendar: CalendarType = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Calendar = require('react-native-calendars')?.Calendar ?? null;
} catch {
  Calendar = null;
}

/* --- Types données --- */
type Doctor = {
  _id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  specialties?: { name: string }[];
  languages?: string[];
  ratingAverage?: number;
  baseRate?: number;
};

type Slot = {
  _id: string;
  start: string; // ISO
  end: string;   // ISO
  isBooked?: boolean;
};

/* --- Helpers sûrs --- */
const toHHmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const parseISOOrNull = (v: string) => {
  const dt = new Date(v);
  return Number.isNaN(dt.getTime()) ? null : dt;
};
const isFuture = (iso: string) => {
  const d = parseISOOrNull(iso);
  return !!d && d.getTime() > Date.now();
};
const sameDay = (iso: string, ymd: string) => iso.startsWith(ymd);
const ymdFromDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Debounce simple
const useDebounced = <T,>(value: T, delay = 350) => {
  const [debounced, setDebounced] = useState(value);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setDebounced(value), delay);

    return () => {
      if (t.current) {
        clearTimeout(t.current);
        t.current = null;
      }
    };
  }, [value, delay]);
  return debounced;
};

/* --- Heuristique de suggestion spécialité selon symptômes --- */
const suggestSpecialty = (symptom: string): { value: string; label: string } | null => {
  const s = symptom.toLowerCase();
  if (!s.trim()) return null;
  if (/(cœur|coeur|thorax|douleur thoracique|palpitation)/.test(s)) return { value: 'cardio', label: 'Cardiologue' };
  if (/(enfant|pédiatr|pediatr|bébé|bebe)/.test(s)) return { value: 'pediatre', label: 'Pédiatre' };
  if (/(peau|acné|acne|eczéma|eczema|bouton|tache|dermat)/.test(s)) return { value: 'dermato', label: 'Dermatologue' };
  return { value: 'general', label: 'Généraliste' };
};

/* --- Écran --- */
export default function ScheduleConsultationScreen() {
  const { user } = useAuth();

  // Étape 1 = recherche, Étape 2 = planif
  const [step, setStep] = useState<1 | 2>(1);

  // Saisie / filtres
  const [symptom, setSymptom] = useState('');
  const debouncedSymptom = useDebounced(symptom, 300);
  const autoSuggestion = useMemo(() => suggestSpecialty(debouncedSymptom), [debouncedSymptom]);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);

  const [specialty, setSpecialty] = useState<string | null>(null);
  const [showSpecialtyDD, setShowSpecialtyDD] = useState(false);
  const [minRating, setMinRating] = useState<string>('');
  const [isTelemedicine, setIsTelemedicine] = useState(true);

  // Données
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorsError, setDoctorsError] = useState<string | null>(null);

  const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Date / heure
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(''); // HH:mm
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // Détails consultation
  const [type, setType] = useState<'VIDEO' | 'VOICE' | 'CHAT'>('VIDEO');
  const [duration, setDuration] = useState<string>('30');

  // États UI
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  // Options locales (exemple)
  const specialtiesOptions = useMemo(
    () => [
      { label: 'Généraliste', value: 'general' },
      { label: 'Cardiologue', value: 'cardio' },
      { label: 'Pédiatre', value: 'pediatre' },
      { label: 'Dermatologue', value: 'dermato' },
    ],
    []
  );

  // Date options depuis les slots
  const dateOptions = useMemo(() => {
    const set = new Set<string>();
    slots.forEach((s) => {
      const d = s.start.slice(0, 10);
      set.add(d);
    });
    // tri ascendant
    return Array.from(set)
      .sort()
      .map((d) => {
        const dd = parseISOOrNull(`${d}T00:00:00`) || new Date(d);
        const label = dd.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
        return { label, value: d };
      });
  }, [slots]);

  const timeOptions = useMemo(() => {
    if (!selectedDate) return [];
    return slots
      .filter((s) => sameDay(s.start, selectedDate))
      .map((s) => {
        const d = parseISOOrNull(s.start);
        return { label: d ? toHHmm(d) : '', value: d ? toHHmm(d) : '' };
      });
  }, [slots, selectedDate]);

  // Récupération médecins
  const fetchDoctors = useCallback(async () => {
    setLoadingDoctors(true);
    setDoctorsError(null);
    try {
      const effectiveSpecialty = specialty || autoSuggestion?.value || undefined;
      const params: Record<string, any> = {
        q: debouncedSearch || debouncedSymptom || undefined,
        specialties: effectiveSpecialty ? [effectiveSpecialty] : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        isTelemedicine,
        page: 1,
        limit: 10,
        sortBy: 'ratingAverage',
        sortDir: 'desc',
      };

      const resp = await api.doctor.get('/doctors/search', { params });
      const data = Array.isArray(resp?.data?.data) ? (resp.data.data as Doctor[]) : [];
      setDoctors(data);
    } catch (e: any) {
      console.error('fetchDoctors error', e);
      setDoctors([]);
      setDoctorsError(e?.message ?? 'Impossible de charger les médecins.');
    } finally {
      setLoadingDoctors(false);
    }
  }, [debouncedSearch, debouncedSymptom, specialty, minRating, isTelemedicine, autoSuggestion?.value]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Récupération slots
  const loadSlots = useCallback(async (docId: string) => {
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const resp = await api.doctor.get(`/doctors/${docId}/availability`);
      const arr: Slot[] = Array.isArray(resp?.data) ? resp.data : [];
      const avail = arr
        .filter((s) => !s.isBooked && isFuture(s.end))
        .sort((a, b) => (parseISOOrNull(a.start)?.getTime() ?? 0) - (parseISOOrNull(b.start)?.getTime() ?? 0));
      setSlots(avail);
    } catch (err: any) {
      console.error('loadSlots error', err);
      setSlots([]);
      setSlotsError(err?.message ?? 'Impossible de charger les disponibilités.');
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  // Validation & soumission
  const durationNum = Number(duration);
  const canSubmit =
    !!selectedDoctor &&
    !!selectedDate &&
    !!selectedTime &&
    !Number.isNaN(durationNum) &&
    durationNum >= 5 &&
    durationNum <= 180;

  const resetPlanif = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSubmitError(null);
  };

  const createConsultation = useCallback(async () => {
    setSubmitError(null);
    if (!canSubmit || !selectedDoctor) return;

    const [h, m] = selectedTime.split(':').map(Number);
    const startLocal = new Date(selectedDate + 'T00:00:00');
    if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(startLocal.getTime())) {
      setSubmitError('Heure ou date invalide.');
      return;
    }
    startLocal.setHours(h, m, 0, 0);

    try {
      setSubmitting(true);
      const payload = {
        patientId: (user as any)?.id ?? (user as any)?._id,
        doctorId: selectedDoctor._id,
        startTime: startLocal.toISOString(),
        duration: durationNum,
        type,
        reason: symptom.trim() || undefined,
      };
      await api.consult.post('/consultations', payload);

      // Succès -> reset UX
      setSuccessVisible(true);
      setStep(1);
      setExpandedDoctorId(null);
      setSelectedDoctor(null);
      resetPlanif();
    } catch (err: any) {
      console.error('createConsultation error', err);
      setSubmitError(err?.response?.data?.message ?? 'La réservation a échoué. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, selectedDoctor, selectedDate, selectedTime, durationNum, type, symptom, user]);

  /* --- UI: élément médecin --- */
  const DoctorItem = ({ item }: { item: Doctor }) => {
    const isExpanded = expandedDoctorId === item._id;

    return (
      <View style={styles.doctorCard}>
        {/* Header de la carte médecin */}
        <View 
          style={styles.docHeader} 
          accessible 
          accessibilityRole="button" 
          accessibilityLabel={`Choisir ${item.firstName} ${item.lastName}`}
          onTouchEnd={() => {
            if (isExpanded) {
              setExpandedDoctorId(null);
              setSelectedDoctor(null);
              resetPlanif();
            } else {
              setExpandedDoctorId(item._id);
              setSelectedDoctor(item);
              resetPlanif();
              loadSlots(item._id);
              setStep(2);
            }
          }}
        >
          <Avatar uri={item.photoUrl} name={`${item.firstName} ${item.lastName}`} size={64} />
          <View style={styles.docHeaderInfo}>
            <Text style={styles.docName}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.docSpecialty}>
              {item.specialties?.map((s) => s.name).join(', ') || '—'}
            </Text>
            <View style={styles.tagContainer}>
              <View style={styles.ratingTag}>
                <Text style={styles.ratingText}>⭐ {item.ratingAverage?.toFixed(1) ?? '—'}</Text>
              </View>
              {typeof item.baseRate === 'number' && (
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>{item.baseRate} CFA</Text>
                </View>
              )}
              {item.languages?.length && (
                <View style={styles.languageTag}>
                  <Text style={styles.languageText}>{item.languages.join(', ')}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Text style={styles.chevron}>{isExpanded ? '⌃' : '⌄'}</Text>
          </View>
        </View>

        {/* Panneau planification (expansion) */}
        {isExpanded && (
          <>
            <View style={styles.separator} />
            <View style={styles.planifBlock}>
              {/* Section Type de consultation */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>Type de consultation</Text>
                <RadioButton.Group value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <View style={styles.radioContainer}>
                    <View style={styles.radioOption}>
                      <RadioButton value="VIDEO" color={Colors.primary} />
                      <Text style={styles.radioLabel}>Vidéo</Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="VOICE" color={Colors.primary} />
                      <Text style={styles.radioLabel}>Voix</Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="CHAT" color={Colors.primary} />
                      <Text style={styles.radioLabel}>Chat</Text>
                    </View>
                  </View>
                </RadioButton.Group>
              </View>

              {/* Section Date */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>Date</Text>
                {slotsLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>Chargement des créneaux…</Text>
                  </View>
                ) : slotsError ? (
                  <EmptyState
                    icon="warning"
                    title="Créneaux indisponibles"
                    description={slotsError}
                    actionLabel="Réessayer"
                    onAction={() => selectedDoctor && loadSlots(selectedDoctor._id)}
                  />
                ) : dateOptions.length === 0 ? (
                  <EmptyState 
                    icon="calendar-clear" 
                    title="Aucune date proche" 
                    description="Aucun créneau disponible pour l'instant." 
                  />
                ) : (
                  <View style={styles.optionsGrid}>
                    {dateOptions.map((option) => (
                      <View
                        key={option.value}
                        style={[
                          styles.optionChip,
                          selectedDate === option.value && styles.optionChipSelected
                        ]}
                        onTouchEnd={() => {
                          setSelectedDate(option.value);
                          setSelectedTime('');
                        }}
                      >
                        <Text style={[
                          styles.optionChipText,
                          selectedDate === option.value && styles.optionChipTextSelected
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Section Heure */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>Heure</Text>
                <View style={styles.optionsGrid}>
                  {selectedDate ? timeOptions.map((option) => (
                    <View
                      key={option.value}
                      style={[
                        styles.optionChip,
                        selectedTime === option.value && styles.optionChipSelected
                      ]}
                      onTouchEnd={() => setSelectedTime(option.value)}
                    >
                      <Text style={[
                        styles.optionChipText,
                        selectedTime === option.value && styles.optionChipTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                  )) : (
                    <Text style={styles.disabledText}>Choisissez d'abord une date</Text>
                  )}
                </View>
              </View>

              {/* Section Durée */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>Durée</Text>
                <InputField
                  label=""
                  placeholder="Durée en minutes (5-180)"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="numeric"
                  style={styles.durationInput}
                  errorText={
                    duration &&
                    (Number(duration) < 5 || Number(duration) > 180 || Number.isNaN(Number(duration)))
                      ? 'Entre 5 et 180 minutes'
                      : undefined
                  }
                />
              </View>

              {!!submitError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{submitError}</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <View style={styles.actionButton}>
                  <PrimaryButton 
                    mode="outlined" 
                    onPress={() => { 
                      setExpandedDoctorId(null); 
                      setSelectedDoctor(null); 
                      resetPlanif(); 
                    }}
                    style={styles.cancelButton}
                  >
                    Annuler
                  </PrimaryButton>
                </View>
                <View style={styles.actionButton}>
                  <PrimaryButton
                    mode="contained"
                    onPress={createConsultation}
                    loading={submitting}
                    disabled={!canSubmit || submitting}
                    style={styles.confirmButton}
                  >
                    Confirmer le rendez-vous
                  </PrimaryButton>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  /* --- Rendus principaux --- */
  const renderHeaderFilters = () => (
    <View style={styles.filtersCard}>
      <Text style={styles.cardTitle}>Trouver un spécialiste</Text>

      {/* Saisie symptôme */}
      <View style={styles.inputContainer}>
        <InputField
          label="Décrivez vos symptômes"
          value={symptom}
          onChangeText={setSymptom}
          placeholder="ex : éruption cutanée, douleur thoracique, fièvre…"
          multiline
          style={styles.symptomInput}
        />
        {autoSuggestion && (
          <View style={styles.suggestionContainer}>
            <View
              style={[
                styles.suggestionChip,
                specialty === autoSuggestion.value && styles.suggestionChipSelected
              ]}
              onTouchEnd={() => 
                setSpecialty((v) => (v === autoSuggestion.value ? null : autoSuggestion.value))
              }
            >
              <Text style={[
                styles.suggestionText,
                specialty === autoSuggestion.value && styles.suggestionTextSelected
              ]}>
                💡 Suggéré : {autoSuggestion.label}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Recherche */}
      <View style={styles.inputContainer}>
        <Searchbar
          placeholder="Nom, langue, ville…"
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Filtres */}
      <View style={styles.filtersRow}>
        <View style={styles.filterItem}>
        </View>

        <View style={styles.filterToggle}>
          <Text style={styles.filterLabel}>Type</Text>
          <View
            style={[
              styles.toggleButton,
              isTelemedicine ? styles.toggleButtonActive : styles.toggleButtonInactive
            ]}
            onTouchEnd={() => setIsTelemedicine((v) => !v)}
            accessible
            accessibilityRole="switch"
            accessibilityState={{ checked: isTelemedicine }}
          >
            <Text style={[
              styles.toggleText,
              isTelemedicine ? styles.toggleTextActive : styles.toggleTextInactive
            ]}>
              {isTelemedicine ? '📹 Téléconsultation' : '🏥 Présentiel'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderDoctors = () => {
    if (loadingDoctors) {
      return (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTitle}>Recherche en cours…</Text>
          <Text style={styles.loadingSubtitle}>Nous trouvons les meilleurs spécialistes pour vous</Text>
        </View>
      );
    }
    if (doctorsError) {
      return (
        <View style={styles.errorCard}>
          <EmptyState
            icon="warning-outline"
            title="Erreur de chargement"
            description={doctorsError}
            actionLabel="Réessayer"
            onAction={fetchDoctors}
          />
        </View>
      );
    }
    if (doctors.length === 0) {
      return (
        <View style={styles.emptyCard}>
          <EmptyState
            icon="search"
            title="Aucun médecin trouvé"
            description="Modifiez vos critères de recherche ou essayez un autre mot-clé."
          />
        </View>
      );
    }
    return (
      <View style={styles.doctorsContainer}>
        <Text style={styles.resultsTitle}>
          {doctors.length} médecin{doctors.length > 1 ? 's' : ''} trouvé{doctors.length > 1 ? 's' : ''}
        </Text>
        <FlatList
          data={doctors}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <DoctorItem item={item} />}
          contentContainerStyle={styles.doctorsList}
          removeClippedSubviews
          initialNumToRender={6}
          windowSize={7}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  return (
    <>
      <HeaderBar title="Planifier une consultation" />
      <Screen scroll={false} padded={false} style={styles.screenContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderHeaderFilters()}
          {renderDoctors()}
        </ScrollView>
      </Screen>

      {/* Modal de succès */}
      {successVisible && (
        <Portal>
          <Modal 
            visible 
            onDismiss={() => setSuccessVisible(false)} 
            contentContainerStyle={styles.successModal}
          >
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Rendez-vous confirmé</Text>
              <Text style={styles.successDescription}>
                Vous recevrez une notification avec tous les détails de votre consultation.
              </Text>
              <PrimaryButton
                mode="contained"
                onPress={() => setSuccessVisible(false)}
                style={styles.successButton}
              >
                Parfait
              </PrimaryButton>
            </View>
          </Modal>
        </Portal>
      )}
    </>
  );
}

/* --- Styles raffinés inspirés d'Apple --- */
const styles = StyleSheet.create({
  // Layout principal
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },

  // Carte de filtres
  filtersCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.continuous,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.level2,
  },
  cardTitle: {
    ...Typography.title2,
    color: Colors.label,
    marginBottom: Spacing.lg,
  },

  // Inputs et champs
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  symptomInput: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 80,
    ...Typography.body,
    borderWidth: 0,
  },
  searchBar: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: Radius.md,
    ...Shadows.level1,
  },
  searchInput: {
    ...Typography.body,
    color: Colors.label,
  },

  // Suggestion automatique
  suggestionContainer: {
    marginTop: Spacing.sm,
  },
  suggestionChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.chipBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  suggestionChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  suggestionText: {
    ...Typography.footnote,
    color: Colors.primary,
    fontWeight: '600',
  },
  suggestionTextSelected: {
    color: Colors.surface,
  },

  // Filtres en ligne
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    ...Typography.caption1,
    color: Colors.labelSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xxs,
  },
  ratingInput: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    textAlign: 'center',
    ...Typography.callout,
    fontWeight: '600',
  },
  filterToggle: {
    alignItems: 'flex-start',
  },
  toggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    minWidth: 140,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toggleButtonInactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.separator,
  },
  toggleText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Colors.surface,
  },
  toggleTextInactive: {
    color: Colors.labelSecondary,
  },

  // États de chargement et erreur
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.continuous,
    padding: Spacing.xxxxl,
    alignItems: 'center',
    ...Shadows.level1,
  },
  loadingTitle: {
    ...Typography.headline,
    color: Colors.label,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxs,
  },
  loadingSubtitle: {
    ...Typography.subhead,
    color: Colors.labelSecondary,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.continuous,
    padding: Spacing.xl,
    ...Shadows.level1,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.continuous,
    padding: Spacing.xl,
    ...Shadows.level1,
  },

  // Liste des médecins
  doctorsContainer: {
    flex: 1,
  },
  resultsTitle: {
    ...Typography.headline,
    color: Colors.labelSecondary,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xxs,
  },
  doctorsList: {
    gap: Spacing.md,
  },

  // Carte médecin
  doctorCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.continuous,
    padding: Spacing.xl,
    ...Shadows.level2,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  docHeaderInfo: {
    flex: 1,
  },
  docName: {
    ...Typography.headline,
    color: Colors.label,
    marginBottom: Spacing.xxxs,
  },
  docSpecialty: {
    ...Typography.subhead,
    color: Colors.labelSecondary,
    marginBottom: Spacing.sm,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  ratingTag: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxxs,
    borderRadius: Radius.xs,
  },
  ratingText: {
    ...Typography.caption1,
    color: Colors.success,
    fontWeight: '600',
  },
  priceTag: {
    backgroundColor: Colors.chipBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxxs,
    borderRadius: Radius.xs,
  },
  priceText: {
    ...Typography.caption1,
    color: Colors.primary,
    fontWeight: '600',
  },
  languageTag: {
    backgroundColor: Colors.fillSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxxs,
    borderRadius: Radius.xs,
  },
  languageText: {
    ...Typography.caption1,
    color: Colors.labelSecondary,
    fontWeight: '500',
  },
  chevronContainer: {
    padding: Spacing.xs,
  },
  chevron: {
    ...Typography.title3,
    color: Colors.labelTertiary,
    fontWeight: '300',
  },

  // Séparateur
  separator: {
    height: 1,
    backgroundColor: Colors.separator,
    marginVertical: Spacing.lg,
    marginHorizontal: -Spacing.xl,
  },

  // Panneau de planification
  planifBlock: {
    gap: Spacing.lg,
  },
  sectionContainer: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.caption1,
    color: Colors.labelSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Radio buttons
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: Radius.md,
    padding: Spacing.xxs,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  radioLabel: {
    ...Typography.callout,
    color: Colors.label,
    marginLeft: Spacing.xs,
  },

  // Grille d'options (dates/heures)
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  optionChip: {
    backgroundColor: Colors.backgroundTertiary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.separator,
    minWidth: 80,
    alignItems: 'center',
  },
  optionChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionChipText: {
    ...Typography.callout,
    color: Colors.label,
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: Colors.surface,
    fontWeight: '600',
  },
  disabledText: {
    ...Typography.subhead,
    color: Colors.labelTertiary,
    fontStyle: 'italic',
  },

  // Champ durée
  durationInput: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    textAlign: 'center',
    fontWeight: '600',
  },

  // États de chargement dans les sections
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    ...Typography.subhead,
    color: Colors.labelSecondary,
  },

  // Erreurs
  errorContainer: {
    backgroundColor: Colors.errorBg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: {
    ...Typography.subhead,
    color: Colors.error,
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  cancelButton: {
    borderColor: Colors.separator,
    backgroundColor: Colors.surface,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    ...Shadows.level1,
  },

  // Modal de succès
  successModal: {
    margin: Spacing.xl,
    backgroundColor: 'transparent',
  },
  successContent: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.continuous,
    padding: Spacing.xxxxl,
    alignItems: 'center',
    ...Shadows.level4,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successIconText: {
    fontSize: 32,
    color: Colors.success,
    fontWeight: '700',
  },
  successTitle: {
    ...Typography.title2,
    color: Colors.label,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successDescription: {
    ...Typography.body,
    color: Colors.labelSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  successButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    ...Shadows.level1,
  },
});