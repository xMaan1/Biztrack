import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/theme';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export function Alert({ children, variant = 'default' }: AlertProps) {
  return (
    <View style={[styles.alert, styles[`alert_${variant}`]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  alert_default: {
    backgroundColor: colors.light.muted,
  },
  alert_destructive: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: colors.semantic.error,
  },
  alert_success: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: colors.semantic.success,
  },
  alert_warning: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: colors.semantic.warning,
  },
  text: {
    fontSize: typography.fontSize.sm,
  },
  text_default: {
    color: colors.light.foreground,
  },
  text_destructive: {
    color: colors.semantic.error,
  },
  text_success: {
    color: colors.semantic.success,
  },
  text_warning: {
    color: colors.semantic.warning,
  },
});

