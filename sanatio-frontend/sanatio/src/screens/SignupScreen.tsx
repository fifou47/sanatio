import React, { useState } from 'react';
import Screen from '../components/Screen';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Text, Button, HelperText } from 'react-native-paper';
import { Controller, useController, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../store/auth';
import PhoneField from '../components/PhoneField';
import { DEFAULT_DIAL_CODE } from '../constants/countries';
import { normalizePhone } from '../utils/phone';

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  dialCode: z
    .string()
    .regex(/^\+\d{1,4}$/u, 'Indicatif invalide')
    .default(DEFAULT_DIAL_CODE),
  phone: z.string().min(6, 'Téléphone requis'),
  password: z.string().min(6, 'Min 6 caractères'),
});

type FormData = z.infer<typeof schema>;

export default function SignupScreen({ navigation }: any) {
  const { signUpPatient } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', password: '', dialCode: DEFAULT_DIAL_CODE },
  });
  const { field: dialCodeField, fieldState: dialCodeState } = useController({ control, name: 'dialCode' });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await signUpPatient({
        ...data,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: normalizePhone(data.phone, dialCodeField.value),
        dialCode: dialCodeField.value,
      });
      navigation.goBack();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de créer le compte.';
      setSubmitError(message);
    }
  };

  return (
    <Screen>
      <Text variant="headlineMedium" style={{ marginBottom: 8 }}>
        Créer un compte patient
      </Text>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField label="Nom complet" value={value ?? ''} onBlur={onBlur} onChangeText={onChange} error={!!errors.name} errorText={errors.name?.message} />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Email"
            keyboardType="email-address"
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.email}
            errorText={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <PhoneField
            value={value ?? ''}
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
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.password}
            errorText={errors.password?.message}
            style={{ marginBottom: 16 }}
          />
        )}
      />
      {!!submitError && (
        <HelperText type="error" visible accessibilityLiveRegion="polite">
          {submitError}
        </HelperText>
      )}
      <PrimaryButton loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
        Créer mon compte
      </PrimaryButton>
      <Button onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
        J'ai déjà un compte
      </Button>
    </Screen>
  );
}
