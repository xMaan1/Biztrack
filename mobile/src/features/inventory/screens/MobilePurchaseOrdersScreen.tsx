import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
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

function defaultExpectedDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
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
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [orderDate, setOrderDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    defaultExpectedDate,
  );
  const [vatRate, setVatRate] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseOrderItemCreate[]>([]);
  const [productQ, setProductQ] = useState('');
  const [productPicker, setProductPicker] = useState(false);
  const [lineQty, setLineQty] = useState('');
  const [lineCost, setLineCost] = useState('');
  const [lineProduct, setLineProduct] = useState<Product | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPurchaseOrders();
      setRows(res.purchaseOrders ?? []);
    } catch (e) {
      Alert.alert(
        'Purchase orders',
        extractErrorMessage(e, 'Failed to load'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    try {
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
    } catch (e) {
      Alert.alert(
        'Purchase orders',
        extractErrorMessage(e, 'Failed to load'),
      );
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/inventory/purchase-orders',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredProducts = (() => {
    const t = productQ.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t),
    );
  })();

  const addLine = () => {
    if (!lineProduct) {
      Alert.alert('Purchase orders', 'Select a product.');
      return;
    }
    const q = parseFloat(lineQty);
    const c = parseFloat(lineCost);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(c) || c < 0) {
      Alert.alert('Purchase orders', 'Enter quantity and unit cost.');
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
      Alert.alert(
        'Purchase orders',
        'Supplier, warehouse, and expected delivery are required.',
      );
      return;
    }
    if (items.length === 0) {
      Alert.alert('Purchase orders', 'Add at least one line item.');
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
      await createPurchaseOrder(payload);
      setOpen(false);
      setItems([]);
      setNotes('');
      setOrderDate(new Date().toISOString().slice(0, 10));
      setExpectedDeliveryDate(defaultExpectedDate());
      await load();
    } catch (e) {
      Alert.alert(
        'Purchase orders',
        extractErrorMessage(e, 'Failed to save'),
      );
    }
  };

  const removePo = (po: PurchaseOrder) => {
    Alert.alert('Delete purchase order', po.orderNumber, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deletePurchaseOrder(po.id);
              await load();
            } catch (e) {
              Alert.alert(
                'Purchase orders',
                extractErrorMessage(e, 'Failed to delete'),
              );
            }
          })(),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Purchase orders
        </Text>
        {canManageInventory() ? (
          <Pressable onPress={() => setOpen(true)} className="px-2 py-1">
            <Text className="font-semibold text-blue-600">New</Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">
              No purchase orders
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() =>
                canManageInventory() ? removePo(item) : undefined
              }
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">
                {item.orderNumber}
              </Text>
              <Text className="text-sm text-slate-600">{item.supplierName}</Text>
              <Text className="mt-1 text-slate-700">
                {item.status} · {formatUsd(item.totalAmount)}
              </Text>
              {canManageInventory() ? (
                <Text className="mt-1 text-xs text-slate-400">
                  Long-press to delete
                </Text>
              ) : null}
            </Pressable>
          )}
        />
      )}

      <Modal visible={open} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-6 pt-3">
            <Text className="mb-3 text-lg font-semibold text-slate-900">
              New purchase order
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text className="mb-1 text-sm text-slate-600">Supplier</Text>
              <ScrollView horizontal className="mb-3">
                {suppliers.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => setSupplierId(s.id)}
                    className={`mr-2 max-w-[200px] rounded-lg border px-3 py-2 ${supplierId === s.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                  >
                    <Text className="text-slate-800" numberOfLines={1}>
                      {s.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text className="mb-1 text-sm text-slate-600">Warehouse</Text>
              <ScrollView horizontal className="mb-3">
                {warehouses.map((w) => (
                  <Pressable
                    key={w.id}
                    onPress={() => setWarehouseId(w.id)}
                    className={`mr-2 rounded-lg border px-3 py-2 ${warehouseId === w.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                  >
                    <Text className="text-slate-800">{w.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text className="mb-1 text-sm text-slate-600">Order date</Text>
              <TextInput
                value={orderDate}
                onChangeText={setOrderDate}
                placeholder="YYYY-MM-DD"
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">
                Expected delivery
              </Text>
              <TextInput
                value={expectedDeliveryDate}
                onChangeText={setExpectedDeliveryDate}
                placeholder="YYYY-MM-DD"
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">VAT %</Text>
              <TextInput
                value={vatRate}
                onChangeText={setVatRate}
                keyboardType="decimal-pad"
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                className="mb-3 min-h-[64px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />

              <Text className="mb-2 font-medium text-slate-800">Lines</Text>
              {items.map((it, idx) => (
                <View
                  key={`${it.productId}-${idx}`}
                  className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2 py-2"
                >
                  <View className="flex-1 pr-2">
                    <Text className="font-medium text-slate-900" numberOfLines={1}>
                      {it.productName}
                    </Text>
                    <Text className="text-xs text-slate-600">
                      {it.quantity} × {formatUsd(it.unitCost)}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeLine(idx)}>
                    <Text className="text-red-600">Remove</Text>
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={() => setProductPicker(true)}
                className="mb-2 rounded-lg border border-dashed border-slate-300 px-3 py-3"
              >
                <Text className="text-slate-600">Product for new line</Text>
                <Text className="text-slate-900">
                  {lineProduct
                    ? `${lineProduct.name} (${lineProduct.sku})`
                    : 'Tap to select'}
                </Text>
              </Pressable>
              <Text className="mb-1 text-sm text-slate-600">Qty</Text>
              <TextInput
                value={lineQty}
                onChangeText={setLineQty}
                keyboardType="decimal-pad"
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">Unit cost</Text>
              <TextInput
                value={lineCost}
                onChangeText={setLineCost}
                keyboardType="decimal-pad"
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Pressable
                onPress={addLine}
                className="mb-4 items-center rounded-lg bg-slate-200 py-2"
              >
                <Text className="font-medium text-slate-900">Add line</Text>
              </Pressable>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setOpen(false)}
                  className="flex-1 items-center rounded-lg border border-slate-200 py-3"
                >
                  <Text className="font-medium text-slate-800">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void submit()}
                  className="flex-1 items-center rounded-lg bg-blue-600 py-3"
                >
                  <Text className="font-semibold text-white">Create</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={productPicker} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[85%] rounded-t-2xl bg-white px-3 pb-6 pt-3">
            <TextInput
              value={productQ}
              onChangeText={setProductQ}
              placeholder="Search…"
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <FlatList
              data={filteredProducts}
              keyExtractor={(p) => p.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setLineProduct(item);
                    setProductPicker(false);
                    setProductQ('');
                  }}
                  className="border-b border-slate-100 py-3"
                >
                  <Text className="font-medium text-slate-900">{item.name}</Text>
                  <Text className="text-sm text-slate-600">{item.sku}</Text>
                </Pressable>
              )}
            />
            <Pressable
              onPress={() => setProductPicker(false)}
              className="mt-2 items-center py-2"
            >
              <Text className="text-blue-600">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
