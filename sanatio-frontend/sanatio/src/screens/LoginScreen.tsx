import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, HelperText } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../store/auth';
import { Spacing } from '../theme/theme';
import { useTranslation } from 'react-i18next';
import { translateMaybeKey } from '../i18n/utils';
import { consumePendingProtectedRoute } from '../store/auth';

type FormData = {
  emailOrPhone: string;
  password: string;
};

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const { t, i18n } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        emailOrPhone: z.string().min(3, t('auth:validation.identifier')),
        password: z.string().min(6, t('auth:validation.passwordMin')),
      }),
    [i18n.language, t],
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { emailOrPhone: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await signIn(data.emailOrPhone.trim(), data.password);
      const target = consumePendingProtectedRoute('Home');
      const parent = navigation.getParent?.();
      parent?.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: target } }] });
    } catch (err) {
      const fallback = t('auth:login.genericError');
      const raw = err instanceof Error && err.message ? err.message : null;
      const translated = raw ? translateMaybeKey(raw, t, i18n) : fallback;
      setSubmitError(translated || fallback);
    }
  };

  return (
    <AuthLayout
      title={t('auth:login.title')}
      subtitle={t('auth:login.subtitle')}
      footer={
        <View style={styles.footerActions}>
          <Button onPress={() => navigation.navigate('Signup')} mode="text">
            {t('auth:login.patientCta')}
          </Button>
          <Button onPress={() => navigation.navigate('SignupDoctor')} mode="text">
            {t('auth:login.doctorCta')}
          </Button>
          <Button onPress={() => navigation.getParent?.()?.navigate('MainTabs')} mode="text">
            {t('auth:login.guest')}
          </Button>
        </View>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="emailOrPhone"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('auth:login.identifierLabel')}
              value={value ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.emailOrPhone}
              errorText={errors.emailOrPhone?.message}
              mode="outlined"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputField
              label={t('auth:login.passwordLabel')}
              secureTextEntry
              value={value ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.password}
              errorText={errors.password?.message}
              mode="outlined"
            />
          )}
        />

        {!!submitError && (
          <HelperText type="error" visible accessibilityLiveRegion="polite">
            {submitError}
          </HelperText>
        )}

        <PrimaryButton loading={isSubmitting} onPress={handleSubmit(onSubmit)}>
          {t('auth:login.submit')}
        </PrimaryButton>
        <Button mode="text" onPress={() => navigation.navigate('Forgot')}>
          {t('auth:login.forgot')}
        </Button>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.s16,
  },
  footerActions: {
    alignItems: 'center',
    gap: Spacing.s8,
  },
});
