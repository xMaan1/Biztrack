import React, { useState, useEffect, useCallback } from 'react';
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
import { Warehouse } from '@/models/inventory';

export default function WarehouseListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadWarehouses();
  }, [statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadWarehouses();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getWarehouses();
      let filtered = response.warehouses || [];
      
      if (searchTerm) {
        filtered = filtered.filter(
          (w) =>
            w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.city.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter((w) =>
          statusFilter === 'active' ? w.isActive : !w.isActive,
        );
      }
      
      setWarehouses(filtered);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWarehouses();
    setRefreshing(false);
  };

  const handleDelete = (warehouse: Warehouse) => {
    Alert.alert(
      'Delete Warehouse',
      `Are you sure you want to delete ${warehouse.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await InventoryService.deleteWarehouse(warehouse.id);
              loadWarehouses();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete warehouse');
            }
          },
        },
      ],
    );
  };

  const renderWarehouseItem = ({ item }: { item: Warehouse }) => (
    <Pressable
      style={({ pressed }) => [
        styles.warehouseCard,
        pressed && styles.warehouseCardPressed,
      ]}
      onPress={() => (navigation.navigate as any)('WarehouseDetail', { id: item.id })}
    >
      <View style={styles.warehouseHeader}>
        <View style={styles.warehouseInfo}>
          <Text style={styles.warehouseName}>{item.name}</Text>
          <Text style={styles.warehouseCode}>{item.code}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            item.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
          ]}
        >
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      <View style={styles.warehouseDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {item.city}, {item.state}, {item.country}
          </Text>
        </View>
        {item.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.capacity && (
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              Capacity: {item.capacity} m³
              {item.usedCapacity !== undefined && ` (${item.usedCapacity} used)`}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.warehouseActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => (navigation.navigate as any)('WarehouseForm', { id: item.id })}
        >
          <Ionicons name="create-outline" size={18} color={colors.primary.main} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color={colors.red[600]} />
        </Pressable>
      </View>
    </Pressable>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{warehouses.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.green[600] }]}>
            {warehouses.filter((w) => w.isActive).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.orange[600] }]}>
            {warehouses
              .reduce((sum, w) => sum + (w.capacity || 0), 0)
              .toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Total Capacity</Text>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search warehouses..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.text.secondary}
          />
          {searchTerm.length > 0 && (
            <Pressable
              style={({ pressed }) => pressed && { opacity: 0.7 }}
              onPress={() => setSearchTerm('')}
            >
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.filtersContainer}>
        <View style={styles.filterOptions}>
          {['all', 'active', 'inactive'].map((status) => (
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
                {status}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="business-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No warehouses found</Text>
      <Text style={styles.emptySubtext}>
        {searchTerm || statusFilter !== 'all'
          ? 'Try adjusting your filters'
          : 'Create your first warehouse to get started'}
      </Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Warehouses"
        rightIcon="add"
        gradient={false}
        onRightPress={() => (navigation.navigate as any)('WarehouseForm', {})}
      />
      <FlatList
        data={warehouses}
        renderItem={renderWarehouseItem}
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card.background,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
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
  warehouseCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  warehouseInfo: {
    flex: 1,
  },
  warehouseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  warehouseCode: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: colors.green[100],
    borderColor: colors.green[500],
  },
  statusBadgeInactive: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[500],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  warehouseDetails: {
    marginBottom: spacing.sm,
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
  warehouseActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    padding: spacing.xs,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  warehouseCardPressed: {
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
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
