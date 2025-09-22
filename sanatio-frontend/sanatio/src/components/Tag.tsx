import React from 'react';
import { Chip } from 'react-native-paper';

type Props = {
  label: string;
  color?: 'info' | 'success' | 'warning' | 'error';
  onPress?: () => void;
};

export default function Tag({ label, color = 'info', onPress }: Props) {
  const styleMap = {
    info: { backgroundColor: '#E8F0FE', textColor: '#1E40AF' },
    success: { backgroundColor: '#E6FAF3', textColor: '#065F46' },
    warning: { backgroundColor: '#FEF3C7', textColor: '#92400E' },
    error: { backgroundColor: '#FEE2E2', textColor: '#991B1B' },
  } as const;
  const style = styleMap[color];
  return (
    <Chip onPress={onPress} style={{ backgroundColor: style.backgroundColor }} textStyle={{ color: style.textColor }}>
      {label}
    </Chip>
  );
}

