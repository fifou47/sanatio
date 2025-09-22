import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText } from 'react-native-paper';
import { Controller, useController, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import PhoneField from '../components/PhoneField';
import { DEFAULT_DIAL_CODE } from '../constants/countries';
import { normalizePhone } from '../utils/phone';
import { useAuth, consumePendingProtectedRoute } from '../store/auth';
import { Spacing } from '../theme/theme';
import { useTranslation } from 'react-i18next';
import { translateMaybeKey } from '../i18n/utils';

type FormData = {
  name: string;
  email: string;
  dialCode: string;
  phone: string;
  password: string;
};

export default function SignupScreen({ navigation }: any) {
  const { signUpPatient } = useAuth();
  const { t, i18n } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t('auth:validation.name')),
        email: z.string().email(t('auth:validation.email')),
        dialCode: z
          .string()
          .regex(/^\+\d{1,4}$/u, t('auth:validation.dialCode'))
          .default(DEFAULT_DIAL_CODE),
        phone: z.string().min(6, t('auth:validation.phone')),
        password: z.string().min(6, t('auth:validation.passwordMin')),
      }),
    [i18n.language, t],
  );
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
        password: data.password,
      });
      const parent = navigation.getParent?.();
      const target = consumePendingProtectedRoute('Home');
      parent?.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: target } }] });
    } catch (err) {
      const fallback = t('auth:signup.genericError');
      const raw = err instanceof Error && err.message ? err.message : null;
      const translated = raw ? translateMaybeKey(raw, t, i18n) : fallback;
      setSubmitError(translated || fallback);
    }
  };

  return (
    <AuthLayout
      title={t('auth:signup.title')}
      subtitle={t('auth:signup.subtitle')}
      footer={
        <Button onPress={() => navigation.goBack()} mode="text">
          {t('auth:signup.existing')}
        </Button>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('auth:signup.nameLabel')}
              value={value ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.name}
              errorText={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('auth:signup.emailLabel')}
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
              label={t('auth:signup.phoneLabel')}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('auth:signup.passwordLabel')}
              secureTextEntry
              value={value ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.password}
              errorText={errors.password?.message}
            />
          )}
        />

        {!!submitError && (
          <HelperText type="error" visible accessibilityLiveRegion="polite">
            {submitError}
          </HelperText>
        )}

        <PrimaryButton loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
          {t('auth:signup.submit')}
        </PrimaryButton>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.s16,
  },
});
