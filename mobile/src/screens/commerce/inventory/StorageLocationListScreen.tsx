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
import { StorageLocation, Warehouse } from '@/models/inventory';

export default function StorageLocationListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [warehouseFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locationsResponse, warehousesResponse] = await Promise.all([
        InventoryService.getStorageLocations(),
        InventoryService.getWarehouses(),
      ]);
      
      let filtered = locationsResponse.storageLocations || [];
      
      if (searchTerm) {
        filtered = filtered.filter(
          (l) =>
            l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.code.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }
      
      if (warehouseFilter !== 'all') {
        filtered = filtered.filter((l) => l.warehouseId === warehouseFilter);
      }
      
      setLocations(filtered);
      setWarehouses(warehousesResponse.warehouses || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load storage locations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown';
  };

  const renderLocationItem = ({ item }: { item: StorageLocation }) => (
    <Pressable
      style={({ pressed }) => [
        styles.locationCard,
        pressed && styles.locationCardPressed,
      ]}
      onPress={() => navigation.navigate('StorageLocationDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{item.name}</Text>
          <Text style={styles.locationCode}>{item.code}</Text>
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
      <View style={styles.locationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{getWarehouseName(item.warehouseId)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="layers-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.locationType}</Text>
        </View>
        {item.capacity && (
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {item.usedCapacity || 0} / {item.capacity} m³
            </Text>
          </View>
        )}
      </View>
      <View style={styles.locationActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => navigation.navigate('StorageLocationForm' as never, { id: item.id, storageLocation: item } as never)}
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
              'Delete Storage Location',
              `Are you sure you want to delete ${item.name}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await InventoryService.deleteStorageLocation(item.id);
                      loadData();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete storage location');
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
            placeholder="Search locations..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.text.secondary}
          />
        </View>
      </View>
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Warehouse:</Text>
        <View style={styles.filterOptions}>
          <Pressable
            style={({ pressed }) => [
              styles.filterChip,
              warehouseFilter === 'all' && styles.filterChipActive,
              pressed && styles.filterChipPressed,
            ]}
            onPress={() => setWarehouseFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                warehouseFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          {warehouses.map((warehouse) => (
            <Pressable
              key={warehouse.id}
              style={({ pressed }) => [
                styles.filterChip,
                warehouseFilter === warehouse.id && styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => setWarehouseFilter(warehouse.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  warehouseFilter === warehouse.id && styles.filterChipTextActive,
                ]}
              >
                {warehouse.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="map-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No storage locations found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Storage Locations"
        rightIcon="add"
        gradient={false}
        onRightPress={() => navigation.navigate('StorageLocationForm' as never, {} as never)}
      />
      <FlatList
        data={locations}
        renderItem={renderLocationItem}
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
  },
  filterChipTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  locationCode: {
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
  locationDetails: {
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
  locationActions: {
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
  locationCardPressed: {
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
