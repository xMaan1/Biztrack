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
import CRMService from '@/services/CRMService';
import { CRMDashboard } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function CRMDashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [dashboard, setDashboard] = useState<CRMDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await CRMService.getDashboard();
      setDashboard(data);
    } catch (error: any) {
      console.error('Error loading CRM dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  if (loading && !dashboard) {
    return (
      <Container safeArea>
        <Header title="CRM Dashboard" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!dashboard) {
    return (
      <Container safeArea>
        <Header title="CRM Dashboard" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Failed to load dashboard</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="CRM Dashboard"
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
              {dashboard.metrics.activeLeads} active
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="person-outline" size={24} color={colors.green[600]} />
              <Text style={styles.metricLabel}>Total Contacts</Text>
            </View>
            <Text style={styles.metricValue}>{dashboard.metrics.totalContacts}</Text>
            <Text style={styles.metricSubtext}>Customer database</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-up-outline" size={24} color={colors.purple[600]} />
              <Text style={styles.metricLabel}>Total Revenue</Text>
            </View>
            <Text style={styles.metricValue}>
              {formatCurrency(dashboard.metrics.totalRevenue)}
            </Text>
            <Text style={styles.metricSubtext}>
              {formatCurrency(dashboard.metrics.projectedRevenue)} projected
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="stats-chart-outline" size={24} color={colors.orange[600]} />
              <Text style={styles.metricLabel}>Conversion Rate</Text>
            </View>
            <Text style={styles.metricValue}>
              {dashboard.metrics.conversionRate}%
            </Text>
            <Text style={styles.metricSubtext}>Lead to customer</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Pipeline</Text>
          <View style={styles.pipelineCard}>
            {dashboard.pipeline.map((stage, index) => (
              <View key={index} style={styles.pipelineItem}>
                <View style={styles.pipelineHeader}>
                  <View style={styles.pipelineBadge}>
                    <Text style={styles.pipelineStage}>
                      {stage.stage.replace('_', ' ')}
                    </Text>
                    <Text style={styles.pipelineCount}>{stage.count} opportunities</Text>
                  </View>
                  <View style={styles.pipelineValue}>
                    <Text style={styles.pipelineValueText}>
                      {formatCurrency(stage.value)}
                    </Text>
                    <Text style={styles.pipelineProbability}>
                      {stage.probability}% probability
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          (stage.count /
                            Math.max(...dashboard.pipeline.map((p) => p.count))) *
                            100,
                          100,
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Opportunities</Text>
          <View style={styles.opportunitiesCard}>
            {dashboard.topOpportunities.slice(0, 5).map((opportunity) => (
              <TouchableOpacity
                key={opportunity.id}
                style={styles.opportunityItem}
                onPress={() =>
                  navigation.navigate('OpportunityDetail' as never, {
                    id: opportunity.id,
                  } as never)
                }
              >
                <View style={styles.opportunityInfo}>
                  <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
                  {opportunity.description && (
                    <Text style={styles.opportunityDescription} numberOfLines={1}>
                      {opportunity.description}
                    </Text>
                  )}
                  <View style={styles.opportunityMeta}>
                    <View
                      style={[
                        styles.stageBadge,
                        {
                          backgroundColor: colors.blue[100],
                          borderColor: colors.blue[500],
                        },
                      ]}
                    >
                      <Text style={styles.stageText}>
                        {opportunity.stage.replace('_', ' ')}
                      </Text>
                    </View>
                    <Text style={styles.opportunityProbability}>
                      {opportunity.probability}% probability
                    </Text>
                  </View>
                </View>
                <View style={styles.opportunityValue}>
                  {opportunity.amount ? (
                    <Text style={styles.opportunityAmount}>
                      {formatCurrency(opportunity.amount)}
                    </Text>
                  ) : (
                    <Text style={styles.opportunityAmount}>N/A</Text>
                  )}
                  {opportunity.expectedCloseDate && (
                    <Text style={styles.opportunityDate}>
                      Closes {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Leads</Text>
          <View style={styles.leadsCard}>
            {dashboard.recentLeads.slice(0, 5).map((lead) => (
              <TouchableOpacity
                key={lead.id}
                style={styles.leadItem}
                onPress={() =>
                  navigation.navigate('LeadDetail' as never, { id: lead.id } as never)
                }
              >
                <View style={styles.leadInfo}>
                  <Text style={styles.leadName}>
                    {lead.firstName} {lead.lastName}
                  </Text>
                  <Text style={styles.leadEmail}>{lead.email}</Text>
                  {lead.company && (
                    <Text style={styles.leadCompany}>{lead.company}</Text>
                  )}
                  <View style={styles.leadMeta}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: colors.blue[100],
                          borderColor: colors.blue[500],
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>{lead.status}</Text>
                    </View>
                    <View
                      style={[
                        styles.sourceBadge,
                        {
                          backgroundColor: colors.gray[100],
                          borderColor: colors.gray[500],
                        },
                      ]}
                    >
                      <Text style={styles.sourceText}>{lead.source}</Text>
                    </View>
                    {lead.score > 0 && (
                      <Text style={styles.leadScore}>Score: {lead.score}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.leadValue}>
                  <Text style={styles.leadDate}>
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </Text>
                  {lead.budget && (
                    <Text style={styles.leadBudget}>
                      Budget: {formatCurrency(lead.budget)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('LeadList' as never)}
            >
              <Ionicons name="people-outline" size={32} color={colors.blue[600]} />
              <Text style={styles.quickActionText}>Manage Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('CustomerList' as never)}
            >
              <Ionicons name="people-outline" size={32} color={colors.green[600]} />
              <Text style={styles.quickActionText}>Manage Customers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('ContactList' as never)}
            >
              <Ionicons name="person-outline" size={32} color={colors.orange[600]} />
              <Text style={styles.quickActionText}>Manage Contacts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('CompanyList' as never)}
            >
              <Ionicons name="business-outline" size={32} color={colors.purple[600]} />
              <Text style={styles.quickActionText}>Manage Companies</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('OpportunityList' as never)}
            >
              <Ionicons name="target-outline" size={32} color={colors.indigo[600]} />
              <Text style={styles.quickActionText}>Manage Opportunities</Text>
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
  pipelineCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  pipelineItem: {
    marginBottom: spacing.md,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  pipelineBadge: {
    flex: 1,
  },
  pipelineStage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  pipelineCount: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  pipelineValue: {
    alignItems: 'flex-end',
  },
  pipelineValueText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  pipelineProbability: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.background.muted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
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
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
  opportunityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
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
  opportunityProbability: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  opportunityValue: {
    alignItems: 'flex-end',
  },
  opportunityAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  opportunityDate: {
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
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
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
    marginBottom: spacing.xs,
  },
  leadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
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
    borderWidth: 1,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  leadScore: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  leadValue: {
    alignItems: 'flex-end',
  },
  leadDate: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  leadBudget: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
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