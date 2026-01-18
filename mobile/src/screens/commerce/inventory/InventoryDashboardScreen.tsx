import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
import InventoryService from '@/services/InventoryService';
import { InventoryDashboardStats } from '@/models/inventory';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function InventoryDashboardScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await InventoryService.getInventoryDashboard();
      setStats(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  if (loading && !stats) {
    return (
      <Container safeArea>
        <Header title="Inventory Dashboard" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title="Inventory Dashboard" gradient={false} />
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
        {stats && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="cube-outline" size={24} color={colors.blue[600]} />
                <Text style={styles.statValue}>{stats.totalProducts}</Text>
                <Text style={styles.statLabel}>Total Products</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="business-outline" size={24} color={colors.purple[600]} />
                <Text style={styles.statValue}>{stats.totalWarehouses}</Text>
                <Text style={styles.statLabel}>Warehouses</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color={colors.green[600]} />
                <Text style={styles.statValue}>{stats.totalSuppliers}</Text>
                <Text style={styles.statLabel}>Suppliers</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trending-up-outline" size={24} color={colors.orange[600]} />
                <Text style={styles.statValue}>{formatCurrency(stats.totalStockValue)}</Text>
                <Text style={styles.statLabel}>Stock Value</Text>
              </View>
            </View>

            <View style={styles.alertsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.red[600]} />
                <Text style={styles.sectionTitle}>Stock Alerts</Text>
                <Pressable
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('InventoryAlerts' as never)}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary.main} />
                </Pressable>
              </View>
              {stats.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
                <View style={styles.alertsList}>
                  {stats.lowStockAlerts.slice(0, 5).map((alert, index) => (
                    <Pressable
                      key={index}
                      style={styles.alertCard}
                      onPress={() => navigation.navigate('InventoryAlerts' as never)}
                    >
                      <View style={styles.alertHeader}>
                        <Text style={styles.alertProductName}>{alert.productName}</Text>
                        <View
                          style={[
                            styles.alertBadge,
                            alert.alertType === 'out_of_stock'
                              ? styles.alertBadgeDanger
                              : styles.alertBadgeWarning,
                          ]}
                        >
                          <Text style={styles.alertBadgeText}>
                            {alert.currentStock} / {alert.minStockLevel}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.alertSku}>SKU: {alert.sku}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyAlerts}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={colors.green[500]} />
                  <Text style={styles.emptyAlertsText}>No stock alerts</Text>
                  <Text style={styles.emptyAlertsSubtext}>All products are well stocked</Text>
                </View>
              )}
            </View>

            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.quickActionCardPressed,
                  ]}
                  onPress={() => navigation.navigate('InventoryProductList' as never)}
                >
                  <Ionicons name="cube-outline" size={32} color={colors.primary.main} />
                  <Text style={styles.quickActionText}>Products</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.quickActionCardPressed,
                  ]}
                  onPress={() => navigation.navigate('WarehouseList' as never)}
                >
                  <Ionicons name="business-outline" size={32} color={colors.primary.main} />
                  <Text style={styles.quickActionText}>Warehouses</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.quickActionCardPressed,
                  ]}
                  onPress={() => navigation.navigate('StockMovementList' as never)}
                >
                  <Ionicons name="swap-horizontal-outline" size={32} color={colors.primary.main} />
                  <Text style={styles.quickActionText}>Stock Movements</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.quickActionCardPressed,
                  ]}
                  onPress={() => navigation.navigate('PurchaseOrderList' as never)}
                >
                  <Ionicons name="document-text-outline" size={32} color={colors.primary.main} />
                  <Text style={styles.quickActionText}>Purchase Orders</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.quickActionCardPressed,
                  ]}
                  onPress={() => navigation.navigate('ReceivingList' as never)}
                >
                  <Ionicons name="cube-outline" size={32} color={colors.primary.main} />
                  <Text style={styles.quickActionText}>Receiving</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.quickActionCardPressed,
                  ]}
                  onPress={() => navigation.navigate('InventoryAlerts' as never)}
                >
                  <Ionicons name="alert-circle-outline" size={32} color={colors.red[600]} />
                  <Text style={styles.quickActionText}>Alerts</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.quickActionCardPressed,
                  ]}
                  onPress={() => navigation.navigate('CustomerReturns' as never)}
                >
                  <Ionicons name="arrow-back-outline" size={32} color={colors.green[600]} />
                  <Text style={styles.quickActionText}>Customer Returns</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.quickActionCardPressed,
                  ]}
                  onPress={() => navigation.navigate('SupplierReturns' as never)}
                >
                  <Ionicons name="arrow-forward-outline" size={32} color={colors.orange[600]} />
                  <Text style={styles.quickActionText}>Supplier Returns</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.quickActionCardPressed,
                  ]}
                  onPress={() => navigation.navigate('Dumps' as never)}
                >
                  <Ionicons name="trash-outline" size={32} color={colors.red[600]} />
                  <Text style={styles.quickActionText}>Damaged Items</Text>
                </Pressable>
              </View>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  alertsSection: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  alertsList: {
    gap: spacing.sm,
  },
  alertCard: {
    backgroundColor: colors.background.muted,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  alertBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  alertBadgeDanger: {
    backgroundColor: colors.red[100],
    borderWidth: 1,
    borderColor: colors.red[500],
  },
  alertBadgeWarning: {
    backgroundColor: colors.orange[100],
    borderWidth: 1,
    borderColor: colors.orange[500],
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
  },
  alertSku: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  emptyAlerts: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyAlertsText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  emptyAlertsSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  quickActionsSection: {
    marginBottom: spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
    gap: spacing.sm,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  quickActionCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
