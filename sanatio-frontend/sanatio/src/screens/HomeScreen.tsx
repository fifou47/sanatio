import React from 'react';
import Screen from '../components/Screen';
import HeaderBar from '../components/HeaderBar';
import { Text } from 'react-native-paper';

export default function HomeScreen() {
  return (
    <>
      <HeaderBar title="Accueil" />
      <Screen>
        <Text variant="headlineMedium">Home</Text>
      </Screen>
    </>
  );
}

