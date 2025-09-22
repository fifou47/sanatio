import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';

import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Spacing, Colors, Radius, Shadows } from '../theme/theme';
import { api } from '../services/api/http';
import { toAppError } from '../services/api/errors';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../navigation/AuthStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'Forgot'>;

type FormData = {
  emailOrPhone: string;
};

export default function ForgotPasswordRequestScreen() {
  const navigation = useNavigation<Navigation>();
  const { t, i18n } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successIdentifier, setSuccessIdentifier] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        emailOrPhone: z.string().min(3, t('auth:validation.identifier')),
      }),
    [i18n.language, t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { emailOrPhone: '' },
  });

  const emailOrPhoneValue = watch('emailOrPhone');

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await api.auth.post('/auth/password-reset/request', {
        emailOrPhone: data.emailOrPhone.trim(),
      });
      setSuccessIdentifier(data.emailOrPhone.trim());
    } catch (error) {
      const appError = toAppError(error, t('auth:forgotRequest.errorRequest'));
      const message = appError.code === 'ERR_NETWORK' ? t('common:offline') : appError.message;
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth:forgotRequest.title')}
      subtitle={t('auth:forgotRequest.subtitle')}
      footer={
        <PrimaryButton mode="outlined" onPress={() => navigation.goBack()}>
          {t('common:cancel')}
        </PrimaryButton>
      }
    >
      <View style={styles.form}>
        <Controller
          control={control}
          name="emailOrPhone"
          render={({ field: { onBlur, onChange, value } }) => (
            <InputField
              label={t('auth:forgotRequest.identifierLabel')}
              value={value ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.emailOrPhone}
              errorText={errors.emailOrPhone?.message}
              mode="outlined"
              accessibilityLabel={t('auth:forgotRequest.identifierAccessibility')}
            />
          )}
        />

        <PrimaryButton
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || !emailOrPhoneValue}
          accessibilityHint={t('auth:forgotRequest.submitHint')}
        >
          {t('auth:forgotRequest.submit')}
        </PrimaryButton>

        {submitError ? (
          <Surface style={styles.errorSurface} accessibilityRole="alert">
            <Text style={styles.errorText}>{submitError}</Text>
          </Surface>
        ) : null}

        {successIdentifier ? (
          <Surface style={styles.successSurface} accessibilityRole="alert">
            <Text style={styles.successTitle}>{t('auth:forgotRequest.successTitle')}</Text>
            <Text style={styles.successText}>
              {t('auth:forgotRequest.successDescription', { destination: successIdentifier })}
            </Text>
            <PrimaryButton
              mode="outlined"
              onPress={() =>
                navigation.navigate('ForgotConfirm', {
                  emailOrPhone: successIdentifier,
                })
              }
            >
              {t('auth:forgotRequest.goToConfirm')}
            </PrimaryButton>
          </Surface>
        ) : null}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.s20,
  },
  successSurface: {
    padding: Spacing.s16,
    borderRadius: Radius.xl,
    backgroundColor: Colors.successSoft,
    gap: Spacing.s8,
    ...Shadows.sm,
  },
  successTitle: {
    fontWeight: '600',
    color: Colors.success,
  },
  successText: {
    color: Colors.text,
  },
  errorSurface: {
    padding: Spacing.s12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.errorSoft,
    ...Shadows.xs,
  },
  errorText: {
    color: Colors.error,
  },
});
