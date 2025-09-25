import React from 'react';
import {
  NavigationContainer,
  DefaultTheme as NavLight,
  DarkTheme as NavDark,
  LinkingOptions,
  NavigatorScreenParams,
} from '@react-navigation/native';
import AuthStack, { AuthStackParamList } from './AuthStack';
import MainTabs from './MainTabs';
import RequireAuthScreen from '../screens/RequireAuthScreen';
import PatientProfileScreen from '../screens/PatientProfileScreen';
import { CallScreen } from '../screens/CallScreen';
import { useAuth } from '../store/auth';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { enableScreens } from 'react-native-screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeMode } from '../theme/ThemeProvider';

enableScreens();

export type RootParamList = {
  MainTabs: undefined;
  AuthStack: NavigatorScreenParams<AuthStackParamList> | undefined;
  RequireAuth: undefined;
  PatientProfile: { patientId?: string } | undefined;
  Call: { url: string; token: string };
};

const Stack = createNativeStackNavigator<RootParamList>();

const prefix = Linking.createURL('/');

const linking: LinkingOptions<RootParamList> = {
  prefixes: [prefix],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Chat: 'chat',
          // ⬇️ on décrit le stack imbriqué
          Consultations: {
            screens: {
              ConsultationsHome: 'consultations',
              ScheduleConsultation: 'consultations/schedule',
            },
          },
          Billing: 'billing',
          Settings: 'settings',
          Profile: 'profile',
        },
      },
      AuthStack: {
        screens: {
          Login: 'login',
          Signup: 'signup',
          SignupDoctor: 'signup-doctor',
          Forgot: 'forgot',
        },
      },
      PatientProfile: 'patient-profile',
    },
  },
};

export default function RootNavigator() {
  const { loading } = useAuth();
  const { isDark } = useThemeMode();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} theme={isDark ? NavDark : NavLight}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="RequireAuth"
          component={RequireAuthScreen}
          options={{ presentation: 'transparentModal', animation: 'fade_from_bottom', contentStyle: { backgroundColor: 'rgba(15,23,42,0.35)' } }}
        />
        <Stack.Screen
          name="AuthStack"
          component={AuthStack}
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="PatientProfile" component={PatientProfileScreen} />
        <Stack.Screen
          name="Call"
          component={CallScreen}
          options={{ presentation: 'fullScreenModal', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
