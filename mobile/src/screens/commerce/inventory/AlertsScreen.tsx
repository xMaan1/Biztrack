import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import InventoryService from '@/services/InventoryService';
import { StockAlert, InventoryDashboardStats } from '@/models/inventory';

export default function AlertsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await InventoryService.getInventoryDashboard();
      setStats(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const filteredAlerts =
    stats?.lowStockAlerts?.filter((alert) => {
      if (filterType === 'all') return true;
      return alert.alertType === filterType;
    }) || [];

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'out_of_stock':
        return <Ionicons name="alert-circle" size={24} color={colors.red[600]} />;
      case 'low_stock':
        return <Ionicons name="warning" size={24} color={colors.orange[600]} />;
      case 'expiry_warning':
        return <Ionicons name="time-outline" size={24} color={colors.yellow[600]} />;
      default:
        return <Ionicons name="alert-circle-outline" size={24} color={colors.gray[600]} />;
    }
  };

  const getAlertBadgeStyle = (alertType: string) => {
    switch (alertType) {
      case 'out_of_stock':
        return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
      case 'low_stock':
        return { backgroundColor: colors.orange[100], borderColor: colors.orange[500] };
      case 'expiry_warning':
        return { backgroundColor: colors.yellow[100], borderColor: colors.yellow[500] };
      default:
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
    }
  };

  const getAlertLabel = (alertType: string) => {
    switch (alertType) {
      case 'out_of_stock':
        return 'Out of Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'expiry_warning':
        return 'Expiry Warning';
      default:
        return 'Alert';
    }
  };

  const renderAlertItem = ({ item }: { item: StockAlert }) => {
    const badgeStyle = getAlertBadgeStyle(item.alertType);
    return (
      <TouchableOpacity
        style={[styles.alertCard, { borderLeftColor: badgeStyle.borderColor }]}
        onPress={() => navigation.navigate('ProductDetail' as never, { id: item.productId } as never)}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertIconContainer}>
            {getAlertIcon(item.alertType)}
          </View>
          <View style={styles.alertInfo}>
            <Text style={styles.alertProductName}>{item.productName}</Text>
            <Text style={styles.alertSku}>SKU: {item.sku}</Text>
            <Text style={styles.alertMessage}>{item.message}</Text>
          </View>
          <View style={[styles.alertBadge, badgeStyle]}>
            <Text style={styles.alertBadgeText}>{getAlertLabel(item.alertType)}</Text>
          </View>
        </View>
        <View style={styles.alertDetails}>
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Current:</Text>
            <Text style={styles.stockValue}>{item.currentStock}</Text>
          </View>
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Minimum:</Text>
            <Text style={styles.stockValue}>{item.minStockLevel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.primary.main} />
          <Text style={styles.statValue}>{stats?.lowStockAlerts?.length || 0}</Text>
          <Text style={styles.statLabel}>Total Alerts</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={24} color={colors.red[600]} />
          <Text style={[styles.statValue, { color: colors.red[600] }]}>
            {stats?.outOfStockProducts || 0}
          </Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="warning-outline" size={24} color={colors.orange[600]} />
          <Text style={[styles.statValue, { color: colors.orange[600] }]}>
            {stats?.lowStockProducts || 0}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
      </View>
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterType === 'all' && styles.filterChipTextActive,
            ]}
          >
            All ({stats?.lowStockAlerts?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'out_of_stock' && styles.filterChipActive,
          ]}
          onPress={() => setFilterType('out_of_stock')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterType === 'out_of_stock' && styles.filterChipTextActive,
            ]}
          >
            Out of Stock ({stats?.outOfStockProducts || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'low_stock' && styles.filterChipActive,
          ]}
          onPress={() => setFilterType('low_stock')}
        >
          <Text
            style={[
              styles.filterChipText,
              filterType === 'low_stock' && styles.filterChipTextActive,
            ]}
          >
            Low Stock ({stats?.lowStockProducts || 0})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle-outline" size={64} color={colors.green[500]} />
      <Text style={styles.emptyText}>No alerts found</Text>
      <Text style={styles.emptySubtext}>
        {filterType === 'all'
          ? 'All inventory items are properly stocked'
          : `No ${filterType.replace('_', ' ')} alerts at the moment`}
      </Text>
    </View>
  );

  if (loading && !stats) {
    return (
      <Container safeArea>
        <Header title="Inventory Alerts" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Inventory Alerts"
        gradient={false}
        rightIcon="refresh"
        onRightPress={loadAlerts}
      />
      <FlatList
        data={filteredAlerts}
        renderItem={renderAlertItem}
        keyExtractor={(item, index) => `${item.productId}-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
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
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.background.default,
  },
  alertCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  alertIconContainer: {
    marginRight: spacing.sm,
  },
  alertInfo: {
    flex: 1,
  },
  alertProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  alertSku: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  alertMessage: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  alertBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  alertDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stockLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'] * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
