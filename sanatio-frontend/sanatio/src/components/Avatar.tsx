import React from 'react';
import { Avatar as PaperAvatar } from 'react-native-paper';

type Props = { uri?: string; name?: string; size?: number };

export default function Avatar({ uri, name, size = 40 }: Props) {
  if (uri) return <PaperAvatar.Image size={size} source={{ uri }} />;
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  return <PaperAvatar.Text size={size} label={letter} />;
}

