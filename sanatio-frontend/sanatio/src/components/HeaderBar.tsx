import React from 'react';
import { Appbar, useTheme } from 'react-native-paper';
import { StyleProp, ViewStyle } from 'react-native';
import { Colors, Shadows } from '../theme/theme';

type RightAction = {
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

type Props = {
  title: string;
  onBack?: () => void;
  rightActions?: RightAction[]; // <- nouveau
  style?: StyleProp<ViewStyle>;
};

export default function HeaderBar({ title, onBack, rightActions = [], style }: Props) {
  const theme = useTheme();

  return (
    <Appbar.Header
      mode="center-aligned"
      elevated
      style={[{ backgroundColor: theme.colors.surface }, Shadows.sm, style]}
    >
      {onBack ? <Appbar.BackAction onPress={onBack} accessibilityLabel="Retour" /> : null}
      <Appbar.Content title={title} titleStyle={{ color: Colors.text }} />
      {rightActions.map((action, index) => (
        <Appbar.Action
          key={index}
          icon={action.icon}
          onPress={action.onPress}
          disabled={action.disabled}
          accessibilityLabel={action.accessibilityLabel}
        />
      ))}
    </Appbar.Header>
  );
}
