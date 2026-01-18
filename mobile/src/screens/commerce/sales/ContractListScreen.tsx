import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
import SalesService from '@/services/SalesService';
import { Contract, ContractStatus } from '@/models/sales';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ContractListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadContracts();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadContracts();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await SalesService.getContracts(
        {
          status: statusFilter === 'all' ? undefined : statusFilter,
          page: currentPage,
          limit: itemsPerPage,
        },
        currentPage,
        itemsPerPage,
      );
      setContracts(response.contracts || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContracts();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderContractItem = ({ item }: { item: Contract }) => (
    <TouchableOpacity
      style={styles.contractCard}
      onPress={() => navigation.navigate('ContractDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.contractHeader}>
        <View style={styles.contractInfo}>
          <Text style={styles.contractTitle}>{item.title}</Text>
          <Text style={styles.contractNumber}>{item.contractNumber}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.contractDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.contractFooter}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Value:</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.value)}</Text>
        </View>
        <Text style={styles.dates}>
          {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusBadgeStyle = (status: ContractStatus) => {
    const statusColors: Record<ContractStatus, { bg: string; border: string }> = {
      [ContractStatus.DRAFT]: { bg: colors.gray[100], border: colors.gray[500] },
      [ContractStatus.PENDING_SIGNATURE]: { bg: colors.yellow[100], border: colors.yellow[500] },
      [ContractStatus.ACTIVE]: { bg: colors.green[100], border: colors.green[500] },
      [ContractStatus.EXPIRED]: { bg: colors.orange[100], border: colors.orange[500] },
      [ContractStatus.TERMINATED]: { bg: colors.red[100], border: colors.red[500] },
    };
    const color = statusColors[status] || { bg: colors.gray[100], border: colors.gray[500] };
    return { backgroundColor: color.bg, borderColor: color.border };
  };

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contracts..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.text.secondary}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color={colors.primary.main} />
        </TouchableOpacity>
      </View>
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterOptions}>
              {['all', ...Object.values(ContractStatus)].map((status) => (
                <TouchableOpacity
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
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loading && contracts.length > 0) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary.main} />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No contracts found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Contracts"
        rightIcon="add"
        gradient={false}
        onRightPress={() => navigation.navigate('ContractForm' as never)}
      />
      <FlatList
        data={contracts}
        renderItem={renderContractItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
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
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
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
    marginBottom: spacing.sm,
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
  contractCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  contractInfo: {
    flex: 1,
  },
  contractTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  contractNumber: {
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
  contractDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  contractFooter: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  dates: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
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
