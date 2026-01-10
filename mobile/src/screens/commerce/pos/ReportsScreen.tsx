import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import POSService from '@/services/POSService';
import { POSPaymentMethod } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'shifts'>('sales');
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [salesReport, setSalesReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);
  const [shiftsReport, setShiftsReport] = useState<any>(null);

  useEffect(() => {
    loadReport();
  }, [activeTab, dateFrom, dateTo, paymentMethod, category, lowStockOnly]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const report = await POSService.getSalesReport({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
        });
        setSalesReport(report);
      } else if (activeTab === 'inventory') {
        const report = await POSService.getInventoryReport({
          category: category !== 'all' ? category : undefined,
          lowStockOnly: lowStockOnly || undefined,
        });
        setInventoryReport(report);
      } else if (activeTab === 'shifts') {
        const report = await POSService.getShiftsReport({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        setShiftsReport(report);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPaymentMethod('all');
    setCategory('all');
    setLowStockOnly(false);
  };

  const renderSalesReport = () => {
    if (!salesReport) return null;

    return (
      <View style={styles.reportContent}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Sales</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(salesReport.summary?.totalSales || 0)}
            </Text>
            <Text style={styles.metricSubtext}>
              {salesReport.summary?.totalTransactions || 0} transactions
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg Transaction</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(salesReport.summary?.averageTransaction || 0)}
            </Text>
          </View>
        </View>

        {salesReport.paymentMethods && Object.keys(salesReport.paymentMethods).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <View style={styles.formCard}>
              {Object.entries(salesReport.paymentMethods).map(([method, data]: [string, any]) => (
                <View key={method} style={styles.paymentMethodRow}>
                  <Text style={styles.paymentMethodName}>{method.replace('_', ' ')}</Text>
                  <View style={styles.paymentMethodDetails}>
                    <Text style={styles.paymentMethodCount}>{data.count} transactions</Text>
                    <Text style={styles.paymentMethodTotal}>{formatCurrency(data.total)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderInventoryReport = () => {
    if (!inventoryReport) return null;

    return (
      <View style={styles.reportContent}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Products</Text>
            <Text style={styles.metricValue}>
              {inventoryReport.summary?.totalProducts || 0}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Value</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(inventoryReport.summary?.totalInventoryValue || 0)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Low Stock</Text>
            <Text style={[styles.metricValue, { color: colors.orange[600] }]}>
              {inventoryReport.summary?.lowStockItems || 0}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Out of Stock</Text>
            <Text style={[styles.metricValue, { color: colors.red[600] }]}>
              {inventoryReport.summary?.outOfStockItems || 0}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderShiftsReport = () => {
    if (!shiftsReport) return null;

    return (
      <View style={styles.reportContent}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Shifts</Text>
            <Text style={styles.metricValue}>
              {shiftsReport.summary?.totalShifts || 0}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Open Shifts</Text>
            <Text style={[styles.metricValue, { color: colors.green[600] }]}>
              {shiftsReport.summary?.openShifts || 0}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Sales</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(shiftsReport.summary?.totalSales || 0)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Transactions</Text>
            <Text style={styles.metricValue}>
              {shiftsReport.summary?.totalTransactions || 0}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Container safeArea>
      <Header title="POS Reports" gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sales' && styles.tabActive]}
            onPress={() => setActiveTab('sales')}
          >
            <Ionicons
              name="trending-up"
              size={20}
              color={activeTab === 'sales' ? colors.background.default : colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>
              Sales
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'inventory' && styles.tabActive]}
            onPress={() => setActiveTab('inventory')}
          >
            <Ionicons
              name="cube"
              size={20}
              color={activeTab === 'inventory' ? colors.background.default : colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.tabTextActive]}>
              Inventory
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'shifts' && styles.tabActive]}
            onPress={() => setActiveTab('shifts')}
          >
            <Ionicons
              name="time"
              size={20}
              color={activeTab === 'shifts' ? colors.background.default : colors.text.secondary}
            />
            <Text style={[styles.tabText, activeTab === 'shifts' && styles.tabTextActive]}>
              Shifts
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <View style={styles.filterInput}>
              <Text style={styles.filterLabel}>From Date</Text>
              <TextInput
                style={styles.input}
                value={dateFrom}
                onChangeText={setDateFrom}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.filterInput}>
              <Text style={styles.filterLabel}>To Date</Text>
              <TextInput
                style={styles.input}
                value={dateTo}
                onChangeText={setDateTo}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>

          {activeTab === 'sales' && (
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Payment Method</Text>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[styles.filterChip, paymentMethod === 'all' && styles.filterChipActive]}
                  onPress={() => setPaymentMethod('all')}
                >
                  <Text style={[styles.filterChipText, paymentMethod === 'all' && styles.filterChipTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {Object.values(POSPaymentMethod).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[styles.filterChip, paymentMethod === method && styles.filterChipActive]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text style={[styles.filterChipText, paymentMethod === method && styles.filterChipTextActive]}>
                      {method.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'inventory' && (
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.toggleFilter, lowStockOnly && styles.toggleFilterActive]}
                onPress={() => setLowStockOnly(!lowStockOnly)}
              >
                <Ionicons
                  name={lowStockOnly ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={lowStockOnly ? colors.background.default : colors.text.secondary}
                />
                <Text style={[styles.toggleFilterText, lowStockOnly && styles.toggleFilterTextActive]}>
                  Low Stock Only
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.main} />
          </View>
        ) : (
          <>
            {activeTab === 'sales' && renderSalesReport()}
            {activeTab === 'inventory' && renderInventoryReport()}
            {activeTab === 'shifts' && renderShiftsReport()}
          </>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary.main,
  },
  tabText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.background.default,
  },
  filtersContainer: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  filterInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  toggleFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  toggleFilterActive: {
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  toggleFilterText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  toggleFilterTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  clearButton: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  loadingContainer: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  reportContent: {
    gap: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: '47%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  metricSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  formCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  paymentMethodDetails: {
    alignItems: 'flex-end',
  },
  paymentMethodCount: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  paymentMethodTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.green[600],
  },
});
