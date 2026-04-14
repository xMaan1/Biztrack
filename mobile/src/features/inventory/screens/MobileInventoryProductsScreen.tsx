import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  fetchPosProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../../services/inventory/inventoryMobileApi';
import {
  ProductCategory,
  UnitOfMeasure,
  type Product,
  type ProductCreate,
} from '../../../models/pos';
import { usePermissions } from '../../../hooks/usePermissions';

// ─── helpers ────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  sku: string;
  description: string;
  unitPrice: string;
  costPrice: string;
  stockQuantity: string;
  minStockLevel: string;
  category: string;
  unitOfMeasure: UnitOfMeasure;
  barcode: string;
};

const BLANK_FORM: FormState = {
  name: '',
  sku: '',
  description: '',
  unitPrice: '',
  costPrice: '',
  stockQuantity: '0',
  minStockLevel: '0',
  category: ProductCategory.OTHER,
  unitOfMeasure: UnitOfMeasure.PIECE,
  barcode: '',
};

const CATEGORIES = Object.values(ProductCategory);
const UNITS = Object.values(UnitOfMeasure);

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    sku: p.sku,
    description: p.description ?? '',
    unitPrice: String(p.unitPrice),
    costPrice: String(p.costPrice),
    stockQuantity: String(p.stockQuantity),
    minStockLevel: String(p.minStockLevel),
    category: p.category,
    unitOfMeasure: p.unitOfMeasure as UnitOfMeasure,
    barcode: p.barcode ?? '',
  };
}

function stockColor(qty: number, min: number) {
  if (qty <= 0) return '#ef4444';
  if (qty <= min) return '#f97316';
  return '#22c55e';
}

// ─── FieldRow ────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  multiline?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        placeholderTextColor="#94a3b8"
        style={{
          borderWidth: 1,
          borderColor: '#e2e8f0',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 10,
          fontSize: 15,
          color: '#0f172a',
          backgroundColor: '#f8fafc',
          minHeight: multiline ? 72 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

// ─── ChipSelect ──────────────────────────────────────────────────────────────

function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pb-1">
          {options.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: value === opt ? '#2563eb' : '#f1f5f9',
                borderWidth: 1,
                borderColor: value === opt ? '#2563eb' : '#e2e8f0',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: value === opt ? '#fff' : '#475569',
                  textTransform: 'capitalize',
                }}
              >
                {opt.replace(/_/g, ' ')}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  sidebarPathWhenNotDashboard?: string;
  title?: string;
};

// ─── Main component ──────────────────────────────────────────────────────────

