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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import MedicalSupplyService from '@/services/MedicalSupplyService';
import { MedicalSupply, MedicalSupplyCreate } from '@/models/healthcare';

export default function SupplyFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, supply } = route.params as { id?: string; supply?: MedicalSupply };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<MedicalSupplyCreate>({
    name: supply?.name || '',
    category: supply?.category || '',
    description: supply?.description || '',
    unit: supply?.unit || 'piece',
    stockQuantity: supply?.stockQuantity || 0,
    minStockLevel: supply?.minStockLevel || 0,
    maxStockLevel: supply?.maxStockLevel,
    unitPrice: supply?.unitPrice || 0,
    expiryDate: supply?.expiryDate || '',
    batchNumber: supply?.batchNumber || '',
    supplier: supply?.supplier || '',
    location: supply?.location || '',
  });

  const categories = [
    'Medication',
    'Equipment',
    'Supplies',
    'Instruments',
    'Disposables',
    'Diagnostic',
    'Other',
  ];

  useEffect(() => {
    if (isEdit && supply) {
      setFormData({
        name: supply.name,
        category: supply.category || '',
        description: supply.description || '',
        unit: supply.unit || 'piece',
        stockQuantity: supply.stockQuantity,
        minStockLevel: supply.minStockLevel,
        maxStockLevel: supply.maxStockLevel,
        unitPrice: supply.unitPrice,
        expiryDate: supply.expiryDate || '',
        batchNumber: supply.batchNumber || '',
        supplier: supply.supplier || '',
        location: supply.location || '',
      });
    }
  }, [isEdit, supply]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (formData.stockQuantity !== undefined && formData.stockQuantity < 0) {
      errors.stockQuantity = 'Stock quantity cannot be negative';
    }
    if (formData.minStockLevel !== undefined && formData.minStockLevel < 0) {
      errors.minStockLevel = 'Min stock level cannot be negative';
    }
    if (formData.unitPrice !== undefined && formData.unitPrice < 0) {
      errors.unitPrice = 'Unit price cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix form errors');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await MedicalSupplyService.updateMedicalSupply(id, formData);
        Alert.alert('Success', 'Medical supply updated successfully');
      } else {
        await MedicalSupplyService.createMedicalSupply(formData);
        Alert.alert('Success', 'Medical supply created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save medical supply');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof MedicalSupplyCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Medical Supply' : 'New Medical Supply'} gradient={false} />
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
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={[styles.input, formErrors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Supply name"
                placeholderTextColor={colors.text.secondary}
              />
              {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.radioGroup}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.radioOption,
                      formData.category === category && styles.radioOptionActive,
                    ]}
                    onPress={() => updateField('category', category)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        formData.category === category && styles.radioTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={formData.unit}
                onChangeText={(value) => updateField('unit', value)}
                placeholder="piece, box, etc."
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Supply description"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Information</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput
                  style={[styles.input, formErrors.stockQuantity && styles.inputError]}
                  value={formData.stockQuantity?.toString() || '0'}
                  onChangeText={(value) => {
                    const numValue = value === '' ? 0 : parseInt(value) || 0;
                    updateField('stockQuantity', numValue);
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
                {formErrors.stockQuantity && (
                  <Text style={styles.errorText}>{formErrors.stockQuantity}</Text>
                )}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Unit Price</Text>
                <TextInput
                  style={[styles.input, formErrors.unitPrice && styles.inputError]}
                  value={formData.unitPrice?.toString() || '0'}
                  onChangeText={(value) => {
                    const numValue = value === '' ? 0 : parseFloat(value) || 0;
                    updateField('unitPrice', numValue);
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.text.secondary}
                />
                {formErrors.unitPrice && (
                  <Text style={styles.errorText}>{formErrors.unitPrice}</Text>
                )}
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Min Stock Level</Text>
                <TextInput
                  style={[styles.input, formErrors.minStockLevel && styles.inputError]}
                  value={formData.minStockLevel?.toString() || '0'}
                  onChangeText={(value) => {
                    const numValue = value === '' ? 0 : parseInt(value) || 0;
                    updateField('minStockLevel', numValue);
                  }}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
                {formErrors.minStockLevel && (
                  <Text style={styles.errorText}>{formErrors.minStockLevel}</Text>
                )}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Max Stock Level</Text>
                <TextInput
                  style={styles.input}
                  value={formData.maxStockLevel?.toString() || ''}
                  onChangeText={(value) => {
                    const numValue = value === '' ? undefined : parseInt(value) || undefined;
                    updateField('maxStockLevel', numValue);
                  }}
                  placeholder="Optional"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expiry Information</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.expiryDate}
                  onChangeText={(value) => updateField('expiryDate', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Batch Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.batchNumber}
                  onChangeText={(value) => updateField('batchNumber', value)}
                  placeholder="Batch number"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Supplier</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Supplier</Text>
              <TextInput
                style={styles.input}
                value={formData.supplier}
                onChangeText={(value) => updateField('supplier', value)}
                placeholder="Supplier name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
                placeholder="Storage location"
                placeholderTextColor={colors.text.secondary}
              />
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
                {isEdit ? 'Update Supply' : 'Create Supply'}
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
  inputError: {
    borderColor: colors.red[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.red[500],
    marginTop: spacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  radioOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.paper,
  },
  radioOptionActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  radioText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  radioTextActive: {
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
