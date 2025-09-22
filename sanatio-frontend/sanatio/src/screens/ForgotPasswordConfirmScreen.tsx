import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import AuthLayout from '../components/AuthLayout';
import PrimaryButton from '../components/PrimaryButton';
import InputField from '../components/InputField';
import { Spacing, Radius, Colors, Shadows } from '../theme/theme';
import { api } from '../services/api/http';
import { toAppError } from '../services/api/errors';
import { useTranslation } from 'react-i18next';
import { AuthStackParamList } from '../navigation/AuthStack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'ForgotConfirm'>;
type Route = RouteProp<AuthStackParamList, 'ForgotConfirm'>;

type FormData = {
  newPassword: string;
  confirmPassword: string;
};

const OTP_LENGTH = 6;

export default function ForgotPasswordConfirmScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { emailOrPhone } = route.params ?? {};
  const { t, i18n } = useTranslation();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState<number>(30);
  const [success, setSuccess] = useState(false);

  const otpRefs = useRef<Array<TextInput | null>>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const otpValue = otpDigits.join('');

  const schema = useMemo(
    () =>
      z
        .object({
          newPassword: z.string().min(6, t('auth:validation.passwordMin')),
          confirmPassword: z.string().min(6, t('auth:validation.passwordMin')),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t('auth:forgotConfirm.passwordMismatch'),
          path: ['confirmPassword'],
        }),
    [i18n.language, t],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const focusInput = (index: number) => {
    otpRefs.current[index]?.focus();
    setFocusedIndex(index);
  };

  const handleOtpChange = (value: string, index: number) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    setOtpDigits((prev) => {
      const clone = [...prev];
      clone[index] = sanitized;
      return clone;
    });
    if (sanitized && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleOtpKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handleResend = async () => {
    if (!emailOrPhone || timer > 0) return;
    setIsResending(true);
    setSubmitError(null);
    try {
      await api.auth.post('/auth/password-reset/request', { emailOrPhone });
      setTimer(30);
    } catch (error) {
      const appError = toAppError(error, t('auth:forgotConfirm.resendError'));
      const message = appError.code === 'ERR_NETWORK' ? t('common:offline') : appError.message;
      setSubmitError(message);
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await api.auth.post('/auth/password-reset/confirm', {
        token: otpValue,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();
      setOtpDigits(Array(OTP_LENGTH).fill(''));
    } catch (error) {
      const appError = toAppError(error, t('auth:forgotConfirm.errorConfirm'));
      const message = appError.code === 'ERR_NETWORK' ? t('common:offline') : appError.message;
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOtpInputs = () => (
    <View style={styles.otpContainer} accessibilityRole="text" accessibilityLabel={t('auth:forgotConfirm.otpAccessibility')}>
      {otpDigits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            otpRefs.current[index] = ref;
          }}
          style={[styles.otpInput, focusedIndex === index && styles.otpFocused]}
          keyboardType="number-pad"
          returnKeyType="next"
          maxLength={1}
          value={digit}
          onChangeText={(value) => handleOtpChange(value, index)}
          onFocus={() => setFocusedIndex(index)}
          onKeyPress={(event) => handleOtpKeyPress(event, index)}
          accessibilityLabel={t('auth:forgotConfirm.otpDigitLabel', { index: index + 1 })}
        />
      ))}
    </View>
  );

  const canSubmit = otpValue.length === OTP_LENGTH;

  return (
    <AuthLayout
      title={t('auth:forgotConfirm.title')}
      subtitle={t('auth:forgotConfirm.subtitle')}
      footer={
        <PrimaryButton mode="outlined" onPress={() => navigation.goBack()}>
          {t('common:cancel')}
        </PrimaryButton>
      }
    >
      <View style={styles.form}>
        <Text style={styles.sectionTitle}>{t('auth:forgotConfirm.codeLabel')}</Text>
        {renderOtpInputs()}

        <PrimaryButton
          mode="text"
          onPress={handleResend}
          disabled={timer > 0 || isResending || !emailOrPhone}
          loading={isResending}
          accessibilityHint={t('auth:forgotConfirm.resendHint')}
        >
          {timer > 0
            ? t('auth:forgotConfirm.resendCountdown', { seconds: timer })
            : t('auth:forgotConfirm.resend')}
        </PrimaryButton>

        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onBlur, onChange, value } }) => (
            <InputField
              label={t('auth:forgotConfirm.newPassword')}
              secureTextEntry
              value={value ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.newPassword}
              errorText={errors.newPassword?.message}
              mode="outlined"
              accessibilityLabel={t('auth:forgotConfirm.newPassword')}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onBlur, onChange, value } }) => (
            <InputField
              label={t('auth:forgotConfirm.confirmPassword')}
              secureTextEntry
              value={value ?? ''}
              onBlur={onBlur}
              onChangeText={onChange}
              error={!!errors.confirmPassword}
              errorText={errors.confirmPassword?.message}
              mode="outlined"
              accessibilityLabel={t('auth:forgotConfirm.confirmPassword')}
            />
          )}
        />

        <PrimaryButton
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting || !canSubmit}
          accessibilityHint={t('auth:forgotConfirm.submitHint')}
        >
          {t('auth:forgotConfirm.submit')}
        </PrimaryButton>

        {submitError ? (
          <Surface style={styles.errorSurface} accessibilityRole="alert">
            <Text style={styles.errorText}>{submitError}</Text>
          </Surface>
        ) : null}

        {success ? (
          <Surface style={styles.successSurface} accessibilityRole="alert">
            <Text style={styles.successTitle}>{t('auth:forgotConfirm.successTitle')}</Text>
            <Text style={styles.successText}>{t('auth:forgotConfirm.successDescription')}</Text>
            <PrimaryButton mode="outlined" onPress={() => navigation.navigate('Login')}>
              {t('auth:forgotConfirm.goToLogin')}
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
  sectionTitle: {
    fontWeight: '600',
    color: Colors.text,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.s12,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.outline,
    textAlign: 'center',
    fontSize: 20,
    color: Colors.text,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  otpFocused: {
    borderColor: Colors.primary,
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
