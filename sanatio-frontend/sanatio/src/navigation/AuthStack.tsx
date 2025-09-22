import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordRequestScreen from '../screens/ForgotPasswordRequestScreen';
import ForgotPasswordConfirmScreen from '../screens/ForgotPasswordConfirmScreen';
import SignupDoctorScreen from '../screens/SignupDoctorScreen';
import AuthHubScreen from '../screens/AuthHubScreen';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Forgot: undefined;
  ForgotConfirm: { emailOrPhone?: string } | undefined;
  SignupDoctor: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={AuthHubScreen} options={{ title: 'Connexion', headerShown: false }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'Créer un compte' }} />
      <Stack.Screen name="SignupDoctor" component={SignupDoctorScreen} options={{ title: 'Inscription praticien' }} />
      <Stack.Screen name="Forgot" component={ForgotPasswordRequestScreen} options={{ title: 'Mot de passe oublié', headerShown: false }} />
      <Stack.Screen name="ForgotConfirm" component={ForgotPasswordConfirmScreen} options={{ title: 'Code de réinitialisation', headerShown: false }} />
    </Stack.Navigator>
  );
}
