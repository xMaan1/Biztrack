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
import InvoiceService from '@/services/InvoiceService';
import { Invoice, InvoiceStatus } from '@/models/sales';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function InvoiceListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadInvoices();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadInvoices();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await InvoiceService.getInvoices(
        {
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchTerm || undefined,
        },
        currentPage,
        itemsPerPage,
      );
      setInvoices(response.invoices || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.invoiceCard}
      onPress={() => navigation.navigate('InvoiceDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusText}>{InvoiceService.getStatusLabel(item.status)}</Text>
        </View>
      </View>
      <View style={styles.invoiceFooter}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total:</Text>
          <Text style={styles.amountValue}>{formatCurrency(item.total)}</Text>
        </View>
        <View style={styles.datesRow}>
          <Text style={styles.dateText}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
          {item.balance > 0 && (
            <Text style={styles.balanceText}>
              Balance: {formatCurrency(item.balance)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusBadgeStyle = (status: InvoiceStatus) => {
    const statusColors: Record<InvoiceStatus, { bg: string; border: string }> = {
      [InvoiceStatus.DRAFT]: { bg: colors.gray[100], border: colors.gray[500] },
      [InvoiceStatus.SENT]: { bg: colors.blue[100], border: colors.blue[500] },
      [InvoiceStatus.VIEWED]: { bg: colors.yellow[100], border: colors.yellow[500] },
      [InvoiceStatus.PAID]: { bg: colors.green[100], border: colors.green[500] },
      [InvoiceStatus.PARTIALLY_PAID]: { bg: colors.orange[100], border: colors.orange[500] },
      [InvoiceStatus.OVERDUE]: { bg: colors.red[100], border: colors.red[500] },
      [InvoiceStatus.CANCELLED]: { bg: colors.red[100], border: colors.red[500] },
      [InvoiceStatus.VOID]: { bg: colors.gray[100], border: colors.gray[500] },
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
            placeholder="Search invoices..."
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
              {['all', ...Object.values(InvoiceStatus)].map((status) => (
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
                    {InvoiceService.getStatusLabel(status)}
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
    if (loading && invoices.length > 0) {
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
      <Text style={styles.emptyText}>No invoices found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Invoices"
        rightIcon="add"
        gradient={false}
        onRightPress={() => navigation.navigate('InvoiceForm' as never, {} as never)}
      />
      <FlatList
        data={invoices}
        renderItem={renderInvoiceItem}
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
  invoiceCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontFamily: 'monospace',
  },
  customerName: {
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
  },
  invoiceFooter: {
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
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.red[600],
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
