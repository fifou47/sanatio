import React from 'react';
import Screen from '../components/Screen';
import { Text } from 'react-native-paper';

export default function ForgotPasswordScreen() {
  return (
    <Screen>
      <Text variant="headlineMedium" style={{ marginBottom: 8 }}>
        Mot de passe oublié
      </Text>
      <Text>Fonctionnalité à venir. Merci de contacter le support.</Text>
    </Screen>
  );
}

