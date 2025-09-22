import React from 'react';
import { Appbar, useTheme } from 'react-native-paper';
import { StyleProp, ViewStyle } from 'react-native';
import { Colors, Shadows } from '../theme/theme';

type Props = {
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function HeaderBar({ title, onBack, actions, style }: Props) {
  const theme = useTheme();
  return (
    <Appbar.Header
      mode="center-aligned"
      elevated
      style={[{ backgroundColor: theme.colors.surface }, Shadows.sm, style]}
    >
      {onBack ? <Appbar.BackAction onPress={onBack} accessibilityLabel="Retour" /> : null}
      <Appbar.Content title={title} titleStyle={{ color: Colors.text }} />
      {actions}
    </Appbar.Header>
  );
}
