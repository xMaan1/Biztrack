import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCurrency } from '@/contexts/CurrencyContext';
import { StatsCard, QuickActionButton } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { colors, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface HealthcareStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  totalPatients?: number;
  appointmentsToday?: number;
  revenueThisMonth?: number;
  patientSatisfaction?: number;
}

interface HealthcareDashboardProps {
  stats: HealthcareStats;
  onNavigate: (path: string) => void;
}

export default function HealthcareDashboard({ stats, onNavigate }: HealthcareDashboardProps) {
  const { getCurrencySymbol } = useCurrency();
  const totalPatients = stats.totalPatients || 0;
  const appointmentsToday = stats.appointmentsToday || 0;
  const revenueThisMonth = stats.revenueThisMonth || 0;
  const patientSatisfaction = stats.patientSatisfaction || 0;

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [12, 19, 15, 25, 22, 18, 14],
      },
    ],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={32} color={colors.white} />
          </View>
          <View>
            <Text style={styles.title}>Healthcare Dashboard</Text>
            <Text style={styles.subtitle}>Medical Practice Management</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <QuickActionButton
          title="New Appointment"
          icon="calendar"
          onPress={() => onNavigate('/healthcare/appointments')}
          variant="primary"
        />
        <QuickActionButton
          title="View Patients"
          icon="people"
          onPress={() => onNavigate('/healthcare/patients')}
          variant="outline"
        />
      </View>

      <View style={styles.statsGrid}>
        <StatsCard
          title="Total Patients"
          value={totalPatients}
          icon="people"
          gradient={['#3b82f6', '#2563eb', '#1d4ed8']}
        />
        <StatsCard
          title="Appointments Today"
          value={appointmentsToday}
          icon="calendar"
          gradient={['#8b5cf6', '#7c3aed', '#6d28d9']}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`${getCurrencySymbol()}${revenueThisMonth.toLocaleString()}`}
          icon="cash"
          gradient={['#10b981', '#059669', '#047857']}
        />
        <StatsCard
          title="Satisfaction"
          value={`${patientSatisfaction}%`}
          icon="heart"
          gradient={['#ec4899', '#db2777', '#be185d']}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Weekly Appointments</Text>
        <BarChart data={chartData} height={200} />
      </View>

      <View style={styles.additionalStats}>
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          icon="folder-open"
          gradient={['#f59e0b', '#d97706', '#b45309']}
        />
        <StatsCard
          title="Team Members"
          value={stats.totalTeamMembers}
          icon="people-circle"
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
    flexWrap: 'wrap',
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

