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
import { Receiving, ReceivingCreate, ReceivingUpdate, ReceivingItemCreate, PurchaseOrder, Warehouse } from '@/models/inventory';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ReceivingFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id, receiving } = route.params as { id?: string; receiving?: Receiving };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [formData, setFormData] = useState<ReceivingCreate>({
    receivingNumber: receiving?.receivingNumber || '',
    purchaseOrderId: receiving?.purchaseOrderId || '',
    warehouseId: receiving?.warehouseId || '',
    receivedDate: receiving?.receivedDate ? new Date(receiving.receivedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: receiving?.notes || '',
    items: receiving?.items || [],
  });

  useEffect(() => {
    loadData();
    if (isEdit && id && !receiving) {
      loadReceiving();
    } else if (receiving) {
      setSelectedWarehouseId(receiving.warehouseId);
      if (receiving.purchaseOrderId) {
        loadPurchaseOrder(receiving.purchaseOrderId);
      }
    }
  }, [id, isEdit]);

  const loadData = async () => {
    try {
      const [warehousesResponse, purchaseOrdersResponse] = await Promise.all([
        InventoryService.getWarehouses(),
        InventoryService.getPurchaseOrders(),
      ]);
      setWarehouses(warehousesResponse.warehouses || []);
      setPurchaseOrders(purchaseOrdersResponse.purchaseOrders || []);
      if (warehousesResponse.warehouses.length > 0 && !formData.warehouseId) {
        setSelectedWarehouseId(warehousesResponse.warehouses[0].id);
        updateField('warehouseId', warehousesResponse.warehouses[0].id);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    }
  };

  const loadPurchaseOrder = async (poId: string) => {
    try {
      const response = await InventoryService.getPurchaseOrder(poId);
      setSelectedPO(response.purchaseOrder);
      if (response.purchaseOrder.items && response.purchaseOrder.items.length > 0) {
        const items: ReceivingItemCreate[] = response.purchaseOrder.items.map((item) => ({
          purchaseOrderId: poId,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          receivedQuantity: item.quantity,
          notes: '',
        }));
        updateField('items', items);
      }
    } catch (error: any) {
      console.error('Error loading purchase order:', error);
    }
  };

  const loadReceiving = async () => {
    if (!id) return;
    try {
      setLoadingData(true);
      const response = await InventoryService.getReceiving(id);
      const r = response.receiving;
      setSelectedWarehouseId(r.warehouseId);
      setFormData({
        receivingNumber: r.receivingNumber,
        purchaseOrderId: r.purchaseOrderId,
        warehouseId: r.warehouseId,
        receivedDate: r.receivedDate ? new Date(r.receivedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: r.notes || '',
        items: r.items || [],
      });
      if (r.purchaseOrderId) {
        await loadPurchaseOrder(r.purchaseOrderId);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load receiving');
      navigation.goBack();
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.purchaseOrderId || !formData.warehouseId || !formData.receivedDate || formData.items.length === 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields and ensure items are added');
      return;
    }

    const invalidItems = formData.items.filter((item) => item.receivedQuantity > item.quantity);
    if (invalidItems.length > 0) {
      Alert.alert('Validation Error', 'Received quantities cannot exceed ordered quantities');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        const updateData: ReceivingUpdate = {
          purchaseOrderId: formData.purchaseOrderId,
          warehouseId: formData.warehouseId,
          receivedDate: formData.receivedDate,
          notes: formData.notes,
        };
        await InventoryService.updateReceiving(id, updateData);
        Alert.alert('Success', 'Receiving updated successfully');
      } else {
        await InventoryService.createReceiving(formData);
        Alert.alert('Success', 'Receiving created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save receiving');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ReceivingCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...formData.items];
    if (quantity > newItems[index].quantity) {
      Alert.alert('Validation Error', 'Received quantity cannot exceed ordered quantity');
      return;
    }
    newItems[index] = {
      ...newItems[index],
      receivedQuantity: quantity,
      totalCost: quantity * newItems[index].unitCost,
    };
    updateField('items', newItems);
  };

  if (loadingData) {
    return (
      <Container safeArea>
        <Header title={isEdit ? 'Edit Receiving' : 'New Receiving'} gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Receiving' : 'New Receiving'} gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receiving Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purchase Order *</Text>
              <View style={styles.selectContainer}>
                {purchaseOrders
                  .filter((po) => po.status === 'ordered' || po.status === 'approved')
                  .map((po) => (
                    <Pressable
                      key={po.id}
                      style={({ pressed }) => [
                        styles.selectOption,
                        formData.purchaseOrderId === po.id && styles.selectOptionActive,
                        pressed && styles.selectOptionPressed,
                      ]}
                      onPress={async () => {
                        updateField('purchaseOrderId', po.id);
                        await loadPurchaseOrder(po.id);
                      }}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          formData.purchaseOrderId === po.id && styles.selectOptionTextActive,
                        ]}
                      >
                        {po.orderNumber} - {po.supplierName}
                      </Text>
                      {formData.purchaseOrderId === po.id && (
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
              <Text style={styles.label}>Received Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.receivedDate}
                onChangeText={(value) => updateField('receivedDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Receiving Number</Text>
              <TextInput
                style={styles.input}
                value={formData.receivingNumber}
                onChangeText={(value) => updateField('receivingNumber', value)}
                placeholder="Auto-generated if empty"
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

        {selectedPO && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Receiving Items from PO: {selectedPO.orderNumber}
            </Text>
            <View style={styles.formCard}>
              {formData.items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Ordered Qty</Text>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                    </View>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Received Qty *</Text>
                      <TextInput
                        style={styles.input}
                        value={item.receivedQuantity.toString()}
                        onChangeText={(value) => updateItemQuantity(index, parseInt(value) || 0)}
                        placeholder="0"
                        placeholderTextColor={colors.text.secondary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Unit Cost</Text>
                      <Text style={styles.costText}>{formatCurrency(item.unitCost)}</Text>
                    </View>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Total Cost</Text>
                      <Text style={styles.totalCostText}>
                        {formatCurrency(item.receivedQuantity * item.unitCost)}
                      </Text>
                    </View>
                  </View>

                  {item.batchNumber && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Batch Number</Text>
                      <TextInput
                        style={styles.input}
                        value={item.batchNumber}
                        onChangeText={(value) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...newItems[index], batchNumber: value };
                          updateField('items', newItems);
                        }}
                        placeholder="Enter batch number"
                        placeholderTextColor={colors.text.secondary}
                      />
                    </View>
                  )}

                  {item.serialNumber && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Serial Number</Text>
                      <TextInput
                        style={styles.input}
                        value={item.serialNumber}
                        onChangeText={(value) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...newItems[index], serialNumber: value };
                          updateField('items', newItems);
                        }}
                        placeholder="Enter serial number"
                        placeholderTextColor={colors.text.secondary}
                      />
                    </View>
                  )}

                  {item.expiryDate && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Expiry Date</Text>
                      <TextInput
                        style={styles.input}
                        value={item.expiryDate}
                        onChangeText={(value) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...newItems[index], expiryDate: value };
                          updateField('items', newItems);
                        }}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.text.secondary}
                      />
                    </View>
                  )}

                  {item.notes !== undefined && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Notes</Text>
                      <TextInput
                        style={styles.input}
                        value={item.notes}
                        onChangeText={(value) => {
                          const newItems = [...formData.items];
                          newItems[index] = { ...newItems[index], notes: value };
                          updateField('items', newItems);
                        }}
                        placeholder="Item notes"
                        placeholderTextColor={colors.text.secondary}
                      />
                    </View>
                  )}
                </View>
              ))}
              {formData.items.length === 0 && (
                <View style={styles.emptyItems}>
                  <Text style={styles.emptyItemsText}>
                    Select a purchase order to load items
                  </Text>
                </View>
              )}
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
                {isEdit ? 'Update Receiving' : 'Create Receiving'}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
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
    backgroundColor: colors.primary[50],
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
    marginBottom: spacing.md,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemSku: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfWidth: {
    flex: 1,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    padding: spacing.sm,
  },
  costText: {
    fontSize: 14,
    color: colors.text.secondary,
    padding: spacing.sm,
  },
  totalCostText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
    padding: spacing.sm,
  },
  emptyItems: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyItemsText: {
    color: colors.text.secondary,
    textAlign: 'center',
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
