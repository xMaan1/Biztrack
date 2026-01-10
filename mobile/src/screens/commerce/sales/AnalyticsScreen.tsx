import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import CRMService from '@/services/CRMService';
import InvoiceService from '@/services/InvoiceService';
import { Opportunity, OpportunityStage } from '@/models/crm';
import { Contact, ContactType } from '@/models/crm';
import { Company } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [oppsResponse, contactsResponse, companiesResponse, invoicesResponse] =
        await Promise.all([
          CRMService.getOpportunities({}, 1, 100),
          CRMService.getContacts({}, 1, 100),
          CRMService.getCompanies({}, 1, 100),
          InvoiceService.getInvoices({}, 1, 100),
        ]);

      setOpportunities(oppsResponse.opportunities || []);
      setContacts(contactsResponse.contacts || []);
      setCompanies(companiesResponse.companies || []);
      setInvoices(invoicesResponse.invoices || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getFilteredData = () => {
    const now = new Date();
    const daysAgo = new Date(
      now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000,
    );

    return {
      opportunities: opportunities.filter(
        (opp) => !opp.createdAt || new Date(opp.createdAt) >= daysAgo,
      ),
      contacts: contacts.filter(
        (contact) =>
          !contact.createdAt || new Date(contact.createdAt) >= daysAgo,
      ),
      companies: companies.filter(
        (company) =>
          !company.createdAt || new Date(company.createdAt) >= daysAgo,
      ),
      invoices: invoices.filter(
        (invoice) =>
          !invoice.createdAt || new Date(invoice.createdAt) >= daysAgo,
      ),
    };
  };

  const {
    opportunities: filteredOpps,
    contacts: filteredContacts,
    companies: filteredCompanies,
    invoices: filteredInvoices,
  } = getFilteredData();

  const pipelineByStage = Object.values(OpportunityStage).map((stage) => {
    const stageOpps = filteredOpps.filter((opp) => opp.stage === stage);
    const totalValue = stageOpps.reduce(
      (sum, opp) => sum + (opp.amount || 0),
      0,
    );
    const count = stageOpps.length;

    return { stage, totalValue, count };
  });

  const totalPipelineValue = filteredOpps.reduce(
    (sum, opp) => sum + (opp.amount || 0),
    0,
  );

  const weightedPipelineValue = filteredOpps.reduce(
    (sum, opp) => sum + ((opp.amount || 0) * (opp.probability || 0)) / 100,
    0,
  );

  const totalOpportunities = filteredOpps.length;
  const wonOpportunities = filteredOpps.filter(
    (opp) => opp.stage === OpportunityStage.CLOSED_WON,
  ).length;
  const lostOpportunities = filteredOpps.filter(
    (opp) => opp.stage === OpportunityStage.CLOSED_LOST,
  ).length;
  const winRate =
    totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0;

  const totalRevenue = filteredOpps
    .filter((opp) => opp.stage === OpportunityStage.CLOSED_WON)
    .reduce((sum, opp) => sum + (opp.amount || 0), 0);

  const invoiceRevenue = filteredInvoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const totalRevenueCombined = totalRevenue + invoiceRevenue;

  const avgDealSize =
    wonOpportunities > 0 ? totalRevenue / wonOpportunities : 0;

  const totalContacts = filteredContacts.length;
  const leadContacts = filteredContacts.filter(
    (c) => c.type === ContactType.LEAD,
  ).length;
  const customerContacts = filteredContacts.filter(
    (c) => c.type === ContactType.CUSTOMER,
  ).length;
  const leadToCustomerRate =
    leadContacts > 0 ? (customerContacts / leadContacts) * 100 : 0;

  const topOpportunities = filteredOpps
    .filter((opp) => opp.amount && opp.amount > 0)
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Sales Analytics" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title="Sales Analytics" gradient={false} />
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
        <View style={styles.timeRangeContainer}>
          <Text style={styles.timeRangeLabel}>Time Range:</Text>
          <View style={styles.timeRangeOptions}>
            {['7', '30', '90', '365'].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.timeRangeChip,
                  timeRange === days && styles.timeRangeChipActive,
                ]}
                onPress={() => setTimeRange(days)}
              >
                <Text
                  style={[
                    styles.timeRangeChipText,
                    timeRange === days && styles.timeRangeChipTextActive,
                  ]}
                >
                  {days === '7' ? '7d' : days === '30' ? '30d' : days === '90' ? '90d' : '1y'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-up-outline" size={24} color={colors.primary.main} />
              <Text style={styles.metricLabel}>Total Pipeline</Text>
            </View>
            <Text style={styles.metricValue}>
              {formatCurrency(totalPipelineValue)}
            </Text>
            <Text style={styles.metricSubtext}>
              {filteredOpps.length} opportunities
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="target-outline" size={24} color={colors.purple[600]} />
              <Text style={styles.metricLabel}>Weighted Pipeline</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.purple[600] }]}>
              {formatCurrency(weightedPipelineValue)}
            </Text>
            <Text style={styles.metricSubtext}>Probability-adjusted</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.green[600]} />
              <Text style={styles.metricLabel}>Win Rate</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.green[600] }]}>
              {winRate.toFixed(1)}%
            </Text>
            <Text style={styles.metricSubtext}>
              {wonOpportunities} won / {totalOpportunities} total
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="cash-outline" size={24} color={colors.orange[600]} />
              <Text style={styles.metricLabel}>Total Revenue</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.orange[600] }]}>
              {formatCurrency(totalRevenueCombined)}
            </Text>
            <Text style={styles.metricSubtext}>Closed won + Paid invoices</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pipeline by Stage</Text>
          <View style={styles.infoCard}>
            {pipelineByStage.map(({ stage, totalValue, count }) => (
              <View key={stage} style={styles.pipelineRow}>
                <View style={styles.pipelineInfo}>
                  <Text style={styles.pipelineStage}>
                    {stage.toString().replace('_', ' ')}
                  </Text>
                  <Text style={styles.pipelineCount}>({count})</Text>
                </View>
                <View style={styles.pipelineValue}>
                  <Text style={styles.pipelineAmount}>
                    {formatCurrency(totalValue)}
                  </Text>
                  {totalPipelineValue > 0 && (
                    <Text style={styles.pipelinePercent}>
                      {((totalValue / totalPipelineValue) * 100).toFixed(1)}%
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversion Metrics</Text>
          <View style={styles.infoCard}>
            <View style={styles.conversionRow}>
              <Text style={styles.conversionLabel}>Win Rate</Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${winRate}%`, backgroundColor: colors.green[600] },
                  ]}
                />
              </View>
              <Text style={styles.conversionValue}>{winRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.conversionRow}>
              <Text style={styles.conversionLabel}>Lead to Customer</Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${leadToCustomerRate}%`,
                      backgroundColor: colors.blue[600],
                    },
                  ]}
                />
              </View>
              <Text style={styles.conversionValue}>
                {leadToCustomerRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.infoCard}>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Avg Deal Size</Text>
              <Text style={styles.performanceValue}>
                {formatCurrency(avgDealSize)}
              </Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Total Opportunities</Text>
              <Text style={styles.performanceValue}>{totalOpportunities}</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Total Contacts</Text>
              <Text style={styles.performanceValue}>{totalContacts}</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Total Companies</Text>
              <Text style={styles.performanceValue}>
                {filteredCompanies.length}
              </Text>
            </View>
          </View>
        </View>

        {topOpportunities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Opportunities</Text>
            <View style={styles.infoCard}>
              {topOpportunities.map((opp, index) => (
                <View key={opp.id} style={styles.opportunityRow}>
                  <View style={styles.opportunityInfo}>
                    <View style={styles.opportunityRank}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.opportunityDetails}>
                      <Text style={styles.opportunityTitle}>{opp.title}</Text>
                      <Text style={styles.opportunityStage}>
                        {opp.stage.replace('_', ' ')} • {opp.probability || 0}%
                        probability
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.opportunityAmount}>
                    {formatCurrency(opp.amount || 0)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  timeRangeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timeRangeOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  timeRangeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  timeRangeChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  timeRangeChipText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  timeRangeChipTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '48%',
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
    fontWeight: '600',
    color: colors.text.secondary,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  metricSubtext: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  pipelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pipelineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pipelineStage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  pipelineCount: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  pipelineValue: {
    alignItems: 'flex-end',
  },
  pipelineAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  pipelinePercent: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  conversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  conversionLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    width: 120,
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  conversionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    width: 50,
    textAlign: 'right',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  performanceLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  opportunityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  opportunityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  opportunityRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  opportunityDetails: {
    flex: 1,
  },
  opportunityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  opportunityStage: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  opportunityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
});
