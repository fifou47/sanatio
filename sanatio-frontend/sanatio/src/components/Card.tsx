// components/Card.tsx
import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';

type CardProps = React.ComponentProps<typeof PaperCard>;

type CardComponent = React.ForwardRefExoticComponent<
  CardProps & React.RefAttributes<View>
> & {
  Title: typeof PaperCard.Title;
  Content: typeof PaperCard.Content;
  Actions: typeof PaperCard.Actions;
  Cover: typeof PaperCard.Cover;
};

const Card = Object.assign(
  forwardRef<View, CardProps>((props, ref) => (
    <PaperCard ref={ref} mode="elevated" {...props} />
  )),
  {
    Title: PaperCard.Title,
    Content: PaperCard.Content,
    Actions: PaperCard.Actions,
    Cover: PaperCard.Cover,
  }
) as CardComponent;

export default Card;
