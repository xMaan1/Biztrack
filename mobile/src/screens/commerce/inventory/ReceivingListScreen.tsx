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
import { Receiving, ReceivingStatus } from '@/models/inventory';

export default function ReceivingListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [receivings, setReceivings] = useState<Receiving[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadReceivings();
  }, [statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadReceivings();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadReceivings = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getReceivings();
      let filtered = response.receivings || [];
      
      if (searchTerm) {
        filtered = filtered.filter(
          (r) =>
            r.receivingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter((r) => r.status === statusFilter);
      }
      
      setReceivings(filtered);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load receivings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReceivings();
    setRefreshing(false);
  };

  const getStatusBadgeStyle = (status: ReceivingStatus) => {
    switch (status) {
      case ReceivingStatus.COMPLETED:
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case ReceivingStatus.CANCELLED:
        return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
      default:
        return { backgroundColor: colors.blue[100], borderColor: colors.blue[500] };
    }
  };

  const renderReceivingItem = ({ item }: { item: Receiving }) => (
    <Pressable
      style={({ pressed }) => [
        styles.receivingCard,
        pressed && styles.receivingCardPressed,
      ]}
      onPress={() => navigation.navigate('ReceivingDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.receivingHeader}>
        <View style={styles.receivingInfo}>
          <Text style={styles.receivingNumber}>{item.receivingNumber}</Text>
          <Text style={styles.purchaseOrderId}>PO: {item.purchaseOrderId}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.receivingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {new Date(item.receivedDate).toLocaleDateString()}
          </Text>
        </View>
        {item.items && item.items.length > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.items.length} items</Text>
          </View>
        )}
      </View>
      <View style={styles.receivingActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => navigation.navigate('ReceivingForm' as never, { id: item.id, receiving: item } as never)}
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
              'Delete Receiving',
              `Are you sure you want to delete ${item.receivingNumber}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await InventoryService.deleteReceiving(item.id);
                      loadReceivings();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete receiving');
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
            placeholder="Search receivings..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.text.secondary}
          />
        </View>
      </View>
      <View style={styles.filtersContainer}>
        <View style={styles.filterOptions}>
          {['all', ReceivingStatus.PENDING, ReceivingStatus.COMPLETED, ReceivingStatus.CANCELLED].map((status) => (
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
      <Ionicons name="cube-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No receivings found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Receiving"
        rightIcon="add"
        gradient={false}
        onRightPress={() => navigation.navigate('ReceivingForm' as never, {} as never)}
      />
      <FlatList
        data={receivings}
        renderItem={renderReceivingItem}
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
  receivingCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  receivingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  receivingInfo: {
    flex: 1,
  },
  receivingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  purchaseOrderId: {
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
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  receivingDetails: {
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
  receivingCardPressed: {
    opacity: 0.9,
  },
  receivingActions: {
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
