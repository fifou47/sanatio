import React from 'react';
import { StyleSheet } from 'react-native';
import { HelperText, TextInput, TextInputProps } from 'react-native-paper';
import { Colors, Radius, Spacing } from '../theme/theme';

type Props = TextInputProps & { errorText?: string };

export default function InputField({ error, errorText, mode = 'outlined', style, ...rest }: Props) {
  return (
    <>
      <TextInput
        mode={mode}
        error={!!error}
        style={[styles.input, style]}
        contentStyle={styles.content}
        outlineStyle={styles.outline}
        dense
        {...rest}
      />
      {!!errorText && (
        <HelperText type="error" visible={!!errorText} accessibilityLiveRegion="polite">
          {errorText}
        </HelperText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
  },
  outline: {
    borderRadius: Radius.lg,
  },
  content: {
    paddingVertical: Spacing.s12,
  },
});
