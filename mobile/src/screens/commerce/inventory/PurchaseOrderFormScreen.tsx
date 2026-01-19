import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import InventoryService from '@/services/InventoryService';
import POSService from '@/services/POSService';
import { apiService } from '@/services/ApiService';
import { PurchaseOrder, PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderItemCreate, Warehouse } from '@/models/inventory';
import { Product } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

interface Supplier {
  id: string;
  name: string;
}

export default function PurchaseOrderFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id, order } = route.params as { id?: string; order?: PurchaseOrder };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [formData, setFormData] = useState<PurchaseOrderCreate>({
    supplierId: order?.supplierId || '',
    supplierName: order?.supplierName || '',
    warehouseId: order?.warehouseId || '',
    orderDate: order?.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expectedDeliveryDate: order?.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
    vatRate: order?.vatRate || 0,
    notes: order?.notes || '',
    batchNumber: order?.batchNumber || '',
    vehicleReg: order?.vehicleReg || '',
    items: order?.items || [],
  });

  useEffect(() => {
    loadData();
    if (isEdit && id && !order) {
      loadPurchaseOrder();
    } else if (order) {
      setSelectedSupplierId(order.supplierId);
      setSelectedWarehouseId(order.warehouseId);
    }
  }, [id, isEdit]);

  const loadData = async () => {
    try {
      const [warehousesResponse, productsResponse] = await Promise.all([
        InventoryService.getWarehouses(),
        POSService.getProducts(),
      ]);
      setWarehouses(warehousesResponse.warehouses || []);
      setProducts(productsResponse.products || []);
      if (warehousesResponse.warehouses.length > 0 && !formData.warehouseId) {
        setSelectedWarehouseId(warehousesResponse.warehouses[0].id);
        updateField('warehouseId', warehousesResponse.warehouses[0].id);
      }
      try {
        const suppliersResponse = await apiService.get('/hrm/suppliers');
        setSuppliers(suppliersResponse.suppliers || []);
      } catch (error) {
        console.error('Error loading suppliers:', error);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    }
  };

  const loadPurchaseOrder = async () => {
    if (!id) return;
    try {
      setLoadingData(true);
      const response = await InventoryService.getPurchaseOrder(id);
      const po = response.purchaseOrder;
      setSelectedSupplierId(po.supplierId);
      setSelectedWarehouseId(po.warehouseId);
      setFormData({
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        warehouseId: po.warehouseId,
        orderDate: po.orderDate ? new Date(po.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expectedDeliveryDate: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toISOString().split('T')[0] : '',
        vatRate: po.vatRate || 0,
        notes: po.notes || '',
        batchNumber: po.batchNumber || '',
        vehicleReg: po.vehicleReg || '',
        items: po.items || [],
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load purchase order');
      navigation.goBack();
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.supplierId || !formData.warehouseId || !formData.orderDate || !formData.expectedDeliveryDate || formData.items.length === 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields and add at least one item');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        const updateData: PurchaseOrderUpdate = { ...formData };
        await InventoryService.updatePurchaseOrder(id, updateData);
        Alert.alert('Success', 'Purchase order updated successfully');
      } else {
        await InventoryService.createPurchaseOrder(formData);
        Alert.alert('Success', 'Purchase order created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof PurchaseOrderCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    const newItem: PurchaseOrderItemCreate = {
      productId: '',
      productName: '',
      sku: '',
      quantity: 0,
      unitCost: 0,
      totalCost: 0,
      notes: '',
    };
    updateField('items', [...formData.items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    updateField('items', newItems);
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItemCreate, value: any) => {
    const newItems = [...formData.items];
    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitCost: product.costPrice || 0,
          totalCost: (product.costPrice || 0) * newItems[index].quantity,
        };
      }
    } else if (field === 'quantity' || field === 'unitCost') {
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        totalCost: field === 'quantity' ? value * newItems[index].unitCost : newItems[index].quantity * value,
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    updateField('items', newItems);
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalCost, 0);
    const vatAmount = subtotal * (formData.vatRate || 0) / 100;
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  };

  if (loadingData) {
    return (
      <Container safeArea>
        <Header title={isEdit ? 'Edit Purchase Order' : 'New Purchase Order'} gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  const totals = calculateTotals();

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Purchase Order' : 'New Purchase Order'} gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Supplier *</Text>
              <View style={styles.selectContainer}>
                {suppliers.map((supplier) => (
                  <Pressable
                    key={supplier.id}
                    style={({ pressed }) => [
                      styles.selectOption,
                      selectedSupplierId === supplier.id && styles.selectOptionActive,
                      pressed && styles.selectOptionPressed,
                    ]}
                    onPress={() => {
                      setSelectedSupplierId(supplier.id);
                      updateField('supplierId', supplier.id);
                      updateField('supplierName', supplier.name);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        selectedSupplierId === supplier.id && styles.selectOptionTextActive,
                      ]}
                    >
                      {supplier.name}
                    </Text>
                    {selectedSupplierId === supplier.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Warehouse *</Text>
              <View style={styles.selectContainer}>
                {warehouses.map((warehouse) => (
                  <Pressable
                    key={warehouse.id}
                    style={({ pressed }) => [
                      styles.selectOption,
                      selectedWarehouseId === warehouse.id && styles.selectOptionActive,
                      pressed && styles.selectOptionPressed,
                    ]}
                    onPress={() => {
                      setSelectedWarehouseId(warehouse.id);
                      updateField('warehouseId', warehouse.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        selectedWarehouseId === warehouse.id && styles.selectOptionTextActive,
                      ]}
                    >
                      {warehouse.name}
                    </Text>
                    {selectedWarehouseId === warehouse.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Order Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.orderDate}
                onChangeText={(value) => updateField('orderDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expected Delivery Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.expectedDeliveryDate}
                onChangeText={(value) => updateField('expectedDeliveryDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>VAT Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.vatRate?.toString() || '0'}
                onChangeText={(value) => updateField('vatRate', parseFloat(value) || 0)}
                placeholder="Enter VAT rate"
                placeholderTextColor={colors.text.secondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Batch Number</Text>
              <TextInput
                style={styles.input}
                value={formData.batchNumber}
                onChangeText={(value) => updateField('batchNumber', value)}
                placeholder="Enter batch number"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Registration</Text>
              <TextInput
                style={styles.input}
                value={formData.vehicleReg}
                onChangeText={(value) => updateField('vehicleReg', value)}
                placeholder="Enter vehicle registration"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                placeholder="Enter notes"
                placeholderTextColor={colors.text.secondary}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed,
              ]}
              onPress={addItem}
            >
              <Ionicons name="add-circle" size={24} color={colors.primary.main} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </Pressable>
          </View>
          <View style={styles.formCard}>
            {formData.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>Item {index + 1}</Text>
                  <Pressable
                    style={({ pressed }) => pressed && { opacity: 0.7 }}
                    onPress={() => removeItem(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.red[600]} />
                  </Pressable>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product *</Text>
                  <View style={styles.selectContainer}>
                    {products.map((product) => (
                      <Pressable
                        key={product.id}
                        style={({ pressed }) => [
                          styles.selectOption,
                          item.productId === product.id && styles.selectOptionActive,
                          pressed && styles.selectOptionPressed,
                        ]}
                        onPress={() => updateItem(index, 'productId', product.id)}
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            item.productId === product.id && styles.selectOptionTextActive,
                          ]}
                        >
                          {product.name} ({product.sku})
                        </Text>
                        {item.productId === product.id && (
                          <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Quantity *</Text>
                    <TextInput
                      style={styles.input}
                      value={item.quantity.toString()}
                      onChangeText={(value) => updateItem(index, 'quantity', parseInt(value) || 0)}
                      placeholder="Qty"
                      placeholderTextColor={colors.text.secondary}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Unit Cost *</Text>
                    <TextInput
                      style={styles.input}
                      value={item.unitCost.toString()}
                      onChangeText={(value) => updateItem(index, 'unitCost', parseFloat(value) || 0)}
                      placeholder="Cost"
                      placeholderTextColor={colors.text.secondary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Total Cost</Text>
                  <Text style={styles.totalCostText}>{formatCurrency(item.totalCost)}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={styles.input}
                    value={item.notes}
                    onChangeText={(value) => updateItem(index, 'notes', value)}
                    placeholder="Item notes"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>
              </View>
            ))}
            {formData.items.length === 0 && (
              <View style={styles.emptyItems}>
                <Text style={styles.emptyItemsText}>No items added. Tap "Add Item" to add products.</Text>
              </View>
            )}
          </View>
        </View>

        {formData.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.formCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>VAT ({formData.vatRate || 0}%)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.vatAmount)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.total)}</Text>
              </View>
            </View>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            (loading || pressed) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background.default} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Purchase Order' : 'Create Purchase Order'}
              </Text>
            </>
          )}
        </Pressable>
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  formCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    gap: spacing.xs,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  selectOptionActive: {
    backgroundColor: colors.blue[50],
    borderColor: colors.primary.main,
  },
  selectOptionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  selectOptionTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addButtonText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  selectOptionPressed: {
    opacity: 0.7,
  },
  itemCard: {
    backgroundColor: colors.background.muted,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  totalCostText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  emptyItems: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyItemsText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.border.default,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.background.default,
    fontSize: 16,
    fontWeight: '600',
  },
});
