import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, ProgressBar, RadioButton, Switch, Text, useTheme } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import PhoneField from '../components/PhoneField';
import { DEFAULT_DIAL_CODE } from '../constants/countries';
import { normalizePhone } from '../utils/phone';
import { useAuth, consumePendingProtectedRoute } from '../store/auth';
import { api } from '../services/api/http';
import { Spacing } from '../theme/theme';
import { useTranslation } from 'react-i18next';

// =========================
// Types & Schema
// =========================

const titles = [
  { value: 'DR', label: 'Dr' },
  { value: 'PR', label: 'Pr' },
  { value: 'PR_DR', label: 'Pr Dr' },
  { value: 'IDE', label: 'IDE' },
  { value: 'INF', label: 'Inf.' },
  { value: 'IADE', label: 'IADE' },
  { value: 'IBODE', label: 'IBODE' },
  { value: 'SF', label: 'SF' },
  { value: 'PHARM', label: 'Pharm.' },
  { value: 'KINE', label: 'Kiné' },
  { value: 'PSY', label: 'Psy' },
  { value: 'AUTRE', label: 'Autre' },
] as const;

type TitleValue = typeof titles[number]['value'];

type Specialty = { _id: string; name: string; description?: string };

const availabilityModes = [
  { value: 'BOTH', label: 'Présentiel & Téléconsultation' },
  { value: 'ONSITE', label: 'Présentiel uniquement' },
  { value: 'REMOTE', label: 'Téléconsultation uniquement' },
] as const;

const languagesCatalog = ['fr', 'en', 'es', 'ar'];

// Step 1 — Compte
const step1Schema = z.object({
  firstName: z.string().min(2, 'Prénom trop court'),
  lastName: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  dialCode: z.string().regex(/^\+\d{1,4}$/u, 'Indicatif invalide').default(DEFAULT_DIAL_CODE),
  phone: z.string().min(6, 'Téléphone invalide'),
  password: z.string().min(6, '6 caractères minimum'),
});

// Step 2 — Profession
const step2Schema = z.object({
  title: z.enum(['DR','PR','PR_DR','INF','IDE','IADE','IBODE','SF','PHARM','KINE','PSY','DIET','ERGO','ORTOPT','AUDIOPROTH','TECH','AUTRE']).default('DR'),
  baseRate: z.coerce.number().min(0, 'Tarif >= 0'),
  languages: z.array(z.string()).default([]),
  isTelemedicine: z.boolean().default(true),
  availabilityMode: z.enum(['ONSITE','REMOTE','BOTH']).default('BOTH'),
});

// Step 3 — Spécialités
const step3Schema = z.object({
  specialties: z.array(z.string()).min(1, 'Choisissez au moins une spécialité'),
  registrationNumber: z.string().optional().or(z.literal('')).transform(v => v || undefined),
});

// Step 4 — Adresse principale (simple)
const step4Schema = z.object({
  clinicLine1: z.string().min(2, 'Adresse requise'),
  clinicCity: z.string().min(2, 'Ville requise'),
  clinicRegion: z.string().optional().or(z.literal('')).transform(v => v || undefined),
  clinicCountry: z.string().min(2, 'Pays requis'),
  clinicLng: z.coerce.number().optional(),
  clinicLat: z.coerce.number().optional(),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema);

type FormData = z.infer<typeof fullSchema>;

// =========================
// UI Helpers
// =========================
function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  const theme = useTheme();
  const progress = step / total;
  return (
    <View style={{ gap: 8 }}>
      <Text variant="titleMedium">{title}</Text>
      <ProgressBar progress={progress} color={theme.colors.primary} />
      <Text variant="labelSmall">{Math.round(progress * 100)}%</Text>
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;
}

function Col({ children, flex = 1 }: { children: React.ReactNode; flex?: number }) {
  return <View style={{ flex }}>{children}</View>;
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      {title ? <Text variant="titleSmall">{title}</Text> : null}
      {children}
    </View>
  );
}

