import React from 'react';
import { View, ScrollView, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  padded?: boolean;
  scroll?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export default function Screen({
  children,
  padded = true,
  scroll = true,
  style,
  contentContainerStyle,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const padding = padded ? 24 : 0;
  const baseBottom = padding + Math.max(insets.bottom, 16);
  const extraBottom = Math.max(baseBottom, 120);
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };
  const contentStyle: ViewStyle = {
    flexGrow: 1,
    paddingHorizontal: padding,
    paddingTop: padding,
    paddingBottom: extraBottom,
  };

  if (scroll) {
    return (
      <ScrollView
        style={[containerStyle, style]}
        contentContainerStyle={[contentStyle, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        containerStyle,
        {
          paddingHorizontal: padding,
          paddingTop: padding,
          paddingBottom: extraBottom,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
