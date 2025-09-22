import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useController, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import PhoneField from '../components/PhoneField';
import { Spacing } from '../theme/theme';
import { useAuth } from '../store/auth';
import { toAppError } from '../services/api/errors';
import { normalizePhone } from '../utils/phone';
import { AuthStackParamList } from '../navigation/AuthStack';
import { useTranslation } from 'react-i18next';
import { consumePendingProtectedRoute } from '../store/auth';
import { translateMaybeKey } from '../i18n/utils';

const LOGIN_TAB = 'login';
const SIGNUP_TAB = 'signup';

type LoginFormData = {
  emailOrPhone: string;
  password: string;
};

type SignupFormData = {
  name: string;
  email: string;
  dialCode: string;
  phone: string;
  password: string;
};

type AuthStackNavigation = NativeStackNavigationProp<AuthStackParamList>;
export default function AuthHubScreen() {
  const { signIn, signUpPatient } = useAuth();
  const navigationAuth = useNavigation<AuthStackNavigation>();
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<typeof LOGIN_TAB | typeof SIGNUP_TAB>(LOGIN_TAB);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);

  const loginSchema = useMemo(
    () =>
      z.object({
        emailOrPhone: z
          .string()
          .min(3, t('auth:validation.identifier')),
        password: z.string().min(6, t('auth:validation.passwordMin')),
      }),
    [i18n.language, t],
  );

  const signupSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, t('auth:validation.name')),
        email: z.string().email(t('auth:validation.email')),
        dialCode: z
          .string()
          .regex(/^\+\d{1,4}$/u, t('auth:validation.dialCode')),
        phone: z.string().min(6, t('auth:validation.phone')),
        password: z.string().min(6, t('auth:validation.passwordMin')),
      }),
    [i18n.language, t],
  );

  const {
    control: loginControl,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors, isSubmitting: loginSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { emailOrPhone: '', password: '' },
  });

  const {
    control: signupControl,
    handleSubmit: handleSubmitSignup,
    formState: { errors: signupErrors, isSubmitting: signupSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', dialCode: '+228', phone: '', password: '' },
  });

  const { field: dialCodeField, fieldState: dialCodeState } = useController({
    control: signupControl,
    name: 'dialCode',
  });

  const switchTab = useCallback(
    (tab: typeof LOGIN_TAB | typeof SIGNUP_TAB) => {
      setActiveTab(tab);
      setLoginError(null);
      setSignupError(null);
      if (tab === SIGNUP_TAB) {
        if (!dialCodeField.value) {
          dialCodeField.onChange('+228');
        }
      }
    },
    [dialCodeField],
  );

  const onSubmitLogin = useCallback(
    async (data: LoginFormData) => {
      setLoginError(null);
      try {
        await signIn(data.emailOrPhone.trim(), data.password);
        const parent = navigationAuth.getParent?.();
        const target = consumePendingProtectedRoute('Home');
        parent?.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: target } }],
        });
      } catch (err) {
        const appError = toAppError(err, t('auth:login.genericError'));
        const translated = translateMaybeKey(appError.message, t, i18n);
        setLoginError(translated || appError.message);
      }
    },
    [i18n, navigationAuth, signIn, t],
  );

  const onSubmitSignup = useCallback(
    async (data: SignupFormData) => {
      setSignupError(null);
      try {
        await signUpPatient({
          name: data.name.trim(),
          email: data.email.trim(),
          phone: normalizePhone(data.phone, data.dialCode),
          dialCode: data.dialCode,
          password: data.password,
        });
        const parent = navigationAuth.getParent?.();
        const target = consumePendingProtectedRoute('Home');
        parent?.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: target } }],
        });
      } catch (err) {
        const appError = toAppError(err, t('auth:signup.genericError'));
        const translated = translateMaybeKey(appError.message, t, i18n);
        setSignupError(translated || appError.message);
      }
    },
    [i18n, navigationAuth, signUpPatient, t],
  );

  return (
    <AuthLayout
      title={activeTab === LOGIN_TAB ? t('auth:login.title') : t('auth:signup.title')}
      subtitle={activeTab === LOGIN_TAB ? t('auth:login.subtitle') : t('auth:signup.subtitle')}
      footer={
        activeTab === LOGIN_TAB ? (
          <Button onPress={() => switchTab(SIGNUP_TAB)} mode="text">
            {t('auth:hub.switchToSignup')}
          </Button>
        ) : (
          <Button onPress={() => switchTab(LOGIN_TAB)} mode="text">
            {t('auth:hub.switchToLogin')}
          </Button>
        )
      }
    >
      <View style={styles.segmentWrapper}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => switchTab(value as typeof LOGIN_TAB | typeof SIGNUP_TAB)}
          buttons={[
            {
              value: LOGIN_TAB,
              label: t('auth:hub.tabs.login'),
            },
            {
              value: SIGNUP_TAB,
              label: t('auth:hub.tabs.signup'),
            },
          ]}
        />
      </View>

      {activeTab === LOGIN_TAB ? (
        <View style={styles.formContainer}>
          <Controller
            control={loginControl}
            name="emailOrPhone"
            render={({ field: { onBlur, onChange, value } }) => (
              <InputField
                label={t('auth:login.identifierLabel')}
                value={value ?? ''}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!loginErrors.emailOrPhone}
                errorText={loginErrors.emailOrPhone?.message}
                mode="outlined"
              />
            )}
          />

          <Controller
            control={loginControl}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <InputField
                label={t('auth:login.passwordLabel')}
                secureTextEntry
                value={value ?? ''}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!loginErrors.password}
                errorText={loginErrors.password?.message}
                mode="outlined"
              />
            )}
          />

          {!!loginError && (
            <HelperText type="error" visible accessibilityLiveRegion="polite">
              {loginError}
            </HelperText>
          )}

          <PrimaryButton
            loading={loginSubmitting}
            onPress={handleSubmitLogin(onSubmitLogin)}
            disabled={loginSubmitting}
          >
            {t('auth:login.submit')}
          </PrimaryButton>

          <View style={styles.secondaryActions}>
            <Button
              mode="text"
              onPress={() => navigationAuth.navigate('Forgot')}
            >
              {t('auth:hub.links.forgot')}
            </Button>
            <Button
              mode="text"
              onPress={() => navigationAuth.navigate('SignupDoctor')}
            >
              {t('auth:hub.links.signupDoctor')}
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Controller
            control={signupControl}
            name="name"
            render={({ field: { onBlur, onChange, value } }) => (
              <InputField
                label={t('auth:signup.nameLabel')}
                value={value ?? ''}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!signupErrors.name}
                errorText={signupErrors.name?.message}
                mode="outlined"
              />
            )}
          />

          <Controller
            control={signupControl}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <InputField
                label={t('auth:signup.emailLabel')}
                value={value ?? ''}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!signupErrors.email}
                errorText={signupErrors.email?.message}
                mode="outlined"
              />
            )}
          />

          <Controller
            control={signupControl}
            name="phone"
            render={({ field: { onBlur, onChange, value } }) => (
              <PhoneField
                label={t('auth:signup.phoneLabel')}
                value={value ?? ''}
                onBlur={onBlur}
                onChangeText={onChange}
                dialCode={dialCodeField.value}
                onDialCodeChange={dialCodeField.onChange}
                dialCodeError={dialCodeState.error?.message}
                error={!!signupErrors.phone}
                errorText={signupErrors.phone?.message}
              />
            )}
          />

          <Controller
            control={signupControl}
            name="password"
            render={({ field: { onBlur, onChange, value } }) => (
              <InputField
                label={t('auth:signup.passwordLabel')}
                secureTextEntry
                value={value ?? ''}
                onBlur={onBlur}
                onChangeText={onChange}
                error={!!signupErrors.password}
                errorText={signupErrors.password?.message}
                mode="outlined"
              />
            )}
          />

          {!!signupError && (
            <HelperText type="error" visible accessibilityLiveRegion="polite">
              {signupError}
            </HelperText>
          )}

          <PrimaryButton
            loading={signupSubmitting}
            onPress={handleSubmitSignup(onSubmitSignup)}
            disabled={signupSubmitting}
          >
            {t('auth:signup.submit')}
          </PrimaryButton>

          <View style={styles.secondaryActionsCenter}>
            <Button mode="text" onPress={() => switchTab(LOGIN_TAB)}>
              {t('auth:hub.links.accountExists')}
            </Button>
          </View>
        </View>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  segmentWrapper: {
    marginBottom: Spacing.s24,
  },
  formContainer: {
    gap: Spacing.s16,
  },
  secondaryActions: {
    marginTop: Spacing.s12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryActionsCenter: {
    marginTop: Spacing.s12,
    alignItems: 'center',
  },
});