// =========================
// Main Component
// =========================
export default function SignupDoctorWizard({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [specs, setSpecs] = useState<Specialty[]>([]);
  const [step, setStep] = useState(1); // 1..5 (4 steps + recap)

  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      dialCode: DEFAULT_DIAL_CODE,
      phone: '',
      password: '',
      title: 'DR',
      baseRate: undefined as unknown as number,
      languages: ['fr'],
      isTelemedicine: true,
      availabilityMode: 'BOTH',
      specialties: [],
      registrationNumber: undefined,
      clinicLine1: '',
      clinicCity: '',
      clinicRegion: '',
      clinicCountry: '',
      clinicLng: undefined,
      clinicLat: undefined,
    },
  });

  // Load specialties once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingSpecs(true);
        // Try doctor service proxy first, then fallback
        const resp = await (api.doctor?.get('/specialties').catch(() => api.doctor.get('/specialties')));
        const arr: Specialty[] = resp?.data || [];
        if (mounted) setSpecs(arr);
      } catch (e) {
        // soft-fail, keep empty list
      } finally {
        setLoadingSpecs(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1: return 'Compte';
      case 2: return 'Profil professionnel';
      case 3: return 'Spécialités';
      case 4: return 'Adresse du cabinet';
      case 5: return 'Récapitulatif';
      default: return '';
    }
  }, [step]);

  const totalSteps = 5;

  const goNext = async () => {
    setSubmitError(null);
    // validate only relevant fields for current step
    const fieldsByStep: Record<number, (keyof FormData)[]> = {
      1: ['firstName','lastName','email','dialCode','phone','password'],
      2: ['title','baseRate','languages','isTelemedicine','availabilityMode'],
      3: ['specialties','registrationNumber'],
      4: ['clinicLine1','clinicCity','clinicCountry','clinicLng','clinicLat'],
      5: [],
    };
    const ok = await trigger(fieldsByStep[step]);
    if (ok) setStep(s => Math.min(totalSteps, s + 1));
  };

  const goPrev = () => setStep(s => Math.max(1, s - 1));

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      // 1) Create User
      const userPayload = {
        name: `${data.firstName.trim()} ${data.lastName.trim()}`.trim(),
        email: data.email.trim().toLowerCase(),
        phone: normalizePhone(data.phone, data.dialCode),
        password: data.password,
      };
      const u = await api.auth.post('/users', userPayload);
      console.log('User creation response');
      const userData = u.data || {};
      const userId = userData._id;
      console.log('User created with ID', userId);
      if (!userId) throw new Error('Impossible de récupérer l\'ID utilisateur.');
      console.log('Created user', userData);
      // 2) Login
      await signIn(userPayload.email, userPayload.password);

      // 3) Create Doctor profile
      const clinic: any = {
        line1: data.clinicLine1,
        city: data.clinicCity,
        region: data.clinicRegion,
        country: data.clinicCountry,
      };
      if (
        typeof data.clinicLng === 'number' && !Number.isNaN(data.clinicLng) &&
        typeof data.clinicLat === 'number' && !Number.isNaN(data.clinicLat)
      ) {
        clinic.coordinates = [Number(data.clinicLng), Number(data.clinicLat)] as [number, number];
      }

      await api.doctor.post('/doctors', {
        userId,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        title: data.title,
        baseRate: Number(data.baseRate),
        languages: data.languages,
        isTelemedicine: data.isTelemedicine,
        availabilityMode: data.availabilityMode,
        registrationNumber: data.registrationNumber,
        specialties: data.specialties,
        clinicAddresses: [clinic],
      });

      const target = consumePendingProtectedRoute('Home');
      const parent = navigation.getParent?.();
      parent?.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: target } }] });
    } catch (err: any) {
      const msg = err?.message || 'Inscription impossible.';
      setSubmitError(msg);
    }
  };

  // =========================
  // Step Views
  // =========================

  const Step1 = (
    <View style={styles.stepContent}>
      <Row>
        <Col>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField label="Prénom" value={value} onBlur={onBlur} onChangeText={onChange}
                error={!!errors.firstName} errorText={errors.firstName?.message as string} />
            )}
          />
        </Col>
        <Col>
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField label="Nom" value={value} onBlur={onBlur} onChangeText={onChange}
                error={!!errors.lastName} errorText={errors.lastName?.message as string} />
            )}
          />
        </Col>
      </Row>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Email" keyboardType="email-address" value={value}
            onBlur={onBlur} onChangeText={onChange}
            error={!!errors.email} errorText={errors.email?.message as string} />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <PhoneField
            value={value || ''}
            onChangeText={onChange}
            onBlur={onBlur}
            dialCode={getValues('dialCode')}
            onDialCodeChange={(d) => setValue('dialCode', d)}
            label="Téléphone"
            error={!!errors.phone}
            errorText={errors.phone?.message as string}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Mot de passe" secureTextEntry value={value}
            onBlur={onBlur} onChangeText={onChange}
            error={!!errors.password} errorText={errors.password?.message as string} />
        )}
      />
    </View>
  );

  const Step2 = (
    <View style={styles.stepContent}>
      <Section title="Appellation & Tarification">
        <Row>
          <Col>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <View style={{ gap: 8 }}>
                  <Text variant="labelLarge">Appellation</Text>
                  <RadioButton.Group onValueChange={onChange} value={value as TitleValue}>
                    <View style={styles.chipsWrap}>
                      {titles.map(ti => (
                        <Chip key={ti.value} selected={value === ti.value} onPress={() => onChange(ti.value)}>
                          {ti.label}
                        </Chip>
                      ))}
                    </View>
                  </RadioButton.Group>
                </View>
              )}
            />
          </Col>
        </Row>

        <Row>
          <Col>
            <Controller
              control={control}
              name="baseRate"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputField label="Tarif de base" keyboardType="numeric" value={String(value ?? '')}
                  onBlur={onBlur} onChangeText={onChange}
                  error={!!errors.baseRate} errorText={errors.baseRate?.message as string} />
              )}
            />
          </Col>
        </Row>
      </Section>

      <Section title="Langues & Disponibilité">
        <View style={{ gap: 8 }}>
          <Text variant="labelLarge">Langues</Text>
          <Controller
            control={control}
            name="languages"
            render={({ field: { value, onChange } }) => (
              <View style={styles.chipsWrap}>
                {languagesCatalog.map(code => (
                  <Chip key={code} selected={value?.includes(code)} onPress={() => {
                    const set = new Set(value || []);
                    set.has(code) ? set.delete(code) : set.add(code);
                    onChange(Array.from(set));
                  }}>{code.toUpperCase()}</Chip>
                ))}
              </View>
            )}
          />
        </View>

        <Row>
          <Col>
            <Controller
              control={control}
              name="isTelemedicine"
              render={({ field: { value, onChange } }) => (
                <View style={styles.switchRow}>
                  <Text>Propose la téléconsultation</Text>
                  <Switch value={!!value} onValueChange={onChange} />
                </View>
              )}
            />
          </Col>
          <Col>
            <Controller
              control={control}
              name="availabilityMode"
              render={({ field: { value, onChange } }) => (
                <View style={{ gap: 8 }}>
                  <Text variant="labelLarge">Mode</Text>
                  <View style={styles.chipsWrap}>
                    {availabilityModes.map(m => (
                      <Chip key={m.value} selected={value === m.value} onPress={() => onChange(m.value)}>
                        {m.label}
                      </Chip>
                    ))}
                  </View>
                </View>
              )}
            />
          </Col>
        </Row>
      </Section>
    </View>
  );

  const Step3 = (
    <View style={styles.stepContent}>
      <Section title="Spécialités">
        {loadingSpecs ? (
          <Text>Chargement des spécialités…</Text>
        ) : (
          <Controller
            control={control}
            name="specialties"
            render={({ field: { value, onChange } }) => (
              <View style={{ gap: 8 }}>
                <Text variant="labelLarge">Choisissez vos spécialités</Text>
                <View style={styles.chipsWrap}>
                  {specs.map(s => (
                    <Chip key={s._id} selected={value?.includes(s._id)} onPress={() => {
                      const set = new Set(value || []);
                      set.has(s._id) ? set.delete(s._id) : set.add(s._id);
                      onChange(Array.from(set));
                    }}>{s.name}</Chip>
                  ))}
                </View>
                {!!errors.specialties && (
                  <HelperText type="error" visible>
                    {String(errors.specialties.message)}
                  </HelperText>
                )}
              </View>
            )}
          />
        )}
      </Section>

      <Controller
        control={control}
        name="registrationNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Numéro d\'inscription (optionnel)" value={value || ''}
            onBlur={onBlur} onChangeText={onChange}
            error={!!errors.registrationNumber} errorText={errors.registrationNumber?.message as string} />
        )}
      />
    </View>
  );

  const Step4 = (
    <View style={styles.stepContent}>
      <Controller
        control={control}
        name="clinicLine1"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Adresse (ligne 1)" value={value}
            onBlur={onBlur} onChangeText={onChange}
            error={!!errors.clinicLine1} errorText={errors.clinicLine1?.message as string} />
        )}
      />

      <Row>
        <Col>
          <Controller
            control={control}
            name="clinicCity"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField label="Ville" value={value}
                onBlur={onBlur} onChangeText={onChange}
                error={!!errors.clinicCity} errorText={errors.clinicCity?.message as string} />
            )}
          />
        </Col>
        <Col>
          <Controller
            control={control}
            name="clinicRegion"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField label="Région (optionnel)" value={value || ''}
                onBlur={onBlur} onChangeText={onChange}
                error={!!errors.clinicRegion} errorText={errors.clinicRegion?.message as string} />
            )}
          />
        </Col>
      </Row>

      <Controller
        control={control}
        name="clinicCountry"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Pays" value={value}
            onBlur={onBlur} onChangeText={onChange}
            error={!!errors.clinicCountry} errorText={errors.clinicCountry?.message as string} />
        )}
      />

      <Row>
        <Col>
          <Controller
            control={control}
            name="clinicLng"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField label="Longitude (optionnel)" keyboardType="numeric" value={String(value ?? '')}
                onBlur={onBlur} onChangeText={onChange}
                error={!!errors.clinicLng} errorText={errors.clinicLng?.message as string} />
            )}
          />
        </Col>
        <Col>
          <Controller
            control={control}
            name="clinicLat"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputField label="Latitude (optionnel)" keyboardType="numeric" value={String(value ?? '')}
                onBlur={onBlur} onChangeText={onChange}
                error={!!errors.clinicLat} errorText={errors.clinicLat?.message as string} />
            )}
          />
        </Col>
      </Row>
    </View>
  );

  const Recap = () => {
    const v = getValues();
    const specNames = v.specialties.map(id => specs.find(s => s._id === id)?.name || id);
    const modeLabel = availabilityModes.find(a => a.value === v.availabilityMode)?.label;
    const titleLabel = titles.find(t => t.value === v.title)?.label || v.title;
    return (
      <View style={styles.stepContent}>
        <Section title="Compte">
          <Text>{`${v.firstName} ${v.lastName}`}</Text>
          <Text>{v.email}</Text>
          <Text>{normalizePhone(v.phone, v.dialCode)}</Text>
        </Section>
        <Section title="Profil">
          <Text>{`Appellation: ${titleLabel}`}</Text>
          <Text>{`Tarif de base: ${v.baseRate}`}</Text>
          <Text>{`Langues: ${(v.languages || []).map(l => l.toUpperCase()).join(', ')}`}</Text>
          <Text>{`Mode: ${modeLabel}`}</Text>
          <Text>{`Téléconsultation: ${v.isTelemedicine ? 'Oui' : 'Non'}`}</Text>
        </Section>
        <Section title="Spécialités">
          <Text>{specNames.join(', ')}</Text>
          {v.registrationNumber ? <Text>{`N° inscription: ${v.registrationNumber}`}</Text> : null}
        </Section>
        <Section title="Adresse du cabinet">
          <Text>{v.clinicLine1}</Text>
          <Text>{`${v.clinicCity}${v.clinicRegion ? ', ' + v.clinicRegion : ''}`}</Text>
          <Text>{v.clinicCountry}</Text>
          {(v.clinicLng != null && v.clinicLat != null) ? (
            <Text>{`Coord.: ${v.clinicLng}, ${v.clinicLat}`}</Text>
          ) : null}
        </Section>
      </View>
    );
  };

  // =========================
  // Render
  // =========================
  return (
    <AuthLayout
      title="Inscription praticien"
      subtitle={stepTitle}
      footer={
        <Button onPress={() => navigation.goBack()} mode="text">
          Retour
        </Button>
      }
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <StepHeader step={step} total={totalSteps} title={stepTitle} />
        </View>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {step === 1 && Step1}
          {step === 2 && Step2}
          {step === 3 && Step3}
          {step === 4 && Step4}
          {step === 5 && <Recap />}

          {!!submitError && (
            <HelperText type="error" visible accessibilityLiveRegion="polite">
              {submitError}
            </HelperText>
          )}

          <View style={styles.footerBtns}>
            {step > 1 ? (
              <Button mode="outlined" onPress={goPrev} disabled={isSubmitting}>
                Précédent
              </Button>
            ) : <View />}

            {step < totalSteps ? (
              <PrimaryButton onPress={goNext}>
                Suivant
              </PrimaryButton>
            ) : (
              <PrimaryButton loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
                Valider et créer mon compte
              </PrimaryButton>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: Spacing.s12 },
  form: { gap: Spacing.s16, paddingBottom: Spacing.s24 },
  stepContent: { gap: Spacing.s16 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  footerBtns: { marginTop: Spacing.s8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
