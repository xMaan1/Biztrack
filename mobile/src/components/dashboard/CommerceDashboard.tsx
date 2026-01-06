import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCurrency } from '@/contexts/CurrencyContext';
import { StatsCard, QuickActionButton } from '@/components/ui';
import { LineChart } from '@/components/charts';
import { colors, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface CommerceStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  totalSales?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  customerSatisfaction?: number;
}

interface CommerceDashboardProps {
  stats: CommerceStats;
  onNavigate: (path: string) => void;
}

export default function CommerceDashboard({ stats, onNavigate }: CommerceDashboardProps) {
  const { getCurrencySymbol, formatCurrency } = useCurrency();
  const totalSales = stats.totalSales || 0;
  const totalOrders = stats.totalOrders || 0;
  const averageOrderValue = stats.averageOrderValue || 0;
  const customerSatisfaction = stats.customerSatisfaction || 0;

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity: number) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="storefront" size={32} color={colors.white} />
          </View>
          <View>
            <Text style={styles.title}>Commerce Dashboard</Text>
            <Text style={styles.subtitle}>Retail & E-commerce Overview</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <QuickActionButton
          title="New Sale"
          icon="cart"
          onPress={() => onNavigate('/commerce/pos')}
          variant="primary"
        />
        <QuickActionButton
          title="View Sales"
          icon="trending-up"
          onPress={() => onNavigate('/commerce/sales')}
          variant="outline"
        />
        <QuickActionButton
          title="Inventory"
          icon="cube"
          onPress={() => onNavigate('/commerce/inventory')}
          variant="outline"
        />
      </View>

      <View style={styles.statsGrid}>
        <StatsCard
          title="Total Sales"
          value={`${getCurrencySymbol()}${totalSales.toLocaleString()}`}
          icon="trending-up"
          gradient={['#10b981', '#059669', '#047857']}
        />
        <StatsCard
          title="Total Orders"
          value={totalOrders}
          icon="cart"
          gradient={['#3b82f6', '#2563eb', '#1d4ed8']}
        />
        <StatsCard
          title="Avg Order Value"
          value={`${getCurrencySymbol()}${averageOrderValue.toLocaleString()}`}
          icon="cash"
          gradient={['#8b5cf6', '#7c3aed', '#6d28d9']}
        />
        <StatsCard
          title="Satisfaction"
          value={`${customerSatisfaction}%`}
          icon="heart"
          gradient={['#ec4899', '#db2777', '#be185d']}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Sales Trend</Text>
        <LineChart data={chartData} height={200} />
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
          icon="people"
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
    backgroundColor: colors.semantic.success,
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

