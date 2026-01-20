import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import QualityControlService from '@/services/QualityControlService';
import {
  QualityCheckResponse as QualityCheck,
  QualityDashboard,
  getQualityStatusColor,
  getQualityStatusLabel,
  getQualityPriorityLabel,
} from '@/models/qualityControl';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function QualityControlDashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<QualityDashboard | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await QualityControlService.getQualityDashboard();
      setDashboardData(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading && !dashboardData) {
    return (
      <Container safeArea>
        <Header title="Quality Control Dashboard" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  const stats = dashboardData?.stats;

  return (
    <Container safeArea>
      <Header
        title="Quality Control Dashboard"
        gradient={false}
        rightIcon="refresh"
        onRightPress={loadDashboardData}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Total Checks</Text>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary.main} />
            </View>
            <Text style={styles.statValue}>{stats?.total_checks || 0}</Text>
            <Text style={styles.statSubtext}>Quality checks created</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Pending Checks</Text>
              <Ionicons name="time-outline" size={24} color={colors.yellow[600]} />
            </View>
            <Text style={styles.statValue}>{stats?.pending_checks || 0}</Text>
            <Text style={styles.statSubtext}>Awaiting inspection</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Compliance Score</Text>
              <Ionicons name="target-outline" size={24} color={colors.green[600]} />
            </View>
            <Text style={styles.statValue}>{stats?.average_compliance_score || 0}%</Text>
            <Text style={styles.statSubtext}>Average compliance</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Critical Defects</Text>
              <Ionicons name="warning-outline" size={24} color={colors.red[600]} />
            </View>
            <Text style={styles.statValue}>{stats?.critical_defects || 0}</Text>
            <Text style={styles.statSubtext}>Require immediate attention</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Quality Checks</Text>
            <TouchableOpacity
              onPress={() => (navigation.navigate as any)('QualityCheckList', {})}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {dashboardData?.recent_checks && dashboardData.recent_checks.length > 0 ? (
            <View style={styles.listContainer}>
              {dashboardData.recent_checks.map((check: QualityCheck) => {
                const statusStyle = getQualityStatusColor(check.status);
                return (
                  <TouchableOpacity
                    key={check.id}
                    style={styles.listItem}
                    onPress={() =>
                      (navigation.navigate as any)('QualityCheckDetail', { id: check.id })
                    }
                  >
                    <View style={[styles.listItemIcon, { backgroundColor: statusStyle.bg }]}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={statusStyle.border}
                      />
                    </View>
                    <View style={styles.listItemContent}>
                      <Text style={styles.listItemTitle}>{check.title}</Text>
                      <Text style={styles.listItemSubtext}>{check.id}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusStyle.border }]}>
                        {getQualityStatusLabel(check.status)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent quality checks</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Checks</Text>
          </View>
          {dashboardData?.upcoming_checks && dashboardData.upcoming_checks.length > 0 ? (
            <View style={styles.listContainer}>
              {dashboardData.upcoming_checks.map((check: QualityCheck) => (
                <TouchableOpacity
                  key={check.id}
                  style={styles.listItem}
                  onPress={() =>
                    (navigation.navigate as any)('QualityCheckDetail', { id: check.id })
                  }
                >
                  <View
                    style={[
                      styles.listItemIcon,
                      { backgroundColor: colors.yellow[100] },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={colors.yellow[600]}
                    />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{check.title}</Text>
                    <Text style={styles.listItemSubtext}>
                      {check.scheduled_date
                        ? QualityControlService.formatDate(check.scheduled_date)
                        : 'Not scheduled'}
                    </Text>
                  </View>
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>
                      {getQualityPriorityLabel(check.priority)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No upcoming quality checks</Text>
            </View>
          )}
        </View>

        {dashboardData?.critical_defects && dashboardData.critical_defects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.red[600] }]}>
                Critical Defects
              </Text>
            </View>
            <View style={styles.listContainer}>
              {dashboardData.critical_defects.map((defect: any) => (
                <View key={defect.id} style={[styles.listItem, styles.criticalItem]}>
                  <View style={[styles.listItemIcon, { backgroundColor: colors.red[100] }]}>
                    <Ionicons name="bug-outline" size={20} color={colors.red[600]} />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{defect.title}</Text>
                    <Text style={styles.listItemSubtext}>
                      {defect.category} • {defect.location || 'No location'}
                    </Text>
                  </View>
                  <View style={styles.defectInfo}>
                    <View style={[styles.severityBadge, { backgroundColor: colors.red[100] }]}>
                      <Text style={[styles.severityText, { color: colors.red[800] }]}>
                        {defect.severity}
                      </Text>
                    </View>
                    <Text style={styles.costText}>
                      {getCurrencySymbol()}
                      {formatCurrency(defect.cost_impact || 0)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => (navigation.navigate as any)('QualityCheckList', {})}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary.main} />
            <Text style={styles.quickActionText}>Quality Checks</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => (navigation.navigate as any)('QualityInspectionList', {})}
          >
            <Ionicons name="document-text-outline" size={24} color={colors.primary.main} />
            <Text style={styles.quickActionText}>Inspections</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => (navigation.navigate as any)('QualityDefectList', {})}
          >
            <Ionicons name="bug-outline" size={24} color={colors.primary.main} />
            <Text style={styles.quickActionText}>Defects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => (navigation.navigate as any)('QualityReportList', {})}
          >
            <Ionicons name="bar-chart-outline" size={24} color={colors.primary.main} />
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => (navigation.navigate as any)('QualityCheckForm', {})}
        >
          <Ionicons name="add" size={20} color={colors.background.default} />
          <Text style={styles.createButtonText}>New Quality Check</Text>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statSubtext: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '500',
  },
  listContainer: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.card.border,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  criticalItem: {
    backgroundColor: colors.red[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.red[600],
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  listItemSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.muted,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  defectInfo: {
    alignItems: 'flex-end',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  costText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
    gap: spacing.xs,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
});
