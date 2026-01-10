import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import POSService from '@/services/POSService';
import { Product, POSPaymentMethod } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export default function POSSaleScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<POSPaymentMethod>(POSPaymentMethod.CASH);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchProducts(searchTerm);
      } else if (searchTerm.length === 0) {
        loadProducts();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadProducts = async () => {
    try {
      setSearchLoading(true);
      const response = await POSService.getProducts();
      setProducts(response.products || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load products');
    } finally {
      setSearchLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    if (query.length < 2) return;
    try {
      setSearchLoading(true);
      const response = await POSService.searchProducts(query);
      setProducts(response.products || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to search products');
    } finally {
      setSearchLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      Alert.alert('Out of Stock', 'This product is out of stock');
      return;
    }

    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        Alert.alert('Insufficient Stock', `Only ${product.stockQuantity} items available`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * product.unitPrice,
              }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          total: product.unitPrice,
        },
      ]);
    }
    setSearchTerm('');
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const cartItem = cart.find((item) => item.product.id === productId);
    if (cartItem && newQuantity > cartItem.product.stockQuantity) {
      Alert.alert('Insufficient Stock', `Only ${cartItem.product.stockQuantity} items available`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              total: newQuantity * item.product.unitPrice,
            }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setNotes('');
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  };

  const getTotal = () => {
    return getSubtotal();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart before checkout');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        customerName: customerName || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.unitPrice,
          discount: 0,
          taxRate: 0,
          taxAmount: 0,
        })),
        taxRate: 0,
        discount: 0,
        paymentMethod: selectedPaymentMethod,
        notes: notes || undefined,
      };

      await POSService.createTransaction(transactionData);
      clearCart();
      Alert.alert('Success', 'Transaction completed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => addToCart(item)}
      disabled={item.stockQuantity <= 0}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku}</Text>
        <Text style={styles.productStock}>
          Stock: {item.stockQuantity} {item.stockQuantity <= 0 && '(Out of Stock)'}
        </Text>
      </View>
      <View style={styles.productPrice}>
        <Text style={styles.priceText}>{formatCurrency(item.unitPrice)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.product.name}</Text>
        <Text style={styles.cartItemPrice}>
          {formatCurrency(item.product.unitPrice)} each
        </Text>
      </View>
      <View style={styles.cartItemControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={20} color={colors.background.default} />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
        >
          <Ionicons name="add" size={20} color={colors.background.default} />
        </TouchableOpacity>
        <Text style={styles.cartItemTotal}>{formatCurrency(item.total)}</Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.product.id)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.red[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Container safeArea>
      <Header title="New Sale" gradient={false} />
      <View style={styles.container}>
        <View style={styles.mainContent}>
          <View style={styles.searchSection}>
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
            {searchLoading && (
              <ActivityIndicator size="small" color={colors.primary.main} style={styles.loader} />
            )}
          </View>

          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Products</Text>
            {products.length > 0 ? (
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={(item) => item.id}
                style={styles.productsList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={48} color={colors.text.secondary} />
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Cart ({cart.length})</Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
                <Ionicons name="trash-outline" size={18} color={colors.red[600]} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={64} color={colors.text.secondary} />
              <Text style={styles.emptyCartText}>Cart is empty</Text>
            </View>
          ) : (
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.product.id}
              style={styles.cartList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {cart.length > 0 && (
            <View style={styles.checkoutSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Customer Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Walk-in customer"
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholderTextColor={colors.text.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment Method</Text>
                <View style={styles.paymentMethods}>
                  {Object.values(POSPaymentMethod).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentMethodButton,
                        selectedPaymentMethod === method && styles.paymentMethodButtonActive,
                      ]}
                      onPress={() => setSelectedPaymentMethod(method)}
                    >
                      <Text
                        style={[
                          styles.paymentMethodText,
                          selectedPaymentMethod === method && styles.paymentMethodTextActive,
                        ]}
                      >
                        {method.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Transaction notes..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={colors.text.secondary}
                />
              </View>

              <View style={styles.totalsSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(getSubtotal())}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total:</Text>
                  <Text style={styles.grandTotalValue}>{formatCurrency(getTotal())}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
                onPress={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background.default} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color={colors.background.default} />
                    <Text style={styles.checkoutButtonText}>Complete Sale</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    padding: spacing.md,
  },
  searchSection: {
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
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
  },
  loader: {
    marginTop: spacing.xs,
  },
  productsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  productsList: {
    flex: 1,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.card.border,
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
    marginBottom: spacing.xs,
  },
  productStock: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  productPrice: {
    marginLeft: spacing.md,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.green[600],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  cartSection: {
    width: 350,
    backgroundColor: colors.background.paper,
    borderLeftWidth: 1,
    borderLeftColor: colors.border.default,
    padding: spacing.md,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.red[600],
    fontWeight: '600',
  },
  cartList: {
    flex: 1,
    marginBottom: spacing.md,
  },
  cartItem: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  cartItemInfo: {
    marginBottom: spacing.sm,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cartItemPrice: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 30,
    textAlign: 'center',
  },
  cartItemTotal: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.green[600],
    textAlign: 'right',
  },
  removeButton: {
    padding: spacing.xs,
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyCartText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  checkoutSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  paymentMethodButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.default,
  },
  paymentMethodButtonActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  paymentMethodText: {
    fontSize: 12,
    color: colors.text.primary,
  },
  paymentMethodTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  totalsSection: {
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  grandTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.green[600],
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green[600],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.background.default,
  },
});
