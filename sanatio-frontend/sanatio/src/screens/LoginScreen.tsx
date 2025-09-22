import React, { useState } from 'react';
import Screen from '../components/Screen';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import { Text, Button, HelperText } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../store/auth';

const schema = z.object({
  emailOrPhone: z.string().min(3, 'Required'),
  password: z.string().min(6, 'Min 6 chars'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de se connecter.';
      setSubmitError(message);
    }
  };

  return (
    <Screen>
      <Text variant="headlineMedium" style={{ marginBottom: 8 }}>
        Se connecter
      </Text>

      <Controller
        control={control}
        name="emailOrPhone"
        render={({ field: { onChange, onBlur, value } }) => (
          <InputField
            label="Email ou téléphone"
            value={value ?? ''}
            onBlur={onBlur}
            onChangeText={onChange}
            error={!!errors.emailOrPhone}
            errorText={errors.emailOrPhone?.message}
            style={{ marginBottom: 8 }}
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
        Connexion
      </PrimaryButton>

      <Button onPress={() => navigation.navigate('Signup')} style={{ marginTop: 16 }}>
        Créer un compte
      </Button>
      <Button onPress={() => navigation.navigate('SignupDoctor')}>
        Je suis praticien
      </Button>
      <Button onPress={() => navigation.navigate('Forgot')}>
        Mot de passe oublié
      </Button>
    </Screen>
  );
}
