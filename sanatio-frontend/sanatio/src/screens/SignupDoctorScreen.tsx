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
import { api } from '../services/api/http';
import { Spacing } from '../theme/theme';
import { useTranslation } from 'react-i18next';
import { translateMaybeKey } from '../i18n/utils';

type FormData = {
  name: string;
  email: string;
  dialCode: string;
  phone: string;
  password: string;
  baseRate: number;
};

export default function SignupDoctorScreen({ navigation }: any) {
  const { signIn } = useAuth();
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
        baseRate: z.coerce.number().min(0, t('auth:validation.baseRate')),
      }),
    [i18n.language, t],
  );

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
        throw new Error(t('auth:doctorSignup.errorMissingId'));
      }
      await signIn(payload.email, payload.password);
      await api.doctor.post('/doctors', {
        userId,
        baseRate: data.baseRate,
      });
      const target = consumePendingProtectedRoute('Home');
      const parent = navigation.getParent?.();
      parent?.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: target } }] });
    } catch (err) {
      const fallback = t('auth:doctorSignup.genericError');
      const raw = err instanceof Error && err.message ? err.message : null;
      const translated = raw ? translateMaybeKey(raw, t, i18n) : fallback;
      setSubmitError(translated || fallback);
    }
  };

  return (
    <AuthLayout
      title={t('auth:doctorSignup.title')}
      subtitle={t('auth:doctorSignup.subtitle')}
      footer={
        <Button onPress={() => navigation.goBack()} mode="text">
          {t('auth:doctorSignup.back')}
        </Button>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('auth:doctorSignup.nameLabel')}
              value={(value as string) ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.name}
              errorText={errors.name?.message as string}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('auth:doctorSignup.emailLabel')}
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
              label={t('auth:doctorSignup.phoneLabel')}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('auth:doctorSignup.passwordLabel')}
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
              label={t('auth:doctorSignup.baseRateLabel')}
              keyboardType="numeric"
              value={String(value ?? '')}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.baseRate}
              errorText={errors.baseRate?.message as string}
            />
          )}
        />

        {!!submitError && (
          <HelperText type="error" visible accessibilityLiveRegion="polite">
            {submitError}
          </HelperText>
        )}

        <PrimaryButton loading={isSubmitting} onPress={handleSubmit(onSubmit as any)}>
          {t('auth:doctorSignup.submit')}
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
