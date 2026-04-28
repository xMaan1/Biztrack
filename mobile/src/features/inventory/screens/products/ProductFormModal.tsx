import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UnitOfMeasure } from '../../../../models/pos';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from './helpers';
import type { ProductFormState } from './types';
import { ProductChipSelect } from './ProductChipSelect';
import { ProductFieldRow } from './ProductFieldRow';
import { AppModal } from '../../../../components/layout/AppModal';

type Props = {
  visible: boolean;
  editMode: boolean;
  saving: boolean;
  form: ProductFormState;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => void;
};

export function ProductFormModal({
  visible,
  editMode,
  saving,
  form,
  onClose,
  onSave,
  onFieldChange,
}: Props) {
  return (
    <AppModal visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 14 }}>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a' }}>
              {editMode ? 'Edit Product' : 'New Product'}
            </Text>
            <Pressable
              onPress={onSave}
              disabled={saving}
              style={{
                backgroundColor: saving ? '#93c5fd' : '#2563eb',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save</Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Basic Info
            </Text>
            <ProductFieldRow label="Product Name *" value={form.name} onChange={(v) => onFieldChange('name', v)} placeholder="e.g. Wireless Mouse" />
            <ProductFieldRow label="SKU *" value={form.sku} onChange={(v) => onFieldChange('sku', v)} placeholder="e.g. WL-MOUSE-001" />
            <ProductFieldRow label="Description" value={form.description} onChange={(v) => onFieldChange('description', v)} placeholder="Optional product description…" multiline />
            <ProductFieldRow label="Barcode" value={form.barcode} onChange={(v) => onFieldChange('barcode', v)} placeholder="Optional" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Expiry Date" value={form.expiryDate} onChange={(v) => onFieldChange('expiryDate', v)} placeholder="YYYY-MM-DD" />
              </View>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Mfg. Date" value={form.mfgDate} onChange={(v) => onFieldChange('mfgDate', v)} placeholder="YYYY-MM-DD" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Date of Purchase" value={form.dateOfPurchase} onChange={(v) => onFieldChange('dateOfPurchase', v)} placeholder="YYYY-MM-DD" />
              </View>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Batch Number" value={form.batchNumber} onChange={(v) => onFieldChange('batchNumber', v)} placeholder="Optional" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Serial Number" value={form.serialNumber} onChange={(v) => onFieldChange('serialNumber', v)} placeholder="Optional" />
              </View>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Model No." value={form.modelNo} onChange={(v) => onFieldChange('modelNo', v)} placeholder="Optional" />
              </View>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pricing
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Selling Price" value={form.unitPrice} onChange={(v) => onFieldChange('unitPrice', v)} keyboardType="decimal-pad" placeholder="0.00" />
              </View>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Cost Price" value={form.costPrice} onChange={(v) => onFieldChange('costPrice', v)} keyboardType="decimal-pad" placeholder="0.00" />
              </View>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 4, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Stock
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Quantity" value={form.stockQuantity} onChange={(v) => onFieldChange('stockQuantity', v)} keyboardType="number-pad" placeholder="0" />
              </View>
              <View style={{ flex: 1 }}>
                <ProductFieldRow label="Min Level" value={form.minStockLevel} onChange={(v) => onFieldChange('minStockLevel', v)} keyboardType="number-pad" placeholder="0" />
              </View>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 4, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Category
            </Text>
            <ProductChipSelect
              label=""
              options={PRODUCT_CATEGORIES}
              value={form.category}
              onChange={(v) => onFieldChange('category', v)}
            />

            <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Unit of Measure
            </Text>
            <ProductChipSelect
              label=""
              options={PRODUCT_UNITS}
              value={form.unitOfMeasure}
              onChange={(v) => onFieldChange('unitOfMeasure', v as UnitOfMeasure)}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AppModal>
  );
}
