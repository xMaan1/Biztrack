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
import { StockMovement, StockMovementStatus } from '@/models/inventory';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function SupplierReturnsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [returns, setReturns] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadReturns();
  }, [statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadReturns();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getSupplierReturns();
      let filtered = response.stockMovements || [];
      
      if (searchTerm) {
        filtered = filtered.filter(
          (r) =>
            r.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.productSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter((r) => r.status === statusFilter);
      }
      
      setReturns(filtered);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load supplier returns');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReturns();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Return',
      'Are you sure you want to delete this supplier return?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await InventoryService.deleteStockMovement(id);
              loadReturns();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete return');
            }
          },
        },
      ],
    );
  };

  const getStatusBadgeStyle = (status: StockMovementStatus) => {
    const statusColors: Record<StockMovementStatus, { bg: string; border: string }> = {
      [StockMovementStatus.PENDING]: { bg: colors.yellow[100], border: colors.yellow[500] },
      [StockMovementStatus.IN_PROGRESS]: { bg: colors.blue[100], border: colors.blue[500] },
      [StockMovementStatus.COMPLETED]: { bg: colors.green[100], border: colors.green[500] },
      [StockMovementStatus.CANCELLED]: { bg: colors.red[100], border: colors.red[500] },
      [StockMovementStatus.FAILED]: { bg: colors.gray[100], border: colors.gray[500] },
    };
    const color = statusColors[status] || { bg: colors.gray[100], border: colors.gray[500] };
    return { backgroundColor: color.bg, borderColor: color.border };
  };

  const renderReturnItem = ({ item }: { item: StockMovement }) => (
    <Pressable
      style={({ pressed }) => [
        styles.returnCard,
        pressed && styles.returnCardPressed,
      ]}
      onPress={() => navigation.navigate('StockMovementDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.returnHeader}>
        <View style={styles.returnInfo}>
          <Text style={styles.productName}>{item.productName || 'Unknown Product'}</Text>
          <Text style={styles.productSku}>SKU: {item.productSku || item.productId}</Text>
          {item.referenceNumber && (
            <Text style={styles.referenceNumber}>Ref: {item.referenceNumber}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <View style={styles.returnDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="arrow-forward-outline" size={16} color={colors.orange[600]} />
          <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            Credit Value: {formatCurrency(item.quantity * item.unitCost)}
          </Text>
        </View>
        {item.notes && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText} numberOfLines={2}>{item.notes}</Text>
          </View>
        )}
      </View>
      <View style={styles.returnActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => navigation.navigate('StockMovementForm' as never, { id: item.id, movement: item } as never)}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary.main} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => handleDelete(item.id)}
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
            placeholder="Search returns..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.text.secondary}
          />
          {searchTerm.length > 0 && (
            <Pressable onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.filterOptions}>
          <Pressable
            style={[
              styles.filterChip,
              statusFilter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          {Object.values(StockMovementStatus).map((status) => (
            <Pressable
              key={status}
              style={[
                styles.filterChip,
                statusFilter === status && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === status && styles.filterChipTextActive,
                ]}
              >
                {status.replace('_', ' ')}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{returns.length}</Text>
          <Text style={styles.statLabel}>Total Returns</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.orange[600] }]}>
            {formatCurrency(returns.reduce((sum, r) => sum + r.quantity * r.unitCost, 0))}
          </Text>
          <Text style={styles.statLabel}>Total Credit Value</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="arrow-forward-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No supplier returns found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Supplier Returns"
        gradient={false}
        rightIcon="add"
        onRightPress={() => navigation.navigate('StockMovementForm' as never, {
          movement: {
            movementType: 'return',
            referenceType: 'supplier_return',
          },
        } as never)}
      />
      <FlatList
        data={returns}
        renderItem={renderReturnItem}
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
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
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
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: colors.background.default,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  returnCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  returnCardPressed: {
    opacity: 0.7,
  },
  returnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  returnInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  productSku: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  referenceNumber: {
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
    textTransform: 'capitalize',
  },
  returnDetails: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  returnActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  actionButtonPressed: {
    opacity: 0.7,
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
