
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import LegalScreen from '../screens/LegalScreen';
import ActiveSessionsScreen from '../screens/ActiveSessionsScreen';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Preferences: undefined;
  Legal: undefined;
  ActiveSessions: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
    </Stack.Navigator>
  );
}
