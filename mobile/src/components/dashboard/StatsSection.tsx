import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatCard } from './StatCard';
import { useCurrency } from '@/contexts/CurrencyContext';

const CARD_GAP = 12;
const SECTION_GAP = 32;

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  workOrders?: number;
  equipmentMaintenance?: number;
  qualityIssues?: number;
  productionEfficiency?: number;
  totalSales?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  customerSatisfaction?: number;
  totalPatients?: number;
  totalAppointments?: number;
  upcomingAppointments?: number;
  medicalRecords?: number;
}

interface StatsSectionProps {
  planType: 'commerce' | 'healthcare' | 'workshop';
  stats: DashboardStats;
}

export function StatsSection({ planType, stats }: StatsSectionProps) {
  const { formatCurrency } = useCurrency();

  return (
    <View style={styles.statsSection}>
      {planType === 'commerce' && (
        <>
          <StatCard
            title="Total Sales"
            value={formatCurrency(stats.totalSales || 0)}
            icon="trending-up"
            gradient="success"
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders?.toLocaleString() || '0'}
            icon="cart"
            gradient="primary"
          />
          <StatCard
            title="Avg Order Value"
            value={formatCurrency(stats.averageOrderValue || 0)}
            icon="cash"
            gradient="warning"
          />
          <StatCard
            title="Customer Satisfaction"
            value={`${stats.customerSatisfaction || 0}%`}
            icon="star"
            gradient="secondary"
          />
        </>
      )}
      {planType === 'healthcare' && (
        <>
          <StatCard
            title="Total Patients"
            value={stats.totalPatients?.toLocaleString() || '0'}
            icon="people"
            gradient="success"
          />
          <StatCard
            title="Appointments"
            value={stats.totalAppointments?.toLocaleString() || '0'}
            icon="calendar"
            gradient="primary"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingAppointments?.toLocaleString() || '0'}
            icon="time"
            gradient="warning"
          />
          <StatCard
            title="Medical Records"
            value={stats.medicalRecords?.toLocaleString() || '0'}
            icon="document-text"
            gradient="secondary"
          />
        </>
      )}
      {planType === 'workshop' && (
        <>
          <StatCard
            title="Work Orders"
            value={stats.workOrders?.toLocaleString() || '0'}
            icon="construct"
            gradient="success"
          />
          <StatCard
            title="Maintenance"
            value={stats.equipmentMaintenance?.toLocaleString() || '0'}
            icon="settings"
            gradient="primary"
          />
          <StatCard
            title="Quality Issues"
            value={stats.qualityIssues?.toLocaleString() || '0'}
            icon="alert-circle"
            gradient="warning"
          />
          <StatCard
            title="Efficiency"
            value={`${stats.productionEfficiency || 0}%`}
            icon="speedometer"
            gradient="secondary"
          />
        </>
      )}
      <StatCard
        title="Active Projects"
        value={stats.activeProjects.toLocaleString()}
        icon="folder"
        gradient="primary"
      />
      <StatCard
        title="Team Members"
        value={stats.totalTeamMembers.toLocaleString()}
        icon="people"
        gradient="success"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SECTION_GAP,
    marginHorizontal: -CARD_GAP / 2,
  },
});
