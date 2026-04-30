import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getCustomerReturns,
  createCustomerReturn,
  getWarehouses,
  fetchPosProducts,
} from '../../../services/inventory/inventoryMobileApi';
import type { Warehouse, StockMovement } from '../../../models/inventory';
import { StockMovementType, StockMovementCreate } from '../../../models/inventory';
import type { Product } from '../../../models/pos';
import { AppModal } from '../../../components/layout/AppModal';

export function MobileCustomerReturnsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filterWhId, setFilterWhId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productQ, setProductQ] = useState('');
  const [productPicker, setProductPicker] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [productLabel, setProductLabel] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const loadMeta = useCallback(async () => {
    try {
      const [whRes, prRes] = await Promise.all([
        getWarehouses(),
        fetchPosProducts(),
      ]);
      setWarehouses(whRes.warehouses ?? []);
      setProducts(prRes.products ?? []);
      setWarehouseId((prev) => prev || whRes.warehouses?.[0]?.id || '');
    } catch (e) {
      Alert.alert(
        'Customer returns',
        extractErrorMessage(e, 'Failed to load'),
      );
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomerReturns(filterWhId);
      setRows(res.stockMovements ?? []);
    } catch (e) {
      Alert.alert(
        'Customer returns',
        extractErrorMessage(e, 'Failed to load'),
      );
    } finally {
      setLoading(false);
    }
  }, [filterWhId]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/inventory/customer-returns',
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

  const filteredProducts = useMemo(() => {
    const t = productQ.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t),
    );
  }, [products, productQ]);

  const pickProduct = (p: Product) => {
    setProductId(p.id);
    setProductLabel(`${p.name} (${p.sku})`);
    setProductPicker(false);
    setProductQ('');
  };

  const submit = async () => {
    if (!productId || !warehouseId) {
      Alert.alert('Customer returns', 'Select product and warehouse.');
      return;
    }
    const q = parseFloat(quantity);
    const c = parseFloat(unitCost);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(c) || c < 0) {
      Alert.alert('Customer returns', 'Enter valid quantity and unit cost.');
      return;
    }
    const payload: StockMovementCreate = {
      productId,
      warehouseId,
      movementType: StockMovementType.RETURN,
      quantity: q,
      unitCost: c,
      notes: notes.trim() || undefined,
      referenceNumber: referenceNumber.trim() || undefined,
    };
    try {
      await createCustomerReturn(payload);
      setOpen(false);
      setQuantity('');
      setUnitCost('');
      setNotes('');
      setReferenceNumber('');
      setProductId('');
      setProductLabel('');
      await load();
    } catch (e) {
      Alert.alert(
        'Customer returns',
        extractErrorMessage(e, 'Failed to save'),
      );
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Customer returns
        </Text>
        {canManageInventory() ? (
          <Pressable onPress={() => setOpen(true)} className="px-2 py-1">
            <Text className="font-semibold text-blue-600">Add</Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <Text className="mb-1 text-xs font-medium text-slate-600">Warehouse</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setFilterWhId(undefined)}
              className={`rounded-full px-3 py-1.5 ${!filterWhId ? 'bg-blue-600' : 'bg-slate-100'}`}
            >
              <Text className={!filterWhId ? 'font-medium text-white' : 'text-slate-800'}>
                All
              </Text>
            </Pressable>
            {warehouses.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => setFilterWhId(w.id)}
                className={`max-w-[180px] rounded-full px-3 py-1.5 ${filterWhId === w.id ? 'bg-blue-600' : 'bg-slate-100'}`}
              >
                <Text
                  className={filterWhId === w.id ? 'font-medium text-white' : 'text-slate-800'}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {w.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
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
              No customer returns
            </Text>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
              <Text className="font-semibold text-slate-900">
                {item.productName ?? 'Product'}
              </Text>
              <Text className="text-xs text-slate-500">{item.productSku}</Text>
              <Text className="mt-1 text-slate-700">
                Qty {item.quantity} · ${item.unitCost}
              </Text>
              {item.referenceNumber ? (
                <Text className="text-xs text-slate-500">
                  Ref {item.referenceNumber}
                </Text>
              ) : null}
            </View>
          )}
        />
      )}

      <AppModal
        visible={open}
        animationType="slide"
        transparent
        onClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-6 pt-3">
            <Text className="mb-3 text-lg font-semibold text-slate-900">
              New customer return
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
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

              <Pressable
                onPress={() => setProductPicker(true)}
                className="mb-3 rounded-lg border border-slate-200 px-3 py-3"
              >
                <Text className="text-slate-600">Product</Text>
                <Text className="text-slate-900">
                  {productLabel || 'Tap to select'}
                </Text>
              </Pressable>

              <Text className="mb-1 text-sm text-slate-600">Quantity</Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">Unit cost</Text>
              <TextInput
                value={unitCost}
                onChangeText={setUnitCost}
                keyboardType="decimal-pad"
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">
                Reference (opt)
              </Text>
              <TextInput
                value={referenceNumber}
                onChangeText={setReferenceNumber}
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                className="mb-4 min-h-[72px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
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
                  <Text className="font-semibold text-white">Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </AppModal>

      <AppModal
        visible={productPicker}
        animationType="slide"
        transparent
        onClose={() => setProductPicker(false)}
      >
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
                  onPress={() => pickProduct(item)}
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
      </AppModal>
    </View>
  );
}
