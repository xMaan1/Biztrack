import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getPerformanceReviews,
  deletePerformanceReview,
} from '../../../services/hrm/hrmMobileApi';
import type { PerformanceReview } from '../../../models/hrm';
import { AppModal } from '../../../components/layout/AppModal';

export function MobileHrmPerformanceReviewsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<PerformanceReview | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPerformanceReviews(1, 100);
      setRows(res.reviews ?? []);
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/hrm/performance-reviews',
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

  const remove = (r: PerformanceReview) => {
    Alert.alert('Delete review', r.reviewPeriod, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deletePerformanceReview(r.id);
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
          Performance reviews
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
            <Text className="py-8 text-center text-slate-500">No reviews</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">{item.reviewPeriod}</Text>
              <Text className="text-xs text-slate-500">
                {String(item.reviewType)} · {String(item.status)}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">{item.reviewDate}</Text>
            </Pressable>
          )}
        />
      )}

      <AppModal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[88%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Review</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-slate-800">{detail.reviewPeriod}</Text>
                <Text className="mt-2 text-slate-600">
                  Rating {detail.overallRating ?? '—'}
                </Text>
                {detail.comments ? (
                  <Text className="mt-3 text-slate-700">{detail.comments}</Text>
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
      </AppModal>
    </View>
  );
}
