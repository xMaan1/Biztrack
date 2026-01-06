import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatsCard, QuickActionButton } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { colors, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface WorkshopStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  workOrders?: number;
  equipmentMaintenance?: number;
  qualityIssues?: number;
  productionEfficiency?: number;
}

interface WorkshopDashboardProps {
  stats: WorkshopStats;
  onNavigate: (path: string) => void;
}

export default function WorkshopDashboard({ stats, onNavigate }: WorkshopDashboardProps) {
  const workOrders = stats.workOrders || 0;
  const equipmentMaintenance = stats.equipmentMaintenance || 0;
  const productionEfficiency = stats.productionEfficiency || 85;
  const qualityIssues = stats.qualityIssues || 0;

  const completionRate = stats.totalProjects > 0
    ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
    : 0;

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43, 50],
      },
    ],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="construct" size={32} color={colors.white} />
          </View>
          <View>
            <Text style={styles.title}>Workshop Dashboard</Text>
            <Text style={styles.subtitle}>Real-time manufacturing operations</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <QuickActionButton
          title="New Project"
          icon="add-circle"
          onPress={() => onNavigate('/projects')}
          variant="primary"
        />
        <QuickActionButton
          title="Work Order"
          icon="construct"
          onPress={() => onNavigate('/workshop/work-orders')}
          variant="outline"
        />
      </View>

      <View style={styles.statsGrid}>
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          icon="folder"
          gradient={['#6366f1', '#8b5cf6', '#a855f7']}
        />
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          icon="play-circle"
          gradient={['#3b82f6', '#2563eb', '#1d4ed8']}
        />
        <StatsCard
          title="Work Orders"
          value={workOrders}
          icon="build"
          gradient={['#10b981', '#059669', '#047857']}
        />
        <StatsCard
          title="Efficiency"
          value={`${productionEfficiency}%`}
          icon="speedometer"
          gradient={['#f59e0b', '#d97706', '#b45309']}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Production</Text>
        <BarChart data={chartData} height={200} />
      </View>

      <View style={styles.additionalStats}>
        <StatsCard
          title="Team Members"
          value={stats.totalTeamMembers}
          icon="people"
          gradient={['#ec4899', '#db2777', '#be185d']}
        />
        <StatsCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon="checkmark-circle"
          gradient={['#14b8a6', '#0d9488', '#0f766e']}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.light.foreground,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.light.mutedForeground,
    marginTop: spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  chartContainer: {
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.light.foreground,
    marginBottom: spacing.sm,
  },
  additionalStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});

