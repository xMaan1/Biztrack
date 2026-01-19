import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textStyles } from '@/theme';

const VERTICAL_GAP = 24;

interface DashboardHeaderProps {
  planType: 'commerce' | 'healthcare' | 'workshop';
}

export function DashboardHeader({ planType }: DashboardHeaderProps) {
  const title =
    planType === 'commerce'
      ? 'Commerce Dashboard'
      : planType === 'healthcare'
      ? 'Healthcare Dashboard'
      : 'Workshop Dashboard';

  const subtitle =
    planType === 'commerce'
      ? 'Retail & E-commerce Overview'
      : planType === 'healthcare'
      ? 'Medical Practice Overview'
      : 'Production & Manufacturing Overview';

  return (
    <View style={styles.headerSection}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingTop: VERTICAL_GAP,
    paddingBottom: VERTICAL_GAP + spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontWeight: textStyles.h2.fontWeight as '700',
  },
  subtitle: {
    ...textStyles.body1,
    color: colors.text.secondary,
    lineHeight: 24,
    letterSpacing: 0.1,
    fontWeight: textStyles.body1.fontWeight as any,
  },
});
