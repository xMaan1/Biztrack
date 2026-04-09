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
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getWarehouses,
  getStorageLocations,
  createStorageLocation,
  deleteStorageLocation,
} from '../../../services/inventory/inventoryMobileApi';
import type { StorageLocation, StorageLocationCreate, Warehouse } from '../../../models/inventory';
import { usePermissions } from '../../../hooks/usePermissions';

export function MobileStorageLocationsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [rows, setRows] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [locationType, setLocationType] = useState('shelf');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const wr = await getWarehouses();
      const list = wr.warehouses ?? [];
      setWarehouses(list);
      let wid = warehouseId;
      if (!wid && list[0]) {
        wid = list[0].id;
        setWarehouseId(wid);
      }
      const res = await getStorageLocations(wid || undefined);
      setRows(res.storageLocations ?? []);
    } catch (e) {
      Alert.alert('Storage', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/inventory/storage-locations',
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

  const submit = async () => {
    const wid = warehouseId || warehouses[0]?.id;
    if (!wid || !name.trim() || !code.trim()) {
      Alert.alert('Storage', 'Warehouse, name, and code are required.');
      return;
    }
    const payload: StorageLocationCreate = {
      warehouseId: wid,
      name: name.trim(),
      code: code.trim(),
      locationType: locationType.trim() || 'shelf',
      isActive: true,
    };
    try {
      await createStorageLocation(payload);
      setOpen(false);
      setName('');
      setCode('');
      await load();
    } catch (e) {
      Alert.alert('Storage', extractErrorMessage(e, 'Failed to save'));
    }
  };

  const remove = (s: StorageLocation) => {
    Alert.alert('Delete location', s.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteStorageLocation(s.id);
              await load();
            } catch (e) {
              Alert.alert('Storage', extractErrorMessage(e, 'Failed'));
            }
          })(),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Storage
        </Text>
        {canManageInventory() ? (
          <Pressable
            onPress={() => setOpen(true)}
            className="rounded-lg bg-blue-600 px-3 py-2"
          >
            <Text className="font-semibold text-white">New</Text>
          </Pressable>
        ) : (
          <View className="w-14" />
        )}
      </View>

      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <Text className="mb-1 text-xs font-medium text-slate-600">Warehouse</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {warehouses.map((w) => (
              <Pressable
                key={w.id}
                onPress={() => setWarehouseId(w.id)}
                className={`rounded-full px-3 py-1.5 ${
                  warehouseId === w.id ? 'bg-blue-600' : 'bg-slate-100'
                }`}
              >
                <Text
                  className={
                    warehouseId === w.id
                      ? 'font-medium text-white'
                      : 'text-slate-800'
                  }
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
              No locations
            </Text>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="font-semibold text-slate-900">{item.name}</Text>
              <Text className="text-sm text-slate-600">{item.code}</Text>
              <Text className="mt-1 text-xs text-slate-500">{item.locationType}</Text>
              {canManageInventory() ? (
                <Pressable onPress={() => remove(item)} className="mt-2">
                  <Text className="font-medium text-red-600">Delete</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />
      )}

      <Modal visible={open} animationType="slide">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-3 py-3">
            <Pressable onPress={() => setOpen(false)}>
              <Text className="text-blue-600">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-semibold">New location</Text>
            <Pressable onPress={() => void submit()}>
              <Text className="font-semibold text-blue-600">Save</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-3">
            <Text className="mb-1 text-sm font-medium text-slate-700">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-1 text-sm font-medium text-slate-700">Code</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-1 text-sm font-medium text-slate-700">Type</Text>
            <TextInput
              value={locationType}
              onChangeText={setLocationType}
              className="mb-8 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