export function MobileInventoryProductsScreen({
  sidebarPathWhenNotDashboard = '/inventory/products',
  title = 'Products',
}: Props = {}) {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');

  // detail / edit
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // create / edit form
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  const canEdit = canManageInventory();

  // ── load ──
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPosProducts();
      setProducts(res.products ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : sidebarPathWhenNotDashboard,
    );
  }, [setSidebarActivePath, workspacePath, sidebarPathWhenNotDashboard]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // ── filter ──
  const filtered = products.filter((p) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (
      p.name.toLowerCase().includes(t) ||
      p.sku.toLowerCase().includes(t) ||
      p.category.toLowerCase().includes(t)
    );
  });

  // ── open create ──
  const openCreate = () => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setFormOpen(true);
  };

  // ── open edit ──
  const openEdit = (p: Product) => {
    setDetailOpen(false);
    setEditTarget(p);
    setForm(productToForm(p));
    setFormOpen(true);
  };

  // ── save (create or update) ──
  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      Alert.alert('Products', 'Name and SKU are required.');
      return;
    }
    const payload: ProductCreate = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim() || undefined,
      unitPrice: parseFloat(form.unitPrice) || 0,
      costPrice: parseFloat(form.costPrice) || 0,
      stockQuantity: parseInt(form.stockQuantity, 10) || 0,
      minStockLevel: parseInt(form.minStockLevel, 10) || 0,
      category: form.category,
      unitOfMeasure: form.unitOfMeasure,
      barcode: form.barcode.trim() || undefined,
    };
    try {
      setSaving(true);
      if (editTarget) {
        await updateProduct(editTarget.id, payload);
      } else {
        await createProduct(payload);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Products', extractErrorMessage(e, 'Failed to save product'));
    } finally {
      setSaving(false);
    }
  };

  // ── delete ──
  const handleDelete = (p: Product) => {
    Alert.alert('Delete product', `Delete "${p.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(p.id);
            setDetailOpen(false);
            setDetail(null);
            await load();
          } catch (e) {
            Alert.alert('Products', extractErrorMessage(e, 'Failed to delete'));
          }
        },
      },
    ]);
  };

  // ── field helper ──
  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
          backgroundColor: '#fff',
          paddingHorizontal: 8,
          paddingVertical: 8,
        }}
      >
        <MenuHeaderButton />
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#0f172a' }}>
          {title}
        </Text>
        {canEdit ? (
          <Pressable
            onPress={openCreate}
            style={{
              backgroundColor: '#2563eb',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>New</Text>
          </Pressable>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>

      {/* ── Search ── */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}>
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search name, SKU or category…"
            placeholderTextColor="#94a3b8"
            style={{ flex: 1, marginLeft: 8, fontSize: 14, color: '#0f172a' }}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── List ── */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
              <Text style={{ marginTop: 12, color: '#94a3b8', fontSize: 16 }}>No products found</Text>
              {canEdit && (
                <Pressable
                  onPress={openCreate}
                  style={{ marginTop: 16, backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Create first product</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { setDetail(item); setDetailOpen(true); }}
              style={{
                marginBottom: 10,
                borderRadius: 14,
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                padding: 14,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: '#0f172a' }}>{item.name}</Text>
                  <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>SKU: {item.sku}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '700', fontSize: 15, color: '#1d4ed8' }}>{formatUsd(item.unitPrice)}</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>cost {formatUsd(item.costPrice)}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                {/* Stock badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: stockColor(item.stockQuantity, item.minStockLevel) }} />
                  <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Stock {item.stockQuantity}</Text>
                </View>
                {/* Category badge */}
                <View style={{ backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '600', textTransform: 'capitalize' }}>{item.category}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* ── FAB (alternate create button) ── */}
      {canEdit && (
        <Pressable
          onPress={openCreate}
          style={{
            position: 'absolute',
            bottom: 28,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#2563eb',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#2563eb',
            shadowOpacity: 0.4,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}

      {/* ─────────── Detail Bottom Sheet ─────────── */}
      <Modal visible={detailOpen} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0' }} />
            </View>

            {detail && (
              <ScrollView style={{ paddingHorizontal: 20, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Name + badges */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>{detail.name}</Text>
                    <Text style={{ color: '#64748b', fontSize: 13 }}>SKU: {detail.sku}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#1d4ed8' }}>{formatUsd(detail.unitPrice)}</Text>
                  </View>
                </View>

                {detail.description ? (
                  <Text style={{ marginTop: 10, color: '#475569', lineHeight: 20 }}>{detail.description}</Text>
                ) : null}

                {/* Info grid */}
                <View style={{ marginTop: 16, backgroundColor: '#f8fafc', borderRadius: 14, padding: 14 }}>
                  {[
                    { label: 'Cost Price', value: formatUsd(detail.costPrice) },
                    { label: 'Stock', value: String(detail.stockQuantity), color: stockColor(detail.stockQuantity, detail.minStockLevel) },
                    { label: 'Min Stock', value: String(detail.minStockLevel) },
                    { label: 'Category', value: detail.category },
                    { label: 'Unit', value: detail.unitOfMeasure },
                    ...(detail.barcode ? [{ label: 'Barcode', value: detail.barcode }] : []),
                  ].map(({ label, value, color }) => (
                    <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                      <Text style={{ color: '#64748b', fontSize: 14 }}>{label}</Text>
                      <Text style={{ color: color ?? '#0f172a', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>{value}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions */}
                {canEdit && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                    <Pressable
                      onPress={() => openEdit(detail)}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 13 }}
                    >
                      <Ionicons name="pencil" size={16} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(detail)}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 12, paddingVertical: 13 }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 15 }}>Delete</Text>
                    </Pressable>
                  </View>
                )}

                <Pressable
                  onPress={() => setDetailOpen(false)}
                  style={{ marginTop: 12, alignItems: 'center', paddingVertical: 13, backgroundColor: '#f1f5f9', borderRadius: 12 }}
                >
                  <Text style={{ color: '#475569', fontWeight: '600', fontSize: 15 }}>Close</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ─────────── Create / Edit Modal ─────────── */}
      <Modal visible={formOpen} animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 14 }}>
              <Pressable onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a' }}>
                {editTarget ? 'Edit Product' : 'New Product'}
              </Text>
              <Pressable
                onPress={() => void handleSave()}
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
              {/* Basic Info */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Basic Info
              </Text>
              <FieldRow label="Product Name *" value={form.name} onChange={(v) => setField('name', v)} placeholder="e.g. Wireless Mouse" />
              <FieldRow label="SKU *" value={form.sku} onChange={(v) => setField('sku', v)} placeholder="e.g. WL-MOUSE-001" />
              <FieldRow label="Description" value={form.description} onChange={(v) => setField('description', v)} placeholder="Optional product description…" multiline />
              <FieldRow label="Barcode" value={form.barcode} onChange={(v) => setField('barcode', v)} placeholder="Optional" />

              {/* Pricing */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Pricing
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <FieldRow label="Selling Price" value={form.unitPrice} onChange={(v) => setField('unitPrice', v)} keyboardType="decimal-pad" placeholder="0.00" />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldRow label="Cost Price" value={form.costPrice} onChange={(v) => setField('costPrice', v)} keyboardType="decimal-pad" placeholder="0.00" />
                </View>
              </View>

              {/* Stock */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 4, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Stock
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <FieldRow label="Quantity" value={form.stockQuantity} onChange={(v) => setField('stockQuantity', v)} keyboardType="number-pad" placeholder="0" />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldRow label="Min Level" value={form.minStockLevel} onChange={(v) => setField('minStockLevel', v)} keyboardType="number-pad" placeholder="0" />
                </View>
              </View>

              {/* Category */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 4, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Category
              </Text>
              <ChipSelect
                label=""
                options={CATEGORIES}
                value={form.category}
                onChange={(v) => setField('category', v)}
              />

              {/* Unit of Measure */}
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Unit of Measure
              </Text>
              <ChipSelect
                label=""
                options={UNITS}
                value={form.unitOfMeasure}
                onChange={(v) => setField('unitOfMeasure', v as UnitOfMeasure)}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
