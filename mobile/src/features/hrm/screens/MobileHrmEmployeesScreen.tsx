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
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getEmployees, deleteEmployee } from '../../../services/hrm/hrmMobileApi';
import type { Employee } from '../../../models/hrm';

export function MobileHrmEmployeesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Employee | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getEmployees(1, 200, q.trim() ? { search: q.trim() } : undefined);
      setRows(res.employees ?? []);
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/employees',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    const t = setTimeout(() => void load(), q.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const remove = (e: Employee) => {
    Alert.alert('Delete employee', `${e.firstName} ${e.lastName}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteEmployee(e.id);
              setDetail(null);
              await load();
            } catch (err) {
              Alert.alert('HRM', extractErrorMessage(err, 'Failed to delete'));
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
          Employees
        </Text>
        <View className="w-10" />
      </View>
      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search name, email, position…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        />
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
            <Text className="py-8 text-center text-slate-500">No employees</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">
                {item.firstName} {item.lastName}
              </Text>
              <Text className="text-sm text-slate-600">{item.email}</Text>
              <Text className="mt-1 text-xs text-slate-500">
                {String(item.department)} · {item.position}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[88%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Employee</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-bold text-slate-900">
                  {detail.firstName} {detail.lastName}
                </Text>
                <Text className="mt-1 text-slate-600">{detail.email}</Text>
                <Text className="mt-2 text-slate-800">
                  {detail.employeeId} · {String(detail.department)}
                </Text>
                <Text className="mt-1 text-slate-700">{detail.position}</Text>
                <Text className="mt-2 text-slate-600">
                  Status {String(detail.employmentStatus)} ·{' '}
                  {String(detail.employeeType)}
                </Text>
                {detail.salary != null ? (
                  <Text className="mt-2 text-slate-800">
                    Salary {formatUsd(detail.salary)}
                  </Text>
                ) : null}
                {detail.hireDate ? (
                  <Text className="mt-2 text-slate-600">Hired {detail.hireDate}</Text>
                ) : null}
                {detail.notes ? (
                  <Text className="mt-3 text-slate-700">{detail.notes}</Text>
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
