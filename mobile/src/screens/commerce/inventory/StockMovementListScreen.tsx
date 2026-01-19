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
import { StockMovement, StockMovementType } from '@/models/inventory';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function StockMovementListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { getCurrencySymbol } = useCurrency();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadMovements();
  }, [typeFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadMovements();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getStockMovements();
      let filtered = response.stockMovements || [];
      
      if (searchTerm) {
        filtered = filtered.filter(
          (m) =>
            m.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }
      
      if (typeFilter !== 'all') {
        filtered = filtered.filter((m) => m.movementType === typeFilter);
      }
      
      setMovements(filtered);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMovements();
    setRefreshing(false);
  };

  const getTypeBadgeStyle = (type: StockMovementType) => {
    switch (type) {
      case StockMovementType.INBOUND:
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case StockMovementType.OUTBOUND:
        return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
      case StockMovementType.TRANSFER:
        return { backgroundColor: colors.blue[100], borderColor: colors.blue[500] };
      default:
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
    }
  };

  const getTypeLabel = (type: StockMovementType) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderMovementItem = ({ item }: { item: StockMovement }) => (
    <Pressable
      style={({ pressed }) => [
        styles.movementCard,
        pressed && styles.movementCardPressed,
      ]}
      onPress={() => (navigation.navigate as any)('StockMovementDetail', { id: item.id })}
    >
      <View style={styles.movementHeader}>
        <View style={styles.movementInfo}>
          <Text style={styles.movementType}>
            {getTypeLabel(item.movementType)}
          </Text>
          {item.referenceNumber && (
            <Text style={styles.referenceNumber}>Ref: {item.referenceNumber}</Text>
          )}
        </View>
        <View style={[styles.typeBadge, getTypeBadgeStyle(item.movementType)]}>
          <Text style={styles.typeBadgeText}>{getTypeLabel(item.movementType)}</Text>
        </View>
      </View>
      <View style={styles.movementDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>Product: {item.productId}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="swap-horizontal-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            Cost: {getCurrencySymbol()}{item.unitCost.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.movementActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => (navigation.navigate as any)('StockMovementForm', { id: item.id, movement: item })}
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
              'Delete Stock Movement',
              'Are you sure you want to delete this stock movement?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await InventoryService.deleteStockMovement(item.id);
                      loadMovements();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete stock movement');
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
            placeholder="Search movements..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.text.secondary}
          />
        </View>
      </View>
      <View style={styles.filtersContainer}>
        <View style={styles.filterOptions}>
          {['all', StockMovementType.INBOUND, StockMovementType.OUTBOUND, StockMovementType.TRANSFER].map((type) => (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.filterChip,
                typeFilter === type && styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => setTypeFilter(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  typeFilter === type && styles.filterChipTextActive,
                ]}
              >
                {type === 'all' ? 'All' : getTypeLabel(type as StockMovementType)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="swap-horizontal-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No stock movements found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Stock Movements"
        rightIcon="add"
        gradient={false}
        onRightPress={() => (navigation.navigate as any)('StockMovementForm', {})}
      />
      <FlatList
        data={movements}
        renderItem={renderMovementItem}
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
  movementCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  movementInfo: {
    flex: 1,
  },
  movementType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  referenceNumber: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  movementDetails: {
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
  movementActions: {
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
  movementCardPressed: {
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
