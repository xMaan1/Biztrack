import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Product, ProductCreate } from '../../../models/pos';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  createProduct,
  deleteProduct,
  fetchPosProducts,
  updateProduct,
} from '../../../services/inventory/inventoryMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { ProductDetailSheet } from './products/ProductDetailSheet';
import { ProductFormModal } from './products/ProductFormModal';
import { ProductListItem } from './products/ProductListItem';
import { BLANK_PRODUCT_FORM, productToForm, type ProductFormState } from './products/types';

type Props = {
  sidebarPathWhenNotDashboard?: string;
  title?: string;
  manageScope?: 'inventory' | 'pos';
};

// ─── Main component ──────────────────────────────────────────────────────────

export function MobileInventoryProductsScreen({
  sidebarPathWhenNotDashboard = '/inventory/products',
  title = 'Products',
  manageScope = 'inventory',
}: Props = {}) {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory, hasPermission, isOwner } = usePermissions();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');

  // detail / edit
  const [detail, setDetail] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(BLANK_PRODUCT_FORM);
  const [saving, setSaving] = useState(false);

  const canEdit =
    manageScope === 'pos'
      ? hasPermission('pos:products:create') ||
        hasPermission('pos:products:update') ||
        hasPermission('pos:create') ||
        isOwner()
      : canManageInventory();

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

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(t) ||
        p.sku.toLowerCase().includes(t) ||
        p.category.toLowerCase().includes(t),
    );
  }, [products, q]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(BLANK_PRODUCT_FORM);
    setFormOpen(true);
  };
  const openEdit = (p: Product) => {
    setDetailOpen(false);
    setEditTarget(p);
    setForm(productToForm(p));
    setFormOpen(true);
  };

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
      expiryDate: form.expiryDate.trim() || undefined,
      batchNumber: form.batchNumber.trim() || undefined,
      serialNumber: form.serialNumber.trim() || undefined,
      mfgDate: form.mfgDate.trim() || undefined,
      dateOfPurchase: form.dateOfPurchase.trim() || undefined,
      modelNo: form.modelNo.trim() || undefined,
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

  const setField = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
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
            <ProductListItem
              item={item}
              canEdit={canEdit}
              onView={(product) => {
                setDetail(product);
                setDetailOpen(true);
              }}
              onEdit={openEdit}
            />
          )}
        />
      )}
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

      <ProductDetailSheet
        visible={detailOpen}
        detail={detail}
        canEdit={canEdit}
        onClose={() => setDetailOpen(false)}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      <ProductFormModal
        visible={formOpen}
        editMode={Boolean(editTarget)}
        saving={saving}
        form={form}
        onClose={() => setFormOpen(false)}
        onSave={() => void handleSave()}
        onFieldChange={setField}
      />
    </View>
  );
}
