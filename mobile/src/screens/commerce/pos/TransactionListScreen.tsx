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
import POSService from '@/services/POSService';
import { POSTransaction, POSTransactionStatus, POSPaymentMethod } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function TransactionListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<POSTransactionStatus | 'all'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<POSPaymentMethod | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 20;

  useEffect(() => {
    loadTransactions();
  }, [currentPage, statusFilter, paymentMethodFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadTransactions();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await POSService.getTransactions(
        {
          status: statusFilter === 'all' ? undefined : statusFilter,
          paymentMethod: paymentMethodFilter === 'all' ? undefined : paymentMethodFilter,
          search: searchTerm || undefined,
        },
        currentPage,
        itemsPerPage,
      );
      setTransactions(response.transactions || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusColor = (status: POSTransactionStatus) => {
    switch (status) {
      case POSTransactionStatus.COMPLETED:
        return colors.green[600];
      case POSTransactionStatus.PENDING:
        return colors.orange[600];
      case POSTransactionStatus.CANCELLED:
        return colors.red[600];
      case POSTransactionStatus.REFUNDED:
        return colors.blue[600];
      default:
        return colors.gray[600];
    }
  };

  const renderTransactionItem = ({ item }: { item: POSTransaction }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => (navigation.navigate as any)('TransactionDetail', { id: item.id })}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionNumber}>#{item.transactionNumber}</Text>
          <Text style={styles.transactionDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cashier:</Text>
          <Text style={styles.detailValue}>{item.cashierName}</Text>
        </View>
        {item.customerName && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer:</Text>
            <Text style={styles.detailValue}>{item.customerName}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment:</Text>
          <Text style={styles.detailValue}>{item.paymentMethod.replace('_', ' ')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items:</Text>
          <Text style={styles.detailValue}>{item.items.length}</Text>
        </View>
      </View>
      <View style={styles.transactionFooter}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
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
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {Object.values(POSTransactionStatus).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Payment:</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[styles.filterChip, paymentMethodFilter === 'all' && styles.filterChipActive]}
              onPress={() => setPaymentMethodFilter('all')}
            >
              <Text style={[styles.filterChipText, paymentMethodFilter === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {Object.values(POSPaymentMethod).map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.filterChip, paymentMethodFilter === method && styles.filterChipActive]}
                onPress={() => setPaymentMethodFilter(method)}
              >
                <Text style={[styles.filterChipText, paymentMethodFilter === method && styles.filterChipTextActive]}>
                  {method.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (loading && transactions.length > 0) {
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
      <Ionicons name="receipt-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No transactions found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header title="Transactions" gradient={false} />
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
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
  filterRow: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  filterChips: {
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
  transactionCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
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
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  transactionDetails: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.green[600],
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
