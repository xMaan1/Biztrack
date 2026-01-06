import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import CommerceDashboard from './CommerceDashboard';
import HealthcareDashboard from './HealthcareDashboard';
import WorkshopDashboard from './WorkshopDashboard';

interface PlanAwareDashboardProps {
  planType: string;
  stats: any;
  onNavigate: (path: string) => void;
  loading?: boolean;
}

export default function PlanAwareDashboard({
  planType,
  stats,
  onNavigate,
  loading = false,
}: PlanAwareDashboardProps) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  switch (planType) {
    case 'workshop':
      return (
        <WorkshopDashboard stats={stats} onNavigate={onNavigate} />
      );

    case 'commerce':
      return (
        <CommerceDashboard stats={stats} onNavigate={onNavigate} />
      );

    case 'healthcare':
      return (
        <HealthcareDashboard stats={stats} onNavigate={onNavigate} />
      );

    default:
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>Welcome to Your Dashboard</Text>
          <Text style={styles.fallbackText}>
            Plan type: {planType || 'Unknown'}
          </Text>
          <Text style={styles.fallbackSubtext}>
            This is a generic dashboard view. Please contact support to configure your plan-specific dashboard.
          </Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  fallbackTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.foreground,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: typography.fontSize.lg,
    color: colors.light.mutedForeground,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  fallbackSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.light.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

