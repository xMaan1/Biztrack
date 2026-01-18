import React, { useState, useEffect, useCallback } from 'react';
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
import MedicalSupplyService from '@/services/MedicalSupplyService';
import { MedicalSupply, MedicalSupplyStats } from '@/models/healthcare';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function SupplyListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [supplies, setSupplies] = useState<MedicalSupply[]>([]);
  const [stats, setStats] = useState<MedicalSupplyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockFilter, setLowStockFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'Medication',
    'Equipment',
    'Supplies',
    'Instruments',
    'Disposables',
    'Diagnostic',
    'Other',
  ];

  const itemsPerPage = 20;

  useEffect(() => {
    loadSupplies();
    loadStats();
  }, [currentPage, categoryFilter, lowStockFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1);
        loadSupplies();
      } else if (searchTerm === '') {
        setCurrentPage(1);
        loadSupplies();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadSupplies = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await MedicalSupplyService.getMedicalSupplies(
        skip,
        itemsPerPage,
        searchTerm || undefined,
        categoryFilter === 'all' ? undefined : categoryFilter,
        lowStockFilter,
      );
      const suppliesData = response.supplies || response;
      setSupplies(suppliesData);
      setTotalPages(Math.ceil((response.total || suppliesData.length) / itemsPerPage));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load medical supplies');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await MedicalSupplyService.getMedicalSupplyStats();
      setStats(statsData);
    } catch (error) {
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSupplies(), loadStats()]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const isLowStock = (supply: MedicalSupply) => {
    return supply.stockQuantity <= supply.minStockLevel;
  };

  const isExpiringSoon = (supply: MedicalSupply) => {
    if (!supply.expiryDate) return false;
    const expiryDate = new Date(supply.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (supply: MedicalSupply) => {
    if (!supply.expiryDate) return false;
    const expiryDate = new Date(supply.expiryDate);
    const today = new Date();
    return expiryDate < today;
  };

  const getStockBadgeStyle = (supply: MedicalSupply) => {
    if (isExpired(supply)) {
      return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
    }
    if (isExpiringSoon(supply)) {
      return { backgroundColor: colors.orange[100], borderColor: colors.orange[500] };
    }
    if (isLowStock(supply)) {
      return { backgroundColor: colors.yellow[100], borderColor: colors.yellow[500] };
    }
    return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
  };

  const getStockBadgeText = (supply: MedicalSupply) => {
    if (isExpired(supply)) return 'Expired';
    if (isExpiringSoon(supply)) return 'Expiring Soon';
    if (isLowStock(supply)) return 'Low Stock';
    return 'In Stock';
  };

  const renderSupplyItem = ({ item }: { item: MedicalSupply }) => (
    <TouchableOpacity
      style={styles.supplyCard}
      onPress={() => navigation.navigate('SupplyDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.supplyHeader}>
        <View style={styles.supplyInfo}>
          <Text style={styles.supplyName}>{item.name}</Text>
          <Text style={styles.supplyId}>{item.supplyId}</Text>
        </View>
        <View style={[styles.statusBadge, getStockBadgeStyle(item)]}>
          <Text style={styles.statusText}>{getStockBadgeText(item)}</Text>
        </View>
      </View>
      <View style={styles.supplyDetails}>
        {item.category && (
          <View style={styles.detailRow}>
            <Ionicons name="pricetag-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.category}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {item.stockQuantity} {item.unit || 'units'}
          </Text>
        </View>
        {item.minStockLevel !== undefined && (
          <View style={styles.detailRow}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>Min: {item.minStockLevel}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{formatCurrency(item.unitPrice)}</Text>
        </View>
        {item.expiryDate && (
          <View style={styles.detailRow}>
            <Ionicons
              name={isExpired(item) ? 'warning' : 'calendar-outline'}
              size={16}
              color={isExpired(item) ? colors.red[500] : colors.text.secondary}
            />
            <Text
              style={[
                styles.detailText,
                isExpired(item) && { color: colors.red[500], fontWeight: '600' },
              ]}
            >
              Expires: {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        )}
        {item.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.red[600] }]}>
              {stats.lowStock}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.green[600] }]}>
              {formatCurrency(stats.totalValue)}
            </Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Object.keys(stats.byCategory).length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      )}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search supplies..."
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
            <Text style={styles.filterLabel}>Category:</Text>
            <View style={styles.filterOptions}>
              {['all', ...categories].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    categoryFilter === category && styles.filterChipActive,
                  ]}
                  onPress={() => setCategoryFilter(category)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      categoryFilter === category && styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Stock:</Text>
            <View style={styles.filterOptions}>
              {['all', 'low', 'normal'].map((stock) => (
                <TouchableOpacity
                  key={stock}
                  style={[
                    styles.filterChip,
                    (lowStockFilter === undefined && stock === 'all') ||
                    (lowStockFilter === true && stock === 'low') ||
                    (lowStockFilter === false && stock === 'normal')
                      ? styles.filterChipActive
                      : null,
                  ]}
                  onPress={() => {
                    if (stock === 'all') setLowStockFilter(undefined);
                    else if (stock === 'low') setLowStockFilter(true);
                    else setLowStockFilter(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      (lowStockFilter === undefined && stock === 'all') ||
                      (lowStockFilter === true && stock === 'low') ||
                      (lowStockFilter === false && stock === 'normal')
                        ? styles.filterChipTextActive
                        : null,
                    ]}
                  >
                    {stock}
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
    if (loading && supplies.length > 0) {
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
      <Ionicons name="medical-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No medical supplies found</Text>
      <Text style={styles.emptySubtext}>
        {searchTerm || categoryFilter !== 'all' || lowStockFilter !== undefined
          ? 'Try adjusting your filters'
          : 'Create your first medical supply to get started'}
      </Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Medical Supplies"
        rightIcon="add"
        gradient={false}
        onRightPress={() => navigation.navigate('SupplyForm' as never, {} as never)}
      />
      <FlatList
        data={supplies}
        renderItem={renderSupplyItem}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
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
  supplyCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  supplyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  supplyInfo: {
    flex: 1,
  },
  supplyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  supplyId: {
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
  supplyDetails: {
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
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
