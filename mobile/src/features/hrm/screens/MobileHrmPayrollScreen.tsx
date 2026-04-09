import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getPayrollRecords } from '../../../services/hrm/hrmMobileApi';
import type { Payroll } from '../../../models/hrm';

export function MobileHrmPayrollScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [rows, setRows] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<Payroll | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPayrollRecords(1, 200);
      setRows(res.payroll ?? []);
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/payroll',
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

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Payroll
        </Text>
        <View className="w-10" />
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
            <Text className="py-8 text-center text-slate-500">No payroll records</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">{item.payPeriod}</Text>
              <Text className="text-xs text-slate-500">{String(item.status)}</Text>
              <Text className="mt-1 text-sm text-slate-800">
                Net {formatUsd(item.netPay)}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[88%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Payroll</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-slate-800">{detail.payPeriod}</Text>
                <Text className="mt-2 text-slate-700">
                  Basic {formatUsd(detail.basicSalary)} · Net {formatUsd(detail.netPay)}
                </Text>
                <Text className="mt-2 text-sm text-slate-600">
                  {detail.startDate} → {detail.endDate}
                </Text>
              </ScrollView>
            ) : null}
            <Pressable
              onPress={() => setDetail(null)}
              className="mt-4 items-center rounded-lg bg-slate-100 py-3"
            >
              <Text className="font-semibold text-slate-800">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
