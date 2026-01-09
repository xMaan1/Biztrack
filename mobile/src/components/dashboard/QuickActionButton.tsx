import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography, textStyles, borderRadius, shadows } from '@/theme';

const CARD_GAP = 12;

interface QuickActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  gradient: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
}

export function QuickActionButton({ icon, label, onPress, gradient }: QuickActionButtonProps) {
  const gradientConfig = gradients[gradient];
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    cart: 'cart',
    people: 'people',
    cube: 'cube-outline',
    medical: 'medical',
    calendar: 'calendar',
    'document-text': 'document-text-outline',
    construct: 'construct',
    settings: 'settings',
    'checkmark-circle': 'checkmark-circle',
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.quickActionWrapper} activeOpacity={0.8}>
      <LinearGradient
        colors={gradientConfig.colors}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={styles.quickActionGradient}
      >
        <Ionicons
          name={iconMap[icon] || 'help'}
          size={22}
          color={colors.background.default}
        />
        <Text style={styles.quickActionLabel} numberOfLines={2}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  quickActionWrapper: {
    flex: 1,
    marginHorizontal: CARD_GAP / 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  quickActionGradient: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  quickActionLabel: {
    ...textStyles.body2,
    fontSize: typography.fontSize.sm,
    color: colors.background.default,
    marginTop: spacing.sm,
    fontWeight: typography.fontWeight.semibold as any,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.1,
    paddingHorizontal: spacing.xs,
  },
});
