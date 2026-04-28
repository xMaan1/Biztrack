import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getTrainingPrograms } from '../../../services/hrm/hrmMobileApi';
import type { Training } from '../../../models/hrm';
import { AppModal } from '../../../components/layout/AppModal';

export function MobileHrmTrainingScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [rows, setRows] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<Training | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTrainingPrograms(1, 100);
      setRows(res.training ?? []);
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/training',
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
          Training
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
            <Text className="py-8 text-center text-slate-500">No programs</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">{item.title}</Text>
              <Text className="text-xs text-slate-500">
                {String(item.trainingType)} · {String(item.status)}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">{item.provider}</Text>
            </Pressable>
          )}
        />
      )}

      <AppModal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[88%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Training</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-bold text-slate-900">{detail.title}</Text>
                <Text className="mt-2 text-slate-700">{detail.description}</Text>
                <Text className="mt-3 text-slate-800">
                  {formatUsd(detail.cost)} · {detail.duration}
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
      </AppModal>
    </View>
  );
}
