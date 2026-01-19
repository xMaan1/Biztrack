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
import { StockMovement, StockMovementCreate, StockMovementUpdate, StockMovementType, Warehouse } from '@/models/inventory';
import { Product } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function StockMovementFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { getCurrencySymbol } = useCurrency();
  const { id, movement } = route.params as { id?: string; movement?: StockMovement };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [formData, setFormData] = useState<StockMovementCreate>({
    productId: movement?.productId || '',
    warehouseId: movement?.warehouseId || '',
    locationId: movement?.locationId || '',
    movementType: movement?.movementType || StockMovementType.INBOUND,
    quantity: movement?.quantity || 0,
    unitCost: movement?.unitCost || 0,
    referenceNumber: movement?.referenceNumber || '',
    referenceType: movement?.referenceType || '',
    notes: movement?.notes || '',
    batchNumber: movement?.batchNumber || '',
    serialNumber: movement?.serialNumber || '',
    expiryDate: movement?.expiryDate ? new Date(movement.expiryDate).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    loadData();
    if (isEdit && id && !movement) {
      loadStockMovement();
    } else if (movement) {
      setSelectedProductId(movement.productId);
      setSelectedWarehouseId(movement.warehouseId);
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
    } catch (error: any) {
      console.error('Error loading data:', error);
    }
  };

  const loadStockMovement = async () => {
    if (!id) return;
    try {
      setLoadingData(true);
      const response = await InventoryService.getStockMovement(id);
      const sm = response.stockMovement;
      setSelectedProductId(sm.productId);
      setSelectedWarehouseId(sm.warehouseId);
      setFormData({
        productId: sm.productId,
        warehouseId: sm.warehouseId,
        locationId: sm.locationId || '',
        movementType: sm.movementType,
        quantity: sm.quantity,
        unitCost: sm.unitCost,
        referenceNumber: sm.referenceNumber || '',
        referenceType: sm.referenceType || '',
        notes: sm.notes || '',
        batchNumber: sm.batchNumber || '',
        serialNumber: sm.serialNumber || '',
        expiryDate: sm.expiryDate ? new Date(sm.expiryDate).toISOString().split('T')[0] : '',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load stock movement');
      navigation.goBack();
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.productId || !formData.warehouseId || !formData.referenceNumber || formData.quantity <= 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        const updateData: StockMovementUpdate = { ...formData };
        await InventoryService.updateStockMovement(id, updateData);
        Alert.alert('Success', 'Stock movement updated successfully');
      } else {
        await InventoryService.createStockMovement(formData);
        Alert.alert('Success', 'Stock movement created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save stock movement');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof StockMovementCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        updateField('unitCost', product.costPrice || 0);
      }
    }
  };

  const movementTypes = Object.values(StockMovementType);

  if (loadingData) {
    return (
      <Container safeArea>
        <Header title={isEdit ? 'Edit Stock Movement' : 'New Stock Movement'} gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Stock Movement' : 'New Stock Movement'} gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movement Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Movement Type *</Text>
              <View style={styles.selectContainer}>
                {movementTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={({ pressed }) => [
                      styles.selectOption,
                      formData.movementType === type && styles.selectOptionActive,
                      pressed && styles.selectOptionPressed,
                    ]}
                    onPress={() => updateField('movementType', type)}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.movementType === type && styles.selectOptionTextActive,
                      ]}
                    >
                      {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                    {formData.movementType === type && (
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
              <Text style={styles.label}>Product *</Text>
              <View style={styles.selectContainer}>
                {products.map((product) => (
                  <Pressable
                    key={product.id}
                    style={({ pressed }) => [
                      styles.selectOption,
                      selectedProductId === product.id && styles.selectOptionActive,
                      pressed && styles.selectOptionPressed,
                    ]}
                    onPress={() => {
                      setSelectedProductId(product.id);
                      updateField('productId', product.id);
                      updateField('unitCost', product.costPrice || 0);
                    }}
                  >
                    <View style={styles.productOption}>
                      <Text
                        style={[
                          styles.selectOptionText,
                          selectedProductId === product.id && styles.selectOptionTextActive,
                        ]}
                      >
                        {product.name} ({product.sku})
                      </Text>
                      {selectedProductId === product.id && (
                        <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location ID</Text>
              <TextInput
                style={styles.input}
                value={formData.locationId}
                onChangeText={(value) => updateField('locationId', value)}
                placeholder="Enter location ID (optional)"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity.toString()}
                onChangeText={(value) => updateField('quantity', parseInt(value) || 0)}
                placeholder="Enter quantity"
                placeholderTextColor={colors.text.secondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit Cost *</Text>
              <View style={styles.inputWithCurrency}>
                <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
                <TextInput
                  style={[styles.input, styles.inputWithCurrencyInput]}
                  value={formData.unitCost.toString()}
                  onChangeText={(value) => updateField('unitCost', parseFloat(value) || 0)}
                  placeholder="Enter unit cost"
                  placeholderTextColor={colors.text.secondary}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reference Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.referenceNumber}
                onChangeText={(value) => updateField('referenceNumber', value)}
                placeholder="Enter reference number"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reference Type</Text>
              <TextInput
                style={styles.input}
                value={formData.referenceType}
                onChangeText={(value) => updateField('referenceType', value)}
                placeholder="e.g., Purchase Order, Sale, Transfer"
                placeholderTextColor={colors.text.secondary}
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
              <Text style={styles.label}>Serial Number</Text>
              <TextInput
                style={styles.input}
                value={formData.serialNumber}
                onChangeText={(value) => updateField('serialNumber', value)}
                placeholder="Enter serial number"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expiry Date</Text>
              <TextInput
                style={styles.input}
                value={formData.expiryDate}
                onChangeText={(value) => updateField('expiryDate', value)}
                placeholder="YYYY-MM-DD"
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
                {isEdit ? 'Update Movement' : 'Create Movement'}
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
  inputWithCurrency: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingLeft: spacing.sm,
  },
  currencySymbol: {
    fontSize: 16,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  inputWithCurrencyInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
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
  productOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectOptionPressed: {
    opacity: 0.7,
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
