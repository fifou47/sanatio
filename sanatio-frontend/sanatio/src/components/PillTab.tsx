import React from 'react';
import { View, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export type PillTabItem = { key: string; label: string };

type Props = { items: PillTabItem[]; value: string; onChange: (key: string) => void };

export default function PillTab({ items, value, onChange }: Props) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 24, padding: 4 }}>
      {items.map((it) => {
        const active = value === it.key;
        return (
          <Pressable
            key={it.key}
            onPress={() => onChange(it.key)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 20,
              backgroundColor: active ? theme.colors.primary : 'transparent',
              marginHorizontal: 2,
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={{ color: active ? theme.colors.onPrimary : theme.colors.onSurface }}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

