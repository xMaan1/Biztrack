import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '../../../services/inventory/inventoryMobileApi';
import type { Warehouse, WarehouseCreate } from '../../../models/inventory';
import { usePermissions } from '../../../hooks/usePermissions';
import { AppModal } from '../../../components/layout/AppModal';

export function MobileWarehousesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWarehouses();
      setRows(res.warehouses ?? []);
    } catch (e) {
      Alert.alert('Warehouses', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory/warehouses',
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
    if (!name.trim() || !code.trim() || !address.trim() || !city.trim()) {
      Alert.alert('Warehouses', 'Name, code, address, and city are required.');
      return;
    }
    const payload: WarehouseCreate = {
      name: name.trim(),
      code: code.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim() || '—',
      country: country.trim() || '—',
      postalCode: postalCode.trim() || '0000',
      isActive: true,
    };
    try {
      if (editingId) {
        await updateWarehouse(editingId, payload);
      } else {
        await createWarehouse(payload);
      }
      setOpen(false);
      setEditingId(null);
      setName('');
      setCode('');
      setAddress('');
      setCity('');
      setState('');
      setCountry('');
      setPostalCode('');
      await load();
    } catch (e) {
      Alert.alert('Warehouses', extractErrorMessage(e, 'Failed to save'));
    }
  };

  const openEdit = (w: Warehouse) => {
    setEditingId(w.id);
    setName(w.name);
    setCode(w.code);
    setAddress(w.address);
    setCity(w.city);
    setState(w.state || '');
    setCountry(w.country || '');
    setPostalCode(w.postalCode || '');
    setOpen(true);
  };

  const remove = (w: Warehouse) => {
    Alert.alert('Delete warehouse', w.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteWarehouse(w.id);
              await load();
            } catch (e) {
              Alert.alert(
                'Warehouses',
                extractErrorMessage(e, 'Failed to delete'),
              );
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
          Warehouses
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
            <Text className="py-8 text-center text-slate-500">No warehouses</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="font-semibold text-slate-900">{item.name}</Text>
              <Text className="text-sm text-slate-600">{item.code}</Text>
              <Text className="mt-1 text-slate-700">
                {item.city}, {item.country}
              </Text>
              {canManageInventory() ? (
                <View className="mt-2 flex-row gap-3">
                  <Pressable onPress={() => openEdit(item)}>
                    <Text className="font-medium text-blue-600">Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(item)}>
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
        onClose={() => setOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
          <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
            <Pressable
              onPress={() => {
                setOpen(false);
                setEditingId(null);
              }}
              className="px-2 py-1"
            >
              <Text className="font-semibold text-slate-500">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-black text-slate-900">
              {editingId ? 'Edit Warehouse' : 'New Warehouse'}
            </Text>
            <Pressable
              onPress={() => void submit()}
              className="rounded-xl bg-blue-600 px-5 py-2 active:bg-blue-700"
            >
              <Text className="font-bold text-white">Save</Text>
            </Pressable>
          </View>
          <ScrollView
            className="flex-1 px-4 py-5"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 48 }}
          >
            <View className="rounded-2xl border border-slate-200 bg-white p-4">
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
            <Text className="mb-1 text-sm font-medium text-slate-700">Address</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-1 text-sm font-medium text-slate-700">City</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-1 text-sm font-medium text-slate-700">State</Text>
            <TextInput
              value={state}
              onChangeText={setState}
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-1 text-sm font-medium text-slate-700">Country</Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-1 text-sm font-medium text-slate-700">Postal code</Text>
            <TextInput
              value={postalCode}
              onChangeText={setPostalCode}
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            </View>
          </ScrollView>
        </SafeAreaView>
      </AppModal>
    </View>
  );
}
