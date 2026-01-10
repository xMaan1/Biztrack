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
import POSService from '@/services/POSService';
import { POSDashboard, POSShift, POSShiftStatus } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function POSDashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [dashboard, setDashboard] = useState<POSDashboard | null>(null);
  const [openShift, setOpenShift] = useState<POSShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
    checkOpenShift();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await POSService.getDashboard();
      setDashboard(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const checkOpenShift = async () => {
    try {
      const shift = await POSService.getCurrentOpenShift();
      setOpenShift(shift);
    } catch (error) {
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDashboard(), checkOpenShift()]);
    setRefreshing(false);
  };

  const handleOpenShift = async () => {
    try {
      setShiftLoading(true);
      const shift = await POSService.createShift({
        openingBalance: 0,
        notes: 'Shift opened from mobile',
      });
      setOpenShift(shift);
      Alert.alert('Success', 'Shift opened successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open shift');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!openShift) return;

    Alert.alert(
      'Close Shift',
      'Are you sure you want to close this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              setShiftLoading(true);
              await POSService.updateShift(openShift.id, {
                status: POSShiftStatus.CLOSED,
                closingBalance: openShift.openingBalance + openShift.totalSales,
                notes: 'Shift closed from mobile',
              });
              setOpenShift(null);
              await loadDashboard();
              Alert.alert('Success', 'Shift closed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to close shift');
            } finally {
              setShiftLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !dashboard) {
    return (
      <Container safeArea>
        <Header title="POS Dashboard" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title="POS Dashboard" gradient={false} />
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
        <View style={styles.shiftSection}>
          <View style={styles.shiftCard}>
            {openShift ? (
              <View style={styles.shiftInfo}>
                <View style={styles.shiftStatus}>
                  <View style={[styles.statusDot, { backgroundColor: colors.green[500] }]} />
                  <Text style={styles.shiftStatusText}>Shift Open</Text>
                </View>
                <Text style={styles.shiftNumber}>#{openShift.shiftNumber}</Text>
                <TouchableOpacity
                  style={styles.closeShiftButton}
                  onPress={handleCloseShift}
                  disabled={shiftLoading}
                >
                  {shiftLoading ? (
                    <ActivityIndicator size="small" color={colors.background.default} />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color={colors.background.default} />
                      <Text style={styles.closeShiftText}>Close Shift</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.shiftInfo}>
                <Text style={styles.noShiftText}>No open shift</Text>
                <TouchableOpacity
                  style={styles.openShiftButton}
                  onPress={handleOpenShift}
                  disabled={shiftLoading}
                >
                  {shiftLoading ? (
                    <ActivityIndicator size="small" color={colors.background.default} />
                  ) : (
                    <>
                      <Ionicons name="play-circle" size={20} color={colors.background.default} />
                      <Text style={styles.openShiftText}>Open Shift</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${colors.blue[600]}20` }]}>
                <Ionicons name="cash" size={24} color={colors.blue[600]} />
              </View>
              <Text style={styles.metricValue}>
                {formatCurrency(dashboard?.metrics?.totalSales || 0)}
              </Text>
              <Text style={styles.metricLabel}>Total Sales</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${colors.green[600]}20` }]}>
                <Ionicons name="receipt" size={24} color={colors.green[600]} />
              </View>
              <Text style={styles.metricValue}>
                {dashboard?.metrics?.totalTransactions || 0}
              </Text>
              <Text style={styles.metricLabel}>Transactions</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${colors.purple[600]}20` }]}>
                <Ionicons name="trending-up" size={24} color={colors.purple[600]} />
              </View>
              <Text style={styles.metricValue}>
                {formatCurrency(dashboard?.metrics?.averageTransactionValue || 0)}
              </Text>
              <Text style={styles.metricLabel}>Avg Transaction</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${colors.orange[600]}20` }]}>
                <Ionicons name="warning" size={24} color={colors.orange[600]} />
              </View>
              <Text style={styles.metricValue}>
                {dashboard?.lowStockProducts?.length || 0}
              </Text>
              <Text style={styles.metricLabel}>Low Stock</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('POSSale' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${colors.primary.main}20` }]}>
                <Ionicons name="add-circle" size={32} color={colors.primary.main} />
              </View>
              <Text style={styles.actionText}>New Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ProductList' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${colors.blue[600]}20` }]}>
                <Ionicons name="cube" size={32} color={colors.blue[600]} />
              </View>
              <Text style={styles.actionText}>Products</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('TransactionList' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${colors.green[600]}20` }]}>
                <Ionicons name="receipt" size={32} color={colors.green[600]} />
              </View>
              <Text style={styles.actionText}>Transactions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ShiftList' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${colors.purple[600]}20` }]}>
                <Ionicons name="time" size={32} color={colors.purple[600]} />
              </View>
              <Text style={styles.actionText}>Shifts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Reports' as never)}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${colors.orange[600]}20` }]}>
                <Ionicons name="bar-chart" size={32} color={colors.orange[600]} />
              </View>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {dashboard.recentTransactions.slice(0, 5).map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionCard}
                onPress={() => navigation.navigate('TransactionDetail' as never, { id: transaction.id } as never)}
              >
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionNumber}>#{transaction.transactionNumber}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.transactionTotal}>
                  {formatCurrency(transaction.total)}
                </Text>
              </TouchableOpacity>
            ))}
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
  shiftSection: {
    marginBottom: spacing.lg,
  },
  shiftCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  shiftInfo: {
    alignItems: 'center',
  },
  shiftStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shiftStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.green[600],
  },
  shiftNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  noShiftText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  openShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  openShiftText: {
    color: colors.background.default,
    fontWeight: '600',
    fontSize: 14,
  },
  closeShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  closeShiftText: {
    color: colors.background.default,
    fontWeight: '600',
    fontSize: 14,
  },
  metricsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
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
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  quickActionsSection: {
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionCard: {
    width: '30%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: spacing.lg,
  },
  transactionCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.card.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  transactionTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.green[600],
  },
});
