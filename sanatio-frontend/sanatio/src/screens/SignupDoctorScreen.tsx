import React, { useState } from 'react';
import Screen from '../components/Screen';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Text, Button, HelperText } from 'react-native-paper';
import { Controller, useController, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../store/auth';
import { api } from '../services/api/http';
import PhoneField from '../components/PhoneField';
import { DEFAULT_DIAL_CODE } from '../constants/countries';
import { normalizePhone } from '../utils/phone';

type FormData = {
  name: string;
  email: string;
  dialCode: string;
  phone: string;
  password: string;
  baseRate: number;
};

const schema: z.ZodType<FormData> = z.object({
  name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  dialCode: z
    .string()
    .regex(/^\+\d{1,4}$/u, 'Indicatif invalide')
    .default(DEFAULT_DIAL_CODE),
  phone: z.string().min(6, 'Téléphone requis'),
  password: z.string().min(6, 'Min 6 caractères'),
  baseRate: z.coerce.number().min(0, 'Tarif requis'),
});

export default function SignupDoctorScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      baseRate: undefined as unknown as number,
      dialCode: DEFAULT_DIAL_CODE,
    },
  });
  const { field: dialCodeField, fieldState: dialCodeState } = useController({ control, name: 'dialCode' });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: normalizePhone(data.phone, dialCodeField.value),
        password: data.password,
      };
      const u = await api.auth.post('/users', payload);
      const userData = u.data || {};
      const userId = userData._id || userData.id || userData.userId || userData.user?._id || userData.user?.id;
      if (!userId) {
        throw new Error('Création de l’utilisateur pratiquant impossible (ID manquant).');
      }
      await signIn(payload.email, payload.password);
      await api.doctor.post('/doctors', {
        userId,
        baseRate: data.baseRate,
      });
      navigation.goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de créer le compte praticien.';
      setSubmitError(message);
    }
  };

  return (
    <Screen>
      <Text variant="headlineMedium" style={{ marginBottom: 8 }}>
        Inscription praticien
      </Text>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Nom complet" value={(value as string) ?? ''} onBlur={onBlur} onChangeText={onChange} error={!!errors.name} errorText={errors.name?.message as string} />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Email"
            keyboardType="email-address"
            value={(value as string) ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.email}
            errorText={errors.email?.message as string}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <PhoneField
            value={(value as string) ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            dialCode={dialCodeField.value}
            onDialCodeChange={dialCodeField.onChange}
            dialCodeError={dialCodeState.error?.message}
            error={!!errors.phone}
            errorText={errors.phone?.message as string}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Mot de passe"
            secureTextEntry
            value={(value as string) ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.password}
            errorText={errors.password?.message as string}
          />
        )}
      />
      <Controller
        control={control}
        name="baseRate"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Tarif de base"
            keyboardType="numeric"
            value={String(value ?? '')}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.baseRate}
            errorText={errors.baseRate?.message as string}
            style={{ marginBottom: 16 }}
          />
        )}
      />
      {!!submitError && (
        <HelperText type="error" visible accessibilityLiveRegion="polite">
          {submitError}
        </HelperText>
      )}
      <PrimaryButton loading={isSubmitting} onPress={handleSubmit(onSubmit as any)}>
        Créer mon profil praticien
      </PrimaryButton>
      <Button onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
        Retour
      </Button>
    </Screen>
  );
}
