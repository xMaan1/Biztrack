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
import { Product, ProductCategory, UnitOfMeasure } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ProductListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 20;

  useEffect(() => {
    loadProducts();
  }, [currentPage, selectedCategory, showLowStock]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadProducts();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await POSService.getProducts(
        {
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchTerm || undefined,
          lowStock: showLowStock || undefined,
        },
        currentPage,
        itemsPerPage,
      );
      setProducts(response.products || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { status: 'out_of_stock', color: colors.red[600] };
    if (quantity <= threshold) return { status: 'low_stock', color: colors.orange[600] };
    return { status: 'in_stock', color: colors.green[600] };
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const stockStatus = getStockStatus(item.stockQuantity, item.minStockLevel);
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => (navigation.navigate as any)('ProductDetail', { id: item.id })}
      >
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productSku}>SKU: {item.sku}</Text>
          </View>
          <View style={[styles.stockBadge, { backgroundColor: stockStatus.color + '20' }]}>
            <Text style={[styles.stockText, { color: stockStatus.color }]}>
              {item.stockQuantity} {item.unitOfMeasure || UnitOfMeasure.PIECE}
            </Text>
          </View>
        </View>
        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{item.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.unitPrice || 0)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Min Stock:</Text>
            <Text style={styles.detailValue}>
              {item.minStockLevel || 0} {item.unitOfMeasure || UnitOfMeasure.PIECE}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
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
          <Text style={styles.filterLabel}>Category:</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === 'all' && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {Object.values(ProductCategory).map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  selectedCategory === category && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === category && styles.filterChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.filterChip, showLowStock && styles.filterChipActive]}
          onPress={() => setShowLowStock(!showLowStock)}
        >
          <Ionicons
            name={showLowStock ? 'checkbox' : 'square-outline'}
            size={16}
            color={showLowStock ? colors.background.default : colors.text.secondary}
          />
          <Text
            style={[
              styles.filterChipText,
              showLowStock && styles.filterChipTextActive,
            ]}
          >
            Low Stock Only
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (loading && products.length > 0) {
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
      <Ionicons name="cube-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No products found</Text>
      <Text style={styles.emptySubtext}>
        Products are managed in the POS module
      </Text>
      <TouchableOpacity
        style={styles.goToPOSButton}
        onPress={() => navigation.navigate('ProductList' as never)}
      >
        <Text style={styles.goToPOSButtonText}>Go to POS Products</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Products"
        gradient={false}
        rightIcon="cart-outline"
        onRightPress={() => navigation.navigate('ProductList' as never)}
      />
      <FlatList
        data={products}
        renderItem={renderProductItem}
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
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.xs,
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
  productCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  productInfo: {
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
  },
  stockBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
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
  goToPOSButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  goToPOSButtonText: {
    color: colors.background.default,
    fontSize: 14,
    fontWeight: '600',
  },
});
