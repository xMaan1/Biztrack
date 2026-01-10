import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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
import { Product, ProductCreate, ProductCategory, UnitOfMeasure } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ProductFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id, product } = route.params as { id?: string; product?: Product };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductCreate>({
    name: product?.name || '',
    sku: product?.sku || '',
    description: product?.description || '',
    category: product?.category || ProductCategory.OTHER,
    unitPrice: product?.unitPrice || 0,
    costPrice: product?.costPrice || 0,
    stockQuantity: product?.stockQuantity || 0,
    minStockLevel: product?.minStockLevel || 5,
    unitOfMeasure: product?.unitOfMeasure || UnitOfMeasure.PIECE,
    barcode: product?.barcode || '',
    expiryDate: product?.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
    batchNumber: product?.batchNumber || '',
    serialNumber: product?.serialNumber || '',
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Name, SKU)');
      return;
    }

    if (formData.unitPrice < 0 || formData.costPrice < 0) {
      Alert.alert('Validation Error', 'Price and cost cannot be negative');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await POSService.updateProduct(id, formData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await POSService.createProduct(formData);
        Alert.alert('Success', 'Product created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ProductCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const categoryOptions = Object.values(ProductCategory);
  const unitOptions = Object.values(UnitOfMeasure);

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Product' : 'New Product'} gradient={false} />
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Product name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SKU *</Text>
              <TextInput
                style={styles.input}
                value={formData.sku}
                onChangeText={(value) => updateField('sku', value)}
                placeholder="SKU code"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Product description"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Category</Text>
                <View style={styles.selectContainer}>
                  {categoryOptions.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.selectOption,
                        formData.category === category && styles.selectOptionActive,
                      ]}
                      onPress={() => updateField('category', category)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          formData.category === category && styles.selectOptionTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Unit Price *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.unitPrice?.toString() || '0'}
                  onChangeText={(value) => updateField('unitPrice', parseFloat(value) || 0)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Cost Price *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.costPrice?.toString() || '0'}
                  onChangeText={(value) => updateField('costPrice', parseFloat(value) || 0)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Stock Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stockQuantity?.toString() || '0'}
                  onChangeText={(value) => updateField('stockQuantity', parseInt(value) || 0)}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Min Stock Level</Text>
                <TextInput
                  style={styles.input}
                  value={formData.minStockLevel?.toString() || '5'}
                  onChangeText={(value) => updateField('minStockLevel', parseInt(value) || 5)}
                  placeholder="5"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit of Measure</Text>
              <View style={styles.selectContainer}>
                {unitOptions.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.selectOption,
                      formData.unitOfMeasure === unit && styles.selectOptionActive,
                    ]}
                    onPress={() => updateField('unitOfMeasure', unit)}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.unitOfMeasure === unit && styles.selectOptionTextActive,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Barcode</Text>
                <TextInput
                  style={styles.input}
                  value={formData.barcode}
                  onChangeText={(value) => updateField('barcode', value)}
                  placeholder="Barcode"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.expiryDate}
                  onChangeText={(value) => updateField('expiryDate', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Batch Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.batchNumber}
                  onChangeText={(value) => updateField('batchNumber', value)}
                  placeholder="Batch number"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Serial Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.serialNumber}
                  onChangeText={(value) => updateField('serialNumber', value)}
                  placeholder="Serial number"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background.default} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Product' : 'Create Product'}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  section: {
    marginBottom: spacing.md,
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
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  selectOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.paper,
  },
  selectOptionActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  selectOptionText: {
    fontSize: 12,
    color: colors.text.primary,
  },
  selectOptionTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
});
