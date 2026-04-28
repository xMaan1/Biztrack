import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getPerformanceReviews,
  createPerformanceReview,
  updatePerformanceReview,
  deletePerformanceReview,
  getEmployees,
} from '../../../services/hrm/hrmMobileApi';
import type { PerformanceReview, Employee, PerformanceReviewCreate, PerformanceReviewUpdate } from '../../../models/hrm';
import { ReviewStatus, ReviewType } from '../../../models/hrm';
import { AppModal } from '../../../components/layout/AppModal';

const REVIEW_TYPES = Object.values(ReviewType);
const REVIEW_STATUSES = Object.values(ReviewStatus);

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

export function MobileHrmPerformanceReviewsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<PerformanceReview | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<PerformanceReview | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    reviewerId: '',
    reviewType: ReviewType.ANNUAL,
    reviewPeriod: '',
    reviewDate: todayIsoDate(),
    status: ReviewStatus.DRAFT,
    overallRating: '',
    comments: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [res, emp] = await Promise.all([getPerformanceReviews(1, 100), getEmployees(1, 100)]);
      setRows(res.reviews ?? []);
      const list = emp.employees ?? [];
      setEmployees(list);
      setForm((prev) => ({
        ...prev,
        employeeId: prev.employeeId || list[0]?.id || '',
        reviewerId: prev.reviewerId || list[0]?.id || '',
      }));
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

  const cycleOption = <T extends string>(list: readonly T[], current: T): T => {
    const index = list.indexOf(current);
    if (index < 0) return list[0] as T;
    return list[(index + 1) % list.length] as T;
  };

  const cycleEmployee = (field: 'employeeId' | 'reviewerId') => {
    if (!employees.length) return;
    setForm((prev) => {
      const ids = employees.map((e) => e.id);
      const current = prev[field];
      const idx = ids.indexOf(current);
      const next = ids[(idx + 1) % ids.length] || ids[0];
      return { ...prev, [field]: next };
    });
  };

  const employeeName = (id: string) => {
    const employee = employees.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Select employee';
  };

  const openCreate = () => {
    const firstEmployee = employees[0]?.id || '';
    setForm({
      employeeId: firstEmployee,
      reviewerId: firstEmployee,
      reviewType: ReviewType.ANNUAL,
      reviewPeriod: '',
      reviewDate: todayIsoDate(),
      status: ReviewStatus.DRAFT,
      overallRating: '',
      comments: '',
    });
    setCreateOpen(true);
  };

  const openEdit = (review: PerformanceReview) => {
    setSelected(review);
    setForm({
      employeeId: review.employeeId,
      reviewerId: review.reviewerId,
      reviewType: review.reviewType,
      reviewPeriod: review.reviewPeriod || '',
      reviewDate: review.reviewDate ? review.reviewDate.split('T')[0] || review.reviewDate : todayIsoDate(),
      status: review.status,
      overallRating: review.overallRating != null ? String(review.overallRating) : '',
      comments: review.comments || '',
    });
    setEditOpen(true);
  };

  const validateForm = () => {
    if (!form.employeeId || !form.reviewerId || !form.reviewDate.trim()) {
      Alert.alert('HRM', 'Employee, reviewer, and review date are required.');
      return false;
    }
    return true;
  };

  const buildPayload = (): PerformanceReviewCreate => {
    const rating = parseFloat(form.overallRating);
    return {
      employeeId: form.employeeId,
      reviewerId: form.reviewerId,
      reviewType: form.reviewType,
      reviewPeriod: form.reviewPeriod.trim() || '',
      reviewDate: form.reviewDate.trim(),
      status: form.status,
      overallRating: Number.isFinite(rating) ? rating : undefined,
      comments: form.comments.trim() || undefined,
    };
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await createPerformanceReview(buildPayload());
      setCreateOpen(false);
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!selected || !validateForm()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      const updatePayload: PerformanceReviewUpdate = {
        reviewerId: payload.reviewerId,
        reviewType: payload.reviewType,
        reviewPeriod: payload.reviewPeriod,
        reviewDate: payload.reviewDate,
        status: payload.status,
        overallRating: payload.overallRating,
        comments: payload.comments,
      };
      await updatePerformanceReview(selected.id, updatePayload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Performance reviews
        </Text>
        {canManageHRM() ? (
          <Pressable onPress={openCreate} className="px-2 py-1">
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
                <Pressable onPress={() => openEdit(detail)} className="flex-1 items-center rounded-lg bg-blue-600 py-3">
                  <Text className="font-semibold text-white">Edit</Text>
                </Pressable>
              ) : null}
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

      <AppModal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-semibold text-slate-900">New review</Text>
            <ScrollView keyboardShouldPersistTaps="handled" className="mt-3 max-h-[76%]">
              <View className="gap-3">
                <Pressable onPress={() => cycleEmployee('employeeId')} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Employee: {employeeName(form.employeeId)}</Text>
                </Pressable>
                <Pressable onPress={() => cycleEmployee('reviewerId')} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Reviewer: {employeeName(form.reviewerId)}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, reviewType: cycleOption(REVIEW_TYPES, p.reviewType) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Type: {form.reviewType}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, status: cycleOption(REVIEW_STATUSES, p.status) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Status: {form.status}</Text>
                </Pressable>
                <TextInput value={form.reviewPeriod} onChangeText={(v) => setForm((p) => ({ ...p, reviewPeriod: v }))} placeholder="Review period" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.reviewDate} onChangeText={(v) => setForm((p) => ({ ...p, reviewDate: v }))} placeholder="Review date (YYYY-MM-DD)" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.overallRating} onChangeText={(v) => setForm((p) => ({ ...p, overallRating: v }))} placeholder="Overall rating (0-5)" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.comments} onChangeText={(v) => setForm((p) => ({ ...p, comments: v }))} placeholder="Comments" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
              </View>
            </ScrollView>
            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setCreateOpen(false)} className="flex-1 items-center rounded-lg border border-slate-300 py-3">
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void submitCreate()} disabled={saving} className="flex-1 items-center rounded-lg bg-blue-600 py-3">
                <Text className="font-semibold text-white">{saving ? 'Saving...' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      <AppModal visible={editOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Edit review</Text>
            <ScrollView keyboardShouldPersistTaps="handled" className="mt-3 max-h-[76%]">
              <View className="gap-3">
                <Pressable onPress={() => cycleEmployee('employeeId')} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Employee: {employeeName(form.employeeId)}</Text>
                </Pressable>
                <Pressable onPress={() => cycleEmployee('reviewerId')} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Reviewer: {employeeName(form.reviewerId)}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, reviewType: cycleOption(REVIEW_TYPES, p.reviewType) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Type: {form.reviewType}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, status: cycleOption(REVIEW_STATUSES, p.status) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Status: {form.status}</Text>
                </Pressable>
                <TextInput value={form.reviewPeriod} onChangeText={(v) => setForm((p) => ({ ...p, reviewPeriod: v }))} placeholder="Review period" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.reviewDate} onChangeText={(v) => setForm((p) => ({ ...p, reviewDate: v }))} placeholder="Review date (YYYY-MM-DD)" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.overallRating} onChangeText={(v) => setForm((p) => ({ ...p, overallRating: v }))} placeholder="Overall rating (0-5)" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.comments} onChangeText={(v) => setForm((p) => ({ ...p, comments: v }))} placeholder="Comments" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
              </View>
            </ScrollView>
            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => { setEditOpen(false); setSelected(null); }} className="flex-1 items-center rounded-lg border border-slate-300 py-3">
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void submitEdit()} disabled={saving} className="flex-1 items-center rounded-lg bg-blue-600 py-3">
                <Text className="font-semibold text-white">{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>
    </View>
  );
}
