import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getTrainingPrograms, createTrainingProgram, updateTrainingProgram, deleteTrainingProgram } from '../../../services/hrm/hrmMobileApi';
import type { Training, TrainingCreate, TrainingUpdate } from '../../../models/hrm';
import { TrainingStatus, TrainingType } from '../../../models/hrm';
import { AppModal } from '../../../components/layout/AppModal';

const TRAINING_TYPES = Object.values(TrainingType);
const TRAINING_STATUSES = Object.values(TrainingStatus);

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

function buildEmptyForm() {
  return {
    title: '',
    description: '',
    trainingType: TrainingType.SKILL_DEVELOPMENT,
    duration: '',
    cost: '',
    provider: '',
    startDate: todayIsoDate(),
    endDate: todayIsoDate(),
    maxParticipants: '',
    status: TrainingStatus.NOT_STARTED,
    objectives: '',
    prerequisites: '',
  };
}

export function MobileHrmTrainingScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<Training | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Training | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(buildEmptyForm());

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

  const cycleOption = <T extends string>(list: readonly T[], current: T): T => {
    const index = list.indexOf(current);
    if (index < 0) return list[0] as T;
    return list[(index + 1) % list.length] as T;
  };

  const openCreate = () => {
    setForm(buildEmptyForm());
    setCreateOpen(true);
  };

  const openEdit = (training: Training) => {
    setSelected(training);
    setForm({
      title: training.title,
      description: training.description,
      trainingType: training.trainingType,
      duration: training.duration,
      cost: String(training.cost),
      provider: training.provider,
      startDate: training.startDate ? training.startDate.split('T')[0] || training.startDate : todayIsoDate(),
      endDate: training.endDate ? training.endDate.split('T')[0] || training.endDate : todayIsoDate(),
      maxParticipants: training.maxParticipants != null ? String(training.maxParticipants) : '',
      status: training.status,
      objectives: (training.objectives || []).join('\n'),
      prerequisites: (training.prerequisites || []).join('\n'),
    });
    setEditOpen(true);
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.description.trim() || !form.provider.trim()) {
      Alert.alert('HRM', 'Title, description, and provider are required.');
      return false;
    }
    if (!form.startDate.trim() || !form.endDate.trim()) {
      Alert.alert('HRM', 'Start and end dates are required.');
      return false;
    }
    return true;
  };

  const buildPayload = (): TrainingCreate => {
    const cost = parseFloat(form.cost);
    const maxParticipants = parseInt(form.maxParticipants, 10);
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      trainingType: form.trainingType,
      duration: form.duration.trim() || '',
      cost: Number.isFinite(cost) ? cost : 0,
      provider: form.provider.trim(),
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      maxParticipants: Number.isFinite(maxParticipants) ? maxParticipants : undefined,
      status: form.status,
      objectives: form.objectives.split('\n').map((v) => v.trim()).filter(Boolean),
      prerequisites: form.prerequisites.split('\n').map((v) => v.trim()).filter(Boolean),
    };
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await createTrainingProgram(buildPayload());
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
      const updatePayload: TrainingUpdate = {
        title: payload.title,
        description: payload.description,
        trainingType: payload.trainingType,
        duration: payload.duration,
        cost: payload.cost,
        provider: payload.provider,
        startDate: payload.startDate,
        endDate: payload.endDate,
        maxParticipants: payload.maxParticipants,
        status: payload.status,
        objectives: payload.objectives,
        prerequisites: payload.prerequisites,
      };
      await updateTrainingProgram(selected.id, updatePayload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (training: Training) => {
    Alert.alert('Delete training program', training.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteTrainingProgram(training.id);
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
          Training
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
            <View className="mt-4 flex-row gap-2">
              {detail && canManageHRM() ? (
                <Pressable onPress={() => openEdit(detail)} className="flex-1 items-center rounded-lg bg-blue-600 py-3">
                  <Text className="font-semibold text-white">Edit</Text>
                </Pressable>
              ) : null}
              {detail && canManageHRM() ? (
                <Pressable onPress={() => remove(detail)} className="flex-1 items-center rounded-lg bg-red-600 py-3">
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
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-2 pt-4">
            <Text className="text-lg font-semibold text-slate-900">New training program</Text>
            <ScrollView keyboardShouldPersistTaps="handled" className="mt-3 max-h-[76%]">
              <View className="gap-3">
                <TextInput value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} placeholder="Title" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Description" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
                <TextInput value={form.provider} onChangeText={(v) => setForm((p) => ({ ...p, provider: v }))} placeholder="Provider" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.duration} onChangeText={(v) => setForm((p) => ({ ...p, duration: v }))} placeholder="Duration" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.cost} onChangeText={(v) => setForm((p) => ({ ...p, cost: v }))} placeholder="Cost" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.startDate} onChangeText={(v) => setForm((p) => ({ ...p, startDate: v }))} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.endDate} onChangeText={(v) => setForm((p) => ({ ...p, endDate: v }))} placeholder="End date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.maxParticipants} onChangeText={(v) => setForm((p) => ({ ...p, maxParticipants: v }))} placeholder="Max participants" placeholderTextColor="#475569" keyboardType="number-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <Pressable onPress={() => setForm((p) => ({ ...p, trainingType: cycleOption(TRAINING_TYPES, p.trainingType) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Type: {form.trainingType}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, status: cycleOption(TRAINING_STATUSES, p.status) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Status: {form.status}</Text>
                </Pressable>
                <TextInput value={form.objectives} onChangeText={(v) => setForm((p) => ({ ...p, objectives: v }))} placeholder="Objectives (one per line)" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
                <TextInput value={form.prerequisites} onChangeText={(v) => setForm((p) => ({ ...p, prerequisites: v }))} placeholder="Prerequisites (one per line)" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
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
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-2 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Edit training program</Text>
            <ScrollView keyboardShouldPersistTaps="handled" className="mt-3 max-h-[76%]">
              <View className="gap-3">
                <TextInput value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} placeholder="Title" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Description" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
                <TextInput value={form.provider} onChangeText={(v) => setForm((p) => ({ ...p, provider: v }))} placeholder="Provider" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.duration} onChangeText={(v) => setForm((p) => ({ ...p, duration: v }))} placeholder="Duration" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.cost} onChangeText={(v) => setForm((p) => ({ ...p, cost: v }))} placeholder="Cost" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.startDate} onChangeText={(v) => setForm((p) => ({ ...p, startDate: v }))} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.endDate} onChangeText={(v) => setForm((p) => ({ ...p, endDate: v }))} placeholder="End date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.maxParticipants} onChangeText={(v) => setForm((p) => ({ ...p, maxParticipants: v }))} placeholder="Max participants" placeholderTextColor="#475569" keyboardType="number-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <Pressable onPress={() => setForm((p) => ({ ...p, trainingType: cycleOption(TRAINING_TYPES, p.trainingType) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Type: {form.trainingType}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, status: cycleOption(TRAINING_STATUSES, p.status) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Status: {form.status}</Text>
                </Pressable>
                <TextInput value={form.objectives} onChangeText={(v) => setForm((p) => ({ ...p, objectives: v }))} placeholder="Objectives (one per line)" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
                <TextInput value={form.prerequisites} onChangeText={(v) => setForm((p) => ({ ...p, prerequisites: v }))} placeholder="Prerequisites (one per line)" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
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
