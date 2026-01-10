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
import { Quote, QuoteStatus } from '@/models/sales';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function QuoteListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadQuotes();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadQuotes();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      console.log('[QuoteListScreen] Loading quotes with filters:', {
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: currentPage,
        limit: itemsPerPage,
      });
      
      const response = await SalesService.getQuotes(
        {
          status: statusFilter === 'all' ? undefined : statusFilter,
          page: currentPage,
          limit: itemsPerPage,
        },
        currentPage,
        itemsPerPage,
      );
      
      console.log('[QuoteListScreen] Quotes loaded successfully:', {
        count: response.quotes?.length || 0,
        pagination: response.pagination,
      });
      
      setQuotes(response.quotes || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      console.error('[QuoteListScreen] Error loading quotes - Message:', error.message || 'Unknown error');
      console.error('[QuoteListScreen] Error loading quotes - Status:', error.response?.status);
      console.error('[QuoteListScreen] Error loading quotes - StatusText:', error.response?.statusText);
      console.error('[QuoteListScreen] Error loading quotes - Response Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[QuoteListScreen] Error loading quotes - URL:', error.config?.url);
      console.error('[QuoteListScreen] Error loading quotes - Method:', error.config?.method);
      console.error('[QuoteListScreen] Error loading quotes - Full Error Object:', error);
      
      if (error.response?.data) {
        console.error('[QuoteListScreen] Error Response Data:', error.response.data);
        if (error.response.data.detail) {
          console.error('[QuoteListScreen] Error Detail:', error.response.data.detail);
        }
        if (error.response.data.message) {
          console.error('[QuoteListScreen] Error Message:', error.response.data.message);
        }
        if (error.response.data.error) {
          console.error('[QuoteListScreen] Error:', error.response.data.error);
        }
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load quotes';
      const errorDetails = error.response?.data?.detail || error.response?.data?.error || '';
      
      Alert.alert(
        'Error',
        `${errorMessage}${errorDetails ? `\n\nDetails: ${errorDetails}` : ''}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuotes();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderQuoteItem = ({ item }: { item: Quote }) => (
    <TouchableOpacity
      style={styles.quoteCard}
      onPress={() => navigation.navigate('QuoteDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.quoteHeader}>
        <View style={styles.quoteInfo}>
          <Text style={styles.quoteTitle}>{item.title}</Text>
          <Text style={styles.quoteNumber}>{item.quoteNumber}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.quoteDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.quoteFooter}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total:</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(item.total || item.amount || 0)}
          </Text>
        </View>
        <Text style={styles.validUntil}>
          Valid until: {new Date(item.validUntil).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusBadgeStyle = (status: QuoteStatus) => {
    const statusColors: Record<QuoteStatus, { bg: string; border: string }> = {
      [QuoteStatus.DRAFT]: { bg: colors.gray[100], border: colors.gray[500] },
      [QuoteStatus.SENT]: { bg: colors.blue[100], border: colors.blue[500] },
      [QuoteStatus.VIEWED]: { bg: colors.yellow[100], border: colors.yellow[500] },
      [QuoteStatus.ACCEPTED]: { bg: colors.green[100], border: colors.green[500] },
      [QuoteStatus.REJECTED]: { bg: colors.red[100], border: colors.red[500] },
      [QuoteStatus.EXPIRED]: { bg: colors.orange[100], border: colors.orange[500] },
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
            placeholder="Search quotes..."
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
              {['all', ...Object.values(QuoteStatus)].map((status) => (
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
                    {status}
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
    if (loading && quotes.length > 0) {
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
      <Text style={styles.emptyText}>No quotes found</Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Quotes"
        rightIcon="add"
        onRightPress={() => navigation.navigate('QuoteForm' as never, {} as never)}
        gradient={false}
      />
      <FlatList
        data={quotes}
        renderItem={renderQuoteItem}
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
  quoteCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  quoteInfo: {
    flex: 1,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  quoteNumber: {
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
  quoteDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  quoteFooter: {
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
  validUntil: {
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
