import React from 'react';
import { View, ScrollView, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

type Props = {
  children: React.ReactNode;
  padded?: boolean;
  scroll?: boolean;
  style?: ViewStyle;
};

export default function Screen({ children, padded = true, scroll = true, style }: Props) {
  const theme = useTheme();
  const padding = padded ? 16 : 0;
  const common = { flex: 1, backgroundColor: theme.colors.background, padding } as ViewStyle;
  if (scroll) return <ScrollView contentContainerStyle={[{ flexGrow: 1 }, common, style]}>{children}</ScrollView>;
  return <View style={[common, style]}>{children}</View>;
}

