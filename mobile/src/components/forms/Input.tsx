import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.light.mutedForeground}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.light.foreground,
    marginBottom: spacing.xs,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.light.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.light.foreground,
    backgroundColor: colors.light.background,
  },
  inputError: {
    borderColor: colors.semantic.error,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
});

