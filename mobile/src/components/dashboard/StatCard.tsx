import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, typography, textStyles, borderRadius, shadows } from '@/theme';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const HORIZONTAL_PADDING = 20;
const CARD_GAP = 12;

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  gradient: 'primary' | 'success' | 'warning' | 'danger' | 'secondary';
}

export function StatCard({ title, value, icon, gradient }: StatCardProps) {
  const gradientConfig = gradients[gradient];
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'trending-up': 'trending-up',
    cart: 'cart',
    cash: 'cash-outline',
    star: 'star',
    people: 'people',
    calendar: 'calendar',
    time: 'time-outline',
    'document-text': 'document-text-outline',
    construct: 'construct',
    settings: 'settings',
    'alert-circle': 'alert-circle',
    speedometer: 'speedometer-outline',
    folder: 'folder',
  };

  return (
    <View style={styles.statCardWrapper}>
      <LinearGradient
        colors={gradientConfig.colors}
        start={gradientConfig.start}
        end={gradientConfig.end}
        style={styles.statCardGradient}
      >
        <View style={styles.statCardContent}>
          <View style={styles.statCardHeader}>
            <Text style={styles.statCardTitle} numberOfLines={2}>
              {title}
            </Text>
            <Ionicons
              name={iconMap[icon] || 'help'}
              size={20}
              color={colors.background.default}
            />
          </View>
          <Text style={styles.statCardValue} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  statCardWrapper: {
    width: (screenWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2,
    marginHorizontal: CARD_GAP / 2,
    marginBottom: CARD_GAP,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  statCardGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: 140,
  },
  statCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  statCardTitle: {
    ...textStyles.body2,
    color: colors.background.default,
    opacity: 0.95,
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 20,
  },
  statCardValue: {
    ...textStyles.h4,
    color: colors.background.default,
    fontWeight: typography.fontWeight.bold as any,
    lineHeight: 32,
  },
});
