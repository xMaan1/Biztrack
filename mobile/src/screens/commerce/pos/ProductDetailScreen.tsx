import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import POSService from '@/services/POSService';
import { Product, UnitOfMeasure } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await POSService.getProduct(id);
      setProduct(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load product');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (product) {
      navigation.navigate('ProductForm' as never, { id: product.id, product } as never);
    }
  };

  const handleDelete = () => {
    if (!product) return;

    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await POSService.deleteProduct(product.id);
              Alert.alert('Success', 'Product deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Product Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container safeArea>
        <Header title="Product Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Product not found</Text>
        </View>
      </Container>
    );
  }

  const isLowStock = product.stockQuantity <= product.minStockLevel;
  const profitMargin = product.unitPrice - product.costPrice;
  const profitPercentage = product.costPrice > 0
    ? ((profitMargin / product.costPrice) * 100).toFixed(1)
    : '0';

  return (
    <Container safeArea>
      <Header
        title="Product Details"
        rightIcon="create"
        gradient={false}
        onRightPress={handleEdit}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.formCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Product Name</Text>
              <Text style={styles.value}>{product.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>SKU</Text>
              <Text style={styles.value}>{product.sku}</Text>
            </View>
            {product.description && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Description</Text>
                <Text style={styles.value}>{product.description}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Category</Text>
              <Text style={styles.value}>{product.category}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Unit of Measure</Text>
              <Text style={styles.value}>{product.unitOfMeasure}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.formCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Unit Price</Text>
              <Text style={[styles.value, styles.priceValue]}>
                {formatCurrency(product.unitPrice)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Cost Price</Text>
              <Text style={[styles.value, styles.costValue]}>
                {formatCurrency(product.costPrice)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Profit Margin</Text>
              <Text style={[styles.value, styles.profitValue]}>
                {formatCurrency(profitMargin)} ({profitPercentage}%)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Information</Text>
          <View style={styles.formCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Current Stock</Text>
              <Text style={[styles.value, isLowStock && styles.lowStockValue]}>
                {product.stockQuantity} {product.unitOfMeasure}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Minimum Stock Level</Text>
              <Text style={styles.value}>
                {product.minStockLevel} {product.unitOfMeasure}
              </Text>
            </View>
            {isLowStock && (
              <View style={styles.alertBox}>
                <Ionicons name="warning" size={20} color={colors.orange[600]} />
                <Text style={styles.alertText}>
                  This product is {product.stockQuantity < product.minStockLevel ? 'below' : 'at'} the minimum stock level. Consider restocking soon.
                </Text>
              </View>
            )}
          </View>
        </View>

        {(product.barcode || product.batchNumber || product.serialNumber || product.expiryDate) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View style={styles.formCard}>
              {product.barcode && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Barcode</Text>
                  <Text style={styles.value}>{product.barcode}</Text>
                </View>
              )}
              {product.batchNumber && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Batch Number</Text>
                  <Text style={styles.value}>{product.batchNumber}</Text>
                </View>
              )}
              {product.serialNumber && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Serial Number</Text>
                  <Text style={styles.value}>{product.serialNumber}</Text>
                </View>
              )}
              {product.expiryDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Expiry Date</Text>
                  <Text style={styles.value}>
                    {new Date(product.expiryDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'] * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  formCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: colors.text.primary,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.green[600],
  },
  costValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.blue[600],
  },
  profitValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.purple[600],
  },
  lowStockValue: {
    color: colors.orange[600],
    fontWeight: '600',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orange[50],
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.orange[200],
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: colors.orange[800],
  },
  actionsContainer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red[600],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
});
