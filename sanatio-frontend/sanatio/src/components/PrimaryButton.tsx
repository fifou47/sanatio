import React from 'react';
import { Button, ButtonProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';

type Props = ButtonProps & { loading?: boolean };

export default function PrimaryButton({
  mode = 'contained',
  children,
  loading = false,
  disabled,
  contentStyle,
  labelStyle,
  style,
  ...rest
}: Props) {
  const computedDisabled = typeof disabled === 'boolean' ? disabled : loading;
  return (
    <Button
      mode={mode}
      loading={loading}
      disabled={computedDisabled}
      accessibilityState={{ disabled: computedDisabled, busy: loading }}
      accessibilityRole="button"
      style={[styles.button, style]}
      contentStyle={[styles.content, contentStyle]}
      labelStyle={[styles.label, labelStyle]}
      {...rest}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
  },
  content: {
    height: 54,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
