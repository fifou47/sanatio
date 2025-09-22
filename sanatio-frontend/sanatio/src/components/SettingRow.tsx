
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { List, Text, useTheme } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Radius, Spacing } from '../theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  icon: IconName;
  title: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
};

export default function SettingRow({ icon, title, description, value, rightElement, onPress }: Props) {
  const theme = useTheme();

  return (
    <List.Item
      onPress={onPress}
      style={styles.item}
      title={() => (
        <View style={styles.titleWrapper}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
        </View>
      )}
      description={description}
      descriptionNumberOfLines={2}
      descriptionStyle={styles.description}
      left={() => (
        <View style={styles.iconBubble}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
      )}
      right={() => (
        <View style={styles.right}>
          {rightElement ? rightElement : value ? (
            <Text variant="bodyMedium" style={styles.value}>
              {value}
            </Text>
          ) : null}
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    paddingHorizontal: Spacing.s16,
    paddingVertical: Spacing.s12,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.s16,
  },
  titleWrapper: {
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
  },
  description: {
    color: Colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s8,
  },
  value: {
    color: Colors.textMuted,
  },
});
