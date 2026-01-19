import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import SalesService from '@/services/SalesService';
import CRMService from '@/services/CRMService';
import { SalesDashboard } from '@/models/sales';
import { Lead, Opportunity } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function SalesDashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [dashboard, setDashboard] = useState<SalesDashboard | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardData, leadsData, opportunitiesData] = await Promise.all([
        SalesService.getDashboard(),
        CRMService.getLeads({}, 1, 10),
        CRMService.getOpportunities({}, 1, 10),
      ]);
      setDashboard(dashboardData);
      setLeads(leadsData.leads || []);
      setOpportunities(opportunitiesData.opportunities || []);
    } catch (error: any) {
      console.error('Error loading sales dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const colorsMap: Record<string, { backgroundColor: string; borderColor: string }> = {
      new: { backgroundColor: colors.blue[100], borderColor: colors.blue[500] },
      contacted: { backgroundColor: colors.yellow[100], borderColor: colors.yellow[500] },
      qualified: { backgroundColor: colors.green[100], borderColor: colors.green[500] },
      proposal: { backgroundColor: colors.purple[100], borderColor: colors.purple[500] },
      negotiation: { backgroundColor: colors.orange[100], borderColor: colors.orange[500] },
      won: { backgroundColor: colors.green[100], borderColor: colors.green[500] },
      lost: { backgroundColor: colors.red[100], borderColor: colors.red[500] },
    };
    return colorsMap[status] || { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
  };

  const getStageColor = (stage: string) => {
    const colorsMap: Record<string, { backgroundColor: string; borderColor: string }> = {
      prospecting: { backgroundColor: colors.blue[100], borderColor: colors.blue[500] },
      qualification: { backgroundColor: colors.yellow[100], borderColor: colors.yellow[500] },
      proposal: { backgroundColor: colors.purple[100], borderColor: colors.purple[500] },
      negotiation: { backgroundColor: colors.orange[100], borderColor: colors.orange[500] },
      closed_won: { backgroundColor: colors.green[100], borderColor: colors.green[500] },
      closed_lost: { backgroundColor: colors.red[100], borderColor: colors.red[500] },
    };
    return colorsMap[stage] || { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
  };

  if (loading && !dashboard) {
    return (
      <Container safeArea>
        <Header title="Sales Dashboard" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!dashboard) {
    return (
      <Container safeArea>
        <Header title="Sales Dashboard" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Failed to load dashboard</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Sales Dashboard"
        gradient={false}
        rightIcon="add-outline"
        onRightPress={() => navigation.navigate('LeadForm' as never)}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="people-outline" size={24} color={colors.blue[600]} />
              <Text style={styles.metricLabel}>Total Leads</Text>
            </View>
            <Text style={styles.metricValue}>{dashboard.metrics.totalLeads}</Text>
            <Text style={styles.metricSubtext}>
              {dashboard.metrics.activeLeads} active leads
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="flag-outline" size={24} color={colors.purple[600]} />
              <Text style={styles.metricLabel}>Opportunities</Text>
            </View>
            <Text style={styles.metricValue}>
              {dashboard.metrics.totalOpportunities}
            </Text>
            <Text style={styles.metricSubtext}>
              {dashboard.metrics.openOpportunities} open opportunities
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="cart-outline" size={24} color={colors.green[600]} />
              <Text style={styles.metricLabel}>Total Revenue</Text>
            </View>
            <Text style={styles.metricValue}>
              {formatCurrency(dashboard.metrics.totalRevenue)}
            </Text>
            <Text style={styles.metricSubtext}>
              {dashboard.metrics.conversionRate}% conversion rate
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-up-outline" size={24} color={colors.orange[600]} />
              <Text style={styles.metricLabel}>Projected Revenue</Text>
            </View>
            <Text style={styles.metricValue}>
              {formatCurrency(dashboard.metrics.projectedRevenue)}
            </Text>
            <Text style={styles.metricSubtext}>
              Avg deal: {formatCurrency(dashboard.metrics.averageDealSize)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Pipeline</Text>
          <View style={styles.pipelineGrid}>
            {dashboard.pipeline.map((stage, index) => (
              <View key={index} style={styles.pipelineCard}>
                <Text style={styles.pipelineStage}>
                  {stage.stage.replace('_', ' ')}
                </Text>
                <Text style={styles.pipelineCount}>{stage.count}</Text>
                <Text style={styles.pipelineValue}>
                  {formatCurrency(stage.value)}
                </Text>
                <Text style={styles.pipelineProbability}>
                  {stage.probability}% probability
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Leads</Text>
          <View style={styles.leadsCard}>
            {leads.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No leads found. Create your first lead to get started.
                </Text>
              </View>
            ) : (
              leads.map((lead) => (
                <TouchableOpacity
                  key={lead.id}
                  style={styles.leadItem}
                  onPress={() =>
                    (navigation.navigate as any)('LeadDetail', { id: lead.id })
                  }
                >
                  <View style={styles.leadIcon}>
                    <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
                  </View>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadName}>
                      {lead.firstName} {lead.lastName}
                    </Text>
                    <Text style={styles.leadEmail}>{lead.email}</Text>
                    {lead.company && (
                      <Text style={styles.leadCompany}>{lead.company}</Text>
                    )}
                  </View>
                  <View style={styles.leadMeta}>
                    <View
                      style={[
                        styles.statusBadge,
                        getStatusColor(lead.status),
                      ]}
                    >
                      <Text style={styles.statusText}>{lead.status}</Text>
                    </View>
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceText}>{lead.source}</Text>
                    </View>
                    {lead.budget && (
                      <Text style={styles.leadBudget}>
                        {formatCurrency(lead.budget)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Opportunities</Text>
          <View style={styles.opportunitiesCard}>
            {opportunities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No opportunities found. Create your first opportunity to get started.
                </Text>
              </View>
            ) : (
              opportunities.map((opportunity) => (
                <TouchableOpacity
                  key={opportunity.id}
                  style={styles.opportunityItem}
                  onPress={() =>
                    (navigation.navigate as any)('OpportunityDetail', {
                      id: opportunity.id,
                    })
                  }
                >
                  <View style={styles.opportunityIcon}>
                    <Ionicons name="flag-outline" size={20} color={colors.blue[600]} />
                  </View>
                  <View style={styles.opportunityInfo}>
                    <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
                    {opportunity.description && (
                      <Text style={styles.opportunityDescription} numberOfLines={1}>
                        {opportunity.description}
                      </Text>
                    )}
                    {opportunity.expectedCloseDate && (
                      <Text style={styles.opportunityDate}>
                        Expected close:{' '}
                        {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.opportunityMeta}>
                    <View
                      style={[
                        styles.stageBadge,
                        getStageColor(opportunity.stage),
                      ]}
                    >
                      <Text style={styles.stageText}>
                        {opportunity.stage.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={styles.opportunityAmount}>
                      {formatCurrency(opportunity.amount || 0)}
                    </Text>
                    <Text style={styles.opportunityProbability}>
                      {opportunity.probability}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('QuoteList' as never)}
            >
              <Ionicons name="document-text-outline" size={32} color={colors.blue[600]} />
              <Text style={styles.quickActionText}>Create Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('InvoiceList' as never)}
            >
              <Ionicons name="receipt-outline" size={32} color={colors.green[600]} />
              <Text style={styles.quickActionText}>View Invoices</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Analytics' as never)}
            >
              <Ionicons name="bar-chart-outline" size={32} color={colors.orange[600]} />
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('ContractList' as never)}
            >
              <Ionicons name="document-outline" size={32} color={colors.purple[600]} />
              <Text style={styles.quickActionText}>Contracts</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background.default,
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: '47%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  metricSubtext: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  pipelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pipelineCard: {
    width: '47%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  pipelineStage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  pipelineCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pipelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  pipelineProbability: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  leadsCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  leadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  leadIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  leadEmail: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  leadCompany: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  leadMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[500],
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  leadBudget: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.green[600],
  },
  opportunitiesCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  opportunityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  opportunityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  opportunityInfo: {
    flex: 1,
  },
  opportunityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  opportunityDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  opportunityDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  opportunityMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  stageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  stageText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  opportunityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.green[600],
  },
  opportunityProbability: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyState: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});