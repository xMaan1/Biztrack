import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import InventoryService from '@/services/InventoryService';
import { PurchaseOrder, PurchaseOrderStatus } from '@/models/inventory';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function PurchaseOrderListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadOrders();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getPurchaseOrders();
      let filtered = response.purchaseOrders || [];
      
      if (searchTerm) {
        filtered = filtered.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.supplierName.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter((o) => o.status === statusFilter);
      }
      
      setOrders(filtered);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusBadgeStyle = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.APPROVED:
      case PurchaseOrderStatus.RECEIVED:
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case PurchaseOrderStatus.CANCELLED:
        return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
      default:
        return { backgroundColor: colors.blue[100], borderColor: colors.blue[500] };
    }
  };

  const renderOrderItem = ({ item }: { item: PurchaseOrder }) => (
    <Pressable
      style={({ pressed }) => [
        styles.orderCard,
        pressed && styles.orderCardPressed,
      ]}
      onPress={() => navigation.navigate('PurchaseOrderDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.supplierName}>{item.supplierName}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            Expected: {new Date(item.expectedDeliveryDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{formatCurrency(item.totalAmount)}</Text>
        </View>
      </View>
      <View style={styles.orderActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => navigation.navigate('PurchaseOrderForm' as never, { id: item.id, order: item } as never)}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary.main} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => {
            Alert.alert(
              'Delete Purchase Order',
              `Are you sure you want to delete ${item.orderNumber}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await InventoryService.deletePurchaseOrder(item.id);
                      loadOrders();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete purchase order');
                    }
                  },
                },
              ],
            );
          }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.red[600]} />
        </Pressable>
      </View>
    </Pressable>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.text.secondary}
          />
        </View>
      </View>
      <View style={styles.filtersContainer}>
        <View style={styles.filterOptions}>
          {['all', PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.RECEIVED].map((status) => (
            <Pressable
              key={status}
              style={({ pressed }) => [
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive,
                ]}
              >
                {status === 'all' ? 'All' : status}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No purchase orders found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Purchase Orders"
        rightIcon="add"
        gradient={false}
        onRightPress={() => navigation.navigate('PurchaseOrderForm' as never, {} as never)}
      />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
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
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text.primary,
  },
  filtersContainer: {
    marginBottom: spacing.md,
  },
  filterOptions: {
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
  orderCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  supplierName: {
    fontSize: 14,
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
    textTransform: 'capitalize',
  },
  orderDetails: {
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  orderCardPressed: {
    opacity: 0.9,
  },
  filterChipPressed: {
    opacity: 0.8,
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
});
