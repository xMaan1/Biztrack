import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  deletePurchaseOrder,
  getWarehouses,
  fetchPosProducts,
} from '../../../services/inventory/inventoryMobileApi';
import { fetchSuppliers } from '../../../services/inventory/hrmSuppliersApi';
import type {
  Warehouse,
  PurchaseOrder,
  PurchaseOrderCreate,
  PurchaseOrderItemCreate,
} from '../../../models/inventory';
import type { Product } from '../../../models/pos';
import type { Supplier } from '../../../models/hrm/supplier';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPrimaryButton,
  WorkshopPickerField,
  WorkshopSearchBar,
  WS,
} from '../../workshop/components/WorkshopChrome';

function defaultExpectedDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function OptionChips(props: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: WS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 8,
        }}
      >
        {props.label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 2 }}>
          {props.options.map((opt) => {
            const active = props.value === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => props.onChange(opt.id)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: active ? WS.primaryLight : '#fafafa',
                  borderWidth: 1,
                  borderColor: active ? WS.primary : WS.border,
                  maxWidth: 200,
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: '600', color: active ? WS.primaryDark : WS.text }}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function MobilePurchaseOrdersScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(defaultExpectedDate);
  const [vatRate, setVatRate] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseOrderItemCreate[]>([]);
  const [productQ, setProductQ] = useState('');
  const [productPicker, setProductPicker] = useState(false);
  const [lineQty, setLineQty] = useState('');
  const [lineCost, setLineCost] = useState('');
  const [lineProduct, setLineProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    const res = await getPurchaseOrders();
    setRows(res.purchaseOrders ?? []);
  }, []);

  const loadMeta = useCallback(async () => {
    const [whRes, supRes, prRes] = await Promise.all([
      getWarehouses(),
      fetchSuppliers(),
      fetchPosProducts(),
    ]);
    setWarehouses(whRes.warehouses ?? []);
    setSuppliers(supRes.suppliers ?? []);
    setProducts(prRes.products ?? []);
    setSupplierId((prev) => prev || supRes.suppliers?.[0]?.id || '');
    setWarehouseId((prev) => prev || whRes.warehouses?.[0]?.id || '');
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        appError('Purchase orders', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory/purchase-orders',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadMeta().catch((e) =>
      appError('Purchase orders', extractErrorMessage(e, 'Failed to load')),
    );
  }, [loadMeta]);

  useEffect(() => {
    void run(false);
  }, [run]);

  const filteredProducts = useMemo(() => {
    const t = productQ.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t),
    );
  }, [products, productQ]);

  const addLine = () => {
    if (!lineProduct) {
      appAlert('Purchase orders', 'Select a product.');
      return;
    }
    const q = parseFloat(lineQty);
    const c = parseFloat(lineCost);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(c) || c < 0) {
      appAlert('Purchase orders', 'Enter quantity and unit cost.');
      return;
    }
    const line: PurchaseOrderItemCreate = {
      productId: lineProduct.id,
      productName: lineProduct.name,
      sku: lineProduct.sku,
      quantity: q,
      unitCost: c,
      totalCost: q * c,
    };
    setItems((prev) => [...prev, line]);
    setLineProduct(null);
    setLineQty('');
    setLineCost('');
    setProductQ('');
  };

  const removeLine = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup || !warehouseId || !expectedDeliveryDate.trim()) {
      appAlert('Purchase orders', 'Supplier, warehouse, and expected delivery are required.');
      return;
    }
    if (items.length === 0) {
      appAlert('Purchase orders', 'Add at least one line item.');
      return;
    }
    const vr = parseFloat(vatRate);
    const payload: PurchaseOrderCreate = {
      supplierId: sup.id,
      supplierName: sup.name,
      warehouseId,
      orderDate: orderDate.trim(),
      expectedDeliveryDate: expectedDeliveryDate.trim(),
      vatRate: Number.isFinite(vr) ? vr : 0,
      notes: notes.trim() || undefined,
      items,
    };
    try {
      setSaving(true);
      await createPurchaseOrder(payload);
      setOpen(false);
      setItems([]);
      setNotes('');
      setOrderDate(new Date().toISOString().slice(0, 10));
      setExpectedDeliveryDate(defaultExpectedDate());
      await run(false);
    } catch (e) {
      appError('Purchase orders', extractErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const removePo = (po: PurchaseOrder) => {
    appConfirm({
      title: 'Delete purchase order',
      message: po.orderNumber,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deletePurchaseOrder(po.id);
          await run(false);
        } catch (e) {
          appError('Purchase orders', extractErrorMessage(e, 'Failed to delete'));
        }
      },
    });
  };

  return (
    <WorkshopChrome
      title="Purchase orders"
      subtitle="Supplier orders & procurement"
      right={canManageInventory() ? <WorkshopHeaderButton onPress={() => setOpen(true)} /> : <View style={{ width: 72 }} />}
      scroll={false}
    >
      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor={WS.primary}
            />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="clipboard-outline"
              title="No purchase orders"
              subtitle="Create purchase orders to restock from suppliers."
              actionLabel={canManageInventory() ? 'New order' : undefined}
              onAction={canManageInventory() ? () => setOpen(true) : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="clipboard"
              iconColor="#7c3aed"
              iconBg="#f5f3ff"
              title={item.orderNumber}
              subtitle={item.supplierName}
              meta={formatUsd(item.totalAmount)}
              badges={[{ label: item.status, tone: 'status' }]}
              actions={
                canManageInventory()
                  ? [{ icon: 'trash-outline', onPress: () => removePo(item), danger: true }]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={open}
        title="New purchase order"
        onClose={() => setOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Creating…' : 'Create order'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable
              onPress={() => setOpen(false)}
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <OptionChips
          label="Supplier"
          options={suppliers.map((s) => ({ id: s.id, label: s.name }))}
          value={supplierId}
          onChange={setSupplierId}
        />
        <OptionChips
          label="Warehouse"
          options={warehouses.map((w) => ({ id: w.id, label: w.name }))}
          value={warehouseId}
          onChange={setWarehouseId}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Order date" value={orderDate} onChange={setOrderDate} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Expected delivery" value={expectedDeliveryDate} onChange={setExpectedDeliveryDate} />
          </View>
        </View>
        <WorkshopFieldLabel>VAT %</WorkshopFieldLabel>
        <WorkshopTextInput value={vatRate} onChangeText={setVatRate} keyboardType="decimal-pad" />
        <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
        <WorkshopTextInput value={notes} onChangeText={setNotes} multiline style={{ minHeight: 64 }} />

        <Text style={{ fontSize: 14, fontWeight: '700', color: WS.text, marginTop: 8, marginBottom: 8 }}>
          Line items
        </Text>
        {items.map((it, idx) => (
          <View
            key={`${it.productId}-${idx}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
              padding: 10,
              borderRadius: 12,
              backgroundColor: '#f8fafc',
              borderWidth: 1,
              borderColor: WS.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontWeight: '600', color: WS.text }} numberOfLines={1}>
                {it.productName}
              </Text>
              <Text style={{ fontSize: 12, color: WS.textMuted, marginTop: 2 }}>
                {it.quantity} × {formatUsd(it.unitCost)}
              </Text>
            </View>
            <Pressable onPress={() => removeLine(idx)}>
              <Text style={{ color: WS.danger, fontWeight: '600' }}>Remove</Text>
            </Pressable>
          </View>
        ))}

        <WorkshopPickerField
          label="Product for new line"
          value={lineProduct ? `${lineProduct.name} (${lineProduct.sku})` : ''}
          placeholder="Tap to select"
          onPress={() => setProductPicker(true)}
        />
        <WorkshopFieldLabel>Quantity</WorkshopFieldLabel>
        <WorkshopTextInput value={lineQty} onChangeText={setLineQty} keyboardType="decimal-pad" />
        <WorkshopFieldLabel>Unit cost</WorkshopFieldLabel>
        <WorkshopTextInput value={lineCost} onChangeText={setLineCost} keyboardType="decimal-pad" />
        <Pressable
          onPress={addLine}
          style={{
            alignItems: 'center',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: WS.border,
            backgroundColor: '#f1f5f9',
            paddingVertical: 12,
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: '700', color: WS.text }}>Add line</Text>
        </Pressable>
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={productPicker}
        title="Select product"
        onClose={() => setProductPicker(false)}
        footer={
          <Pressable
            onPress={() => setProductPicker(false)}
            style={{ alignItems: 'center', paddingVertical: 10 }}
          >
            <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Close</Text>
          </Pressable>
        }
      >
        <WorkshopSearchBar value={productQ} onChangeText={setProductQ} placeholder="Search products…" />
        <FlatList
          data={filteredProducts}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 320 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setLineProduct(item);
                setProductPicker(false);
                setProductQ('');
              }}
              style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
            >
              <Text style={{ fontWeight: '600', color: WS.text }}>{item.name}</Text>
              <Text style={{ fontSize: 13, color: WS.textMuted, marginTop: 2 }}>{item.sku}</Text>
            </Pressable>
          )}
        />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
