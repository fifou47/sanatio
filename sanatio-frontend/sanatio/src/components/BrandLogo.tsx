import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Colors } from '../theme/theme';

type Props = {
  size?: number;
  centered?: boolean;
  tagline?: string;
};

export default function BrandLogo({ size = 48, centered = true, tagline }: Props) {
  const theme = useTheme();
  const textStyle = {
    fontFamily: theme.fonts.displaySmall.fontFamily,
    fontSize: size,
    lineHeight: size * 1.05,
    fontWeight: '700' as const,
  };

  return (
    <View style={[styles.wrapper, centered && styles.centered]}>
      <View style={styles.row}>
        <Text style={[textStyle, { color: theme.colors.primary }]}>sa</Text>
        <Text style={[textStyle, { color: theme.colors.secondary }]}>natio</Text>
      </View>
      {tagline ? (
        <Text variant="bodyMedium" style={[styles.tagline, { color: Colors.textMuted }]}>
          {tagline}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  centered: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tagline: {
    textAlign: 'center',
  },
});
