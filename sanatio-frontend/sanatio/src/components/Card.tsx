import React from 'react';
import { Card as PaperCard } from 'react-native-paper';

type Props = React.ComponentProps<typeof PaperCard>;

export default function Card(props: Props) {
  return <PaperCard mode="elevated" {...props} />;
}

