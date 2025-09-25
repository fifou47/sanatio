import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConsultationsScreen from '../screens/ConsultationsScreen';
import ScheduleConsultationScreen from '../screens/ScheduleConsultationScreen';

export type ConsultationStackParamList = {
  ConsultationsHome: undefined;
  ScheduleConsultation: { mode?: 'normal' | 'urgent' } | undefined;
};

const Stack = createNativeStackNavigator<ConsultationStackParamList>();

export default function ConsultationStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConsultationsHome" component={ConsultationsScreen} />
      <Stack.Screen name="ScheduleConsultation" component={ScheduleConsultationScreen} />
    </Stack.Navigator>
  );
}
