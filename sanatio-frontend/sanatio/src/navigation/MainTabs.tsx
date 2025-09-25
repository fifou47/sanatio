// MainTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
// ⬇️ remplace l'ancien import écran par le stack
import BillingScreen from '../screens/BillingScreen';
import SettingsStack, { SettingsStackParamList } from './SettingsStack';
import Ionicons from '@expo/vector-icons/Ionicons';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth, setPendingProtectedRoute } from '../store/auth';
import { useNavigation, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from './RootNavigator';
import { useTheme } from 'react-native-paper';
import { Colors, Shadows } from '../theme/theme';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import ConsultationStack, { ConsultationStackParamList } from './ConsultationsStack';

export type MainTabsParamList = {
  Home: undefined;
  Chat: undefined;
  // ⬇️ l’onglet pointe maintenant sur le stack
  Consultations: NavigatorScreenParams<ConsultationStackParamList>;
  Billing: undefined;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export default function MainTabs() {
  const { user, accessToken } = useAuth();
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const theme = useTheme();
  const { t } = useTranslation();
  const isDoctor = (user?.roles || []).includes('doctor');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          height: 65,
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          ...Shadows.md,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIconStyle: { marginBottom: -2 },
        tabBarLabel: ({ color }) => {
          const label =
            route.name === 'Consultations'
              ? isDoctor
                ? t('consultations:titleDoctor')
                : t('navigation:tabs.Consultations')
              : t(`navigation:tabs.${route.name}` as const);
          return <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>;
        },
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline',
            Chat: 'chatbubble-ellipses-outline',
            Consultations: 'medkit-outline',
            Billing: 'card-outline',
            Settings: 'settings-outline',
            Profile: 'person-circle-outline',
          };
          const name = map[route.name] || 'ellipse-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        listeners={{
          tabPress: (e) => {
            if (!accessToken) {
              e.preventDefault();
              setPendingProtectedRoute('Chat');
              rootNavigation.navigate('RequireAuth');
            }
          },
        }}
      />
      {/* ⬇️ ICI on met le STACK au lieu du screen */}
      <Tab.Screen
        name="Consultations"
        component={ConsultationStack}
        listeners={{
          tabPress: (e) => {
            if (!accessToken) {
              e.preventDefault();
              setPendingProtectedRoute('Consultations');
              rootNavigation.navigate('RequireAuth');
            }
          },
        }}
      />
      <Tab.Screen
        name="Billing"
        component={BillingScreen}
        listeners={{
          tabPress: (e) => {
            if (!accessToken) {
              e.preventDefault();
              setPendingProtectedRoute('Billing');
              rootNavigation.navigate('RequireAuth');
            }
          },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}
