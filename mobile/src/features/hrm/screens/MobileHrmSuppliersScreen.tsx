import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  fetchSuppliers,
  createSupplier,
  deleteSupplier,
} from '../../../services/hrm/hrmMobileApi';
import type { Supplier } from '../../../models/hrm';

export function MobileHrmSuppliersScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [detail, setDetail] = useState<Supplier | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchSuppliers(0, 200);
      setRows(res.suppliers ?? []);
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/suppliers',
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
    if (!name.trim() || !code.trim()) {
      Alert.alert('HRM', 'Name and code are required.');
      return;
    }
    try {
      await createSupplier({
        name: name.trim(),
        code: code.trim(),
        isActive: true,
      });
      setOpen(false);
      setName('');
      setCode('');
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to save'));
    }
  };

  const remove = (s: Supplier) => {
    Alert.alert('Delete supplier', s.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteSupplier(s.id);
              setDetail(null);
              await load();
            } catch (e) {
              Alert.alert('HRM', extractErrorMessage(e, 'Failed to delete'));
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
          Suppliers
        </Text>
        {canManageHRM() ? (
          <Pressable onPress={() => setOpen(true)} className="px-2 py-1">
            <Text className="font-semibold text-blue-600">Add</Text>
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
            <Text className="py-8 text-center text-slate-500">No suppliers</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">{item.name}</Text>
              <Text className="text-sm text-slate-600">{item.code}</Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={open} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-white px-4 pb-6 pt-3">
            <Text className="mb-3 text-lg font-semibold text-slate-900">
              New supplier
            </Text>
            <Text className="mb-1 text-sm text-slate-600">Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-1 text-sm text-slate-600">Code</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              className="mb-4 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
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
          </View>
        </View>
      </Modal>

      <Modal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[85%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Supplier</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-bold text-slate-900">{detail.name}</Text>
                <Text className="mt-1 text-slate-600">{detail.code}</Text>
                {detail.email ? (
                  <Text className="mt-2 text-slate-700">{detail.email}</Text>
                ) : null}
                {detail.phone ? (
                  <Text className="text-slate-700">{detail.phone}</Text>
                ) : null}
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row gap-2">
              {detail && canManageHRM() ? (
                <Pressable
                  onPress={() => remove(detail)}
                  className="flex-1 items-center rounded-lg bg-red-600 py-3"
                >
                  <Text className="font-semibold text-white">Delete</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setDetail(null)}
                className="flex-1 items-center rounded-lg bg-slate-100 py-3"
              >
                <Text className="font-semibold text-slate-800">Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
