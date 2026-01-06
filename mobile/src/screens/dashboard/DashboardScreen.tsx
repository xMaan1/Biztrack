import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePlanInfo } from '@/hooks/usePlanInfo';
import { useDashboard } from '@/hooks/useDashboard';
import { PlanAwareDashboard } from '@/components/dashboard';
import { colors, spacing, typography } from '@/theme';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { planInfo, loading: planLoading } = usePlanInfo();
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard();

  const handleNavigate = (path: string) => {
    navigation.navigate(path as any);
  };

  const transformStats = () => {
    if (!dashboardData) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalTeamMembers: 0,
        averageProgress: 0,
        workOrders: 0,
        equipmentMaintenance: 0,
        qualityIssues: 0,
        productionEfficiency: 0,
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        customerSatisfaction: 0,
        totalPatients: 0,
        appointmentsToday: 0,
        revenueThisMonth: 0,
        patientSatisfaction: 0,
      };
    }

    return {
      totalProjects: dashboardData.projects.stats.total,
      activeProjects: dashboardData.projects.stats.active,
      completedProjects: dashboardData.projects.stats.completed,
      totalTeamMembers: dashboardData.users.total,
      averageProgress: dashboardData.projects.recent.length > 0
        ? Math.round(
            dashboardData.projects.recent.reduce(
              (sum, p) => sum + p.completionPercent,
              0
            ) / dashboardData.projects.recent.length
          )
        : 0,
      workOrders: dashboardData.workOrders.stats.total,
      equipmentMaintenance: dashboardData.workOrders.stats.draft,
      qualityIssues: dashboardData.workOrders.stats.in_progress,
      productionEfficiency: dashboardData.workOrders.stats.total > 0
        ? Math.round((dashboardData.workOrders.stats.completed / dashboardData.workOrders.stats.total) * 100)
        : 0,
      totalSales: dashboardData.financials.totalRevenue,
      totalOrders: 0,
      averageOrderValue: 0,
      customerSatisfaction: 85,
      totalPatients: 0,
      appointmentsToday: 0,
      revenueThisMonth: dashboardData.financials.totalRevenue,
      patientSatisfaction: 90,
    };
  };

  if (planLoading || dashboardLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (dashboardError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Dashboard Error</Text>
        <Text style={styles.errorText}>
          Failed to load dashboard data: {dashboardError}
        </Text>
        <Text style={styles.errorSubtext}>
          Please refresh or contact support.
        </Text>
      </View>
    );
  }

  if (!planInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Plan Information Not Available</Text>
        <Text style={styles.errorText}>
          Unable to load your subscription plan information.
        </Text>
        <Text style={styles.errorSubtext}>
          Please contact support or refresh the page.
        </Text>
      </View>
    );
  }

  const stats = transformStats();

  return (
    <PlanAwareDashboard
      planType={planInfo.planType}
      stats={stats}
      onNavigate={handleNavigate}
      loading={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.light.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.light.background,
  },
  errorTitle: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.foreground,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.light.mutedForeground,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.light.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
