import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getReceivings,
  createReceiving,
  deleteReceiving,
  getPurchaseOrders,
  getWarehouses,
} from '../../../services/inventory/inventoryMobileApi';
import type {
  Warehouse,
  PurchaseOrder,
  Receiving,
  ReceivingCreate,
  ReceivingItemCreate,
} from '../../../models/inventory';
import { PurchaseOrderStatus } from '../../../models/inventory';
import { AppModal } from '../../../components/layout/AppModal';

const RECEIVING_ELIGIBLE_PO_STATUSES: string[] = [
  PurchaseOrderStatus.ORDERED,
  PurchaseOrderStatus.APPROVED,
];

export function MobileReceivingScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState<Receiving[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [draft, setDraft] = useState<ReceivingCreate>({
    receivingNumber: '',
    purchaseOrderId: '',
    warehouseId: '',
    receivedDate: new Date().toISOString().slice(0, 10),
    notes: '',
    items: [],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [recRes, poRes, whRes] = await Promise.all([
        getReceivings(),
        getPurchaseOrders(),
        getWarehouses(),
      ]);
      setRows(recRes.receivings ?? []);
      setPurchaseOrders(poRes.purchaseOrders ?? []);
      setWarehouses(whRes.warehouses ?? []);
      setDraft((prev) => ({
        ...prev,
        warehouseId: prev.warehouseId || whRes.warehouses?.[0]?.id || '',
      }));
    } catch (e) {
      Alert.alert('Receiving', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory/receiving',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const eligiblePos = useMemo(
    () =>
      purchaseOrders.filter((p) =>
        RECEIVING_ELIGIBLE_PO_STATUSES.includes(
          String(p.status ?? '')
            .trim()
            .toLowerCase(),
        ),
      ),
    [purchaseOrders],
  );

  const poOrderLabel = useMemo(() => {
    const m: Record<string, string> = {};
    purchaseOrders.forEach((p) => {
      m[p.id] = p.orderNumber;
    });
    return m;
  }, [purchaseOrders]);

  const whName = useMemo(() => {
    const m: Record<string, string> = {};
    warehouses.forEach((w) => {
      m[w.id] = w.name;
    });
    return m;
  }, [warehouses]);

  const onSelectPo = (po: PurchaseOrder) => {
    setSelectedPo(po);
    const items: ReceivingItemCreate[] = (po.items ?? []).map((item) => ({
      purchaseOrderId: po.id,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.quantity * item.unitCost,
      receivedQuantity: item.receivedQuantity ?? item.quantity,
      notes: '',
    }));
    setDraft((prev) => ({
      ...prev,
      purchaseOrderId: po.id,
      warehouseId: po.warehouseId || prev.warehouseId,
      items,
    }));
  };

  const setReceivedQty = (index: number, qty: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index ? { ...it, receivedQuantity: qty } : it,
      ),
    }));
  };

  const submit = async () => {
    if (!draft.purchaseOrderId || !draft.warehouseId || !draft.receivedDate) {
      Alert.alert('Receiving', 'Select PO, warehouse, and received date.');
      return;
    }
    if (draft.items.length > 0) {
      const bad = draft.items.filter(
        (it) => it.receivedQuantity < 0 || it.receivedQuantity > it.quantity,
      );
      if (bad.length > 0) {
        Alert.alert(
          'Receiving',
          'Received quantity must be between 0 and ordered quantity.',
        );
        return;
      }
    }
    try {
      await createReceiving(draft);
      setOpen(false);
      setSelectedPo(null);
      setDraft({
        receivingNumber: '',
        purchaseOrderId: '',
        warehouseId: warehouses[0]?.id ?? '',
        receivedDate: new Date().toISOString().slice(0, 10),
        notes: '',
        items: [],
      });
      await load();
    } catch (e) {
      Alert.alert('Receiving', extractErrorMessage(e, 'Failed to save'));
    }
  };

  const removeRec = (r: Receiving) => {
    Alert.alert('Delete receiving', r.receivingNumber, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteReceiving(r.id);
              await load();
            } catch (e) {
              Alert.alert(
                'Receiving',
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
          Receiving
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
            <Text className="py-8 text-center text-slate-500">No receivings</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
              <Text className="font-semibold text-slate-900">
                {item.receivingNumber}
              </Text>
              <Text className="text-sm text-slate-600">
                PO {poOrderLabel[item.purchaseOrderId] ?? item.purchaseOrderId}
              </Text>
              <Text className="mt-1 text-slate-700">
                {whName[item.warehouseId] ?? item.warehouseId} · {item.status}
              </Text>
              {canManageInventory() ? (
                <View className="mt-2 flex-row gap-3">
                  <Pressable onPress={() => removeRec(item)}>
                    <Text className="font-medium text-red-600">Delete</Text>
                  </Pressable>
                </View>
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
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-6 pt-3">
            <Text className="mb-3 text-lg font-semibold text-slate-900">
              Process receiving
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text className="mb-1 text-sm text-slate-600">
                Purchase order
              </Text>
              <ScrollView horizontal className="mb-3">
                {eligiblePos.map((po) => (
                  <Pressable
                    key={po.id}
                    onPress={() => onSelectPo(po)}
                    className={`mr-2 max-w-[220px] rounded-lg border px-3 py-2 ${draft.purchaseOrderId === po.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                  >
                    <Text className="text-slate-900" numberOfLines={2}>
                      {po.orderNumber}
                    </Text>
                    <Text className="text-xs text-slate-600" numberOfLines={1}>
                      {po.supplierName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {eligiblePos.length === 0 ? (
                <Text className="mb-3 text-slate-500">
                  No approved or ordered purchase orders available.
                </Text>
              ) : null}

              <Text className="mb-1 text-sm text-slate-600">Warehouse</Text>
              <ScrollView horizontal className="mb-3">
                {warehouses.map((w) => (
                  <Pressable
                    key={w.id}
                    onPress={() =>
                      setDraft((prev) => ({ ...prev, warehouseId: w.id }))
                    }
                    className={`mr-2 rounded-lg border px-3 py-2 ${draft.warehouseId === w.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                  >
                    <Text className="text-slate-800">{w.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text className="mb-1 text-sm text-slate-600">Received date</Text>
              <TextInput
                value={draft.receivedDate}
                onChangeText={(v) =>
                  setDraft((prev) => ({ ...prev, receivedDate: v }))
                }
                placeholder="YYYY-MM-DD"
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">Notes</Text>
              <TextInput
                value={draft.notes ?? ''}
                onChangeText={(v) =>
                  setDraft((prev) => ({ ...prev, notes: v }))
                }
                multiline
                className="mb-3 min-h-[64px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />

              {selectedPo && draft.items.length > 0 ? (
                <View className="mb-4">
                  <Text className="mb-2 font-medium text-slate-800">
                    Lines ({selectedPo.orderNumber})
                  </Text>
                  {draft.items.map((it, index) => (
                    <View
                      key={`${it.productId}-${index}`}
                      className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-2"
                    >
                      <Text className="font-medium text-slate-900">
                        {it.productName}
                      </Text>
                      <Text className="text-xs text-slate-600">{it.sku}</Text>
                      <Text className="mt-1 text-sm text-slate-700">
                        Ordered {it.quantity}
                      </Text>
                      <Text className="mb-1 mt-2 text-sm text-slate-600">
                        Received qty
                      </Text>
                      <TextInput
                        value={String(it.receivedQuantity)}
                        onChangeText={(t) =>
                          setReceivedQty(index, parseInt(t, 10) || 0)
                        }
                        keyboardType="number-pad"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="mb-4 text-slate-500">
                  Select a purchase order with open status.
                </Text>
              )}

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setOpen(false);
                    setSelectedPo(null);
                  }}
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
    </View>
  );
}
