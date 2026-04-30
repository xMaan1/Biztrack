import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import {
  InspectionType,
  QualityPriority,
  QualityStandard,
  QualityStatus,
  type QualityCheckCreate,
  type QualityCheckUpdate,
  type QualityCheckResponse,
} from '../../../models/qualityControl';
import {
  getQualityChecks,
  createQualityCheck,
  updateQualityCheck,
  deleteQualityCheck,
  getWorkOrders,
  getTenantUsers,
} from '../../../services/workshop/workshopMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopFieldLabel,
  WorkshopPrimaryButton,
} from '../components/WorkshopChrome';
import { PickerModal } from '../../healthcare/components/PickerModal';
import { AppModal } from '../../../components/layout/AppModal';
import { ProductChipSelect } from '../../inventory/screens/products/ProductChipSelect';

const INSP_TYPES = Object.values(InspectionType);
const Q_PRIOS = Object.values(QualityPriority);
const Q_STDS = Object.values(QualityStandard);
const Q_STATUSES = Object.values(QualityStatus);

export function MobileWorkshopQualityScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<QualityCheckResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QualityCheckResponse | null>(null);
  const [woPick, setWoPick] = useState(false);
  const [userPick, setUserPick] = useState(false);
  const [workOrders, setWorkOrders] = useState<
    { id: string; work_order_number: string; title: string }[]
  >([]);
  const [users, setUsers] = useState<
    { id: string; name?: string; username?: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    inspection_type: InspectionType.VISUAL,
    priority: QualityPriority.MEDIUM,
    quality_standard: QualityStandard.ISO_9001,
    criteriaText: '',
    estimated_duration_minutes: '30',
    scheduled_date: '',
    work_order_id: '',
    assigned_to_id: '',
  });

  useEffect(() => {
    setSidebarActivePath('/workshop-management/quality-control');
  }, [setSidebarActivePath]);

  const loadRefs = useCallback(async () => {
    const [wo, u] = await Promise.all([getWorkOrders(), getTenantUsers()]);
    setWorkOrders(
      wo.map((w: { id: string; work_order_number: string; title: string }) => ({
        id: w.id,
        work_order_number: w.work_order_number,
        title: w.title,
      })),
    );
    setUsers(u);
  }, []);

  const load = useCallback(async () => {
    const { quality_checks } = await getQualityChecks({}, 1, 200);
    setList(quality_checks);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await Promise.all([loadRefs(), load()]);
      } catch (e) {
        Alert.alert('Quality', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load, loadRefs],
  );

  useEffect(() => {
    void run(false);
  }, [run]);

  const filtered = list.filter((q) => {
    const ok = statusF === 'all' || q.status === statusF;
    const s = search.toLowerCase();
    const match =
      !s ||
      q.title.toLowerCase().includes(s) ||
      (q.description || '').toLowerCase().includes(s);
    return ok && match;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      inspection_type: InspectionType.VISUAL,
      priority: QualityPriority.MEDIUM,
      quality_standard: QualityStandard.ISO_9001,
      criteriaText: '',
      estimated_duration_minutes: '30',
      scheduled_date: '',
      work_order_id: '',
      assigned_to_id: '',
    });
    setModalOpen(true);
  };

  const openEdit = (q: QualityCheckResponse) => {
    setEditing(q);
    setForm({
      title: q.title || '',
      description: q.description || '',
      inspection_type: q.inspection_type,
      priority: q.priority,
      quality_standard: q.quality_standard,
      criteriaText: (q.criteria || []).join(', '),
      estimated_duration_minutes: String(q.estimated_duration_minutes ?? 30),
      scheduled_date: q.scheduled_date ? q.scheduled_date.split('T')[0] : '',
      work_order_id: q.work_order_id || '',
      assigned_to_id: q.assigned_to_id || '',
    });
    setModalOpen(true);
  };

  const criteriaArr = () =>
    form.criteriaText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const submit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Quality', 'Title is required');
      return;
    }
    try {
      setSaving(true);
      const scheduled = form.scheduled_date
        ? `${form.scheduled_date}T09:00:00Z`
        : undefined;
      if (editing) {
        const up: QualityCheckUpdate = {
          title: form.title.trim(),
          description: form.description || undefined,
          inspection_type: form.inspection_type,
          priority: form.priority,
          quality_standard: form.quality_standard,
          criteria: criteriaArr(),
          estimated_duration_minutes:
            parseInt(form.estimated_duration_minutes, 10) || 30,
          scheduled_date: scheduled,
          work_order_id: form.work_order_id || undefined,
          assigned_to_id: form.assigned_to_id || undefined,
        };
        await updateQualityCheck(editing.id, up);
      } else {
        const cr: QualityCheckCreate = {
          title: form.title.trim(),
          description: form.description || undefined,
          inspection_type: form.inspection_type,
          priority: form.priority,
          quality_standard: form.quality_standard,
          criteria: criteriaArr(),
          acceptance_criteria: {},
          tolerance_limits: {},
          required_equipment: [],
          required_skills: [],
          estimated_duration_minutes:
            parseInt(form.estimated_duration_minutes, 10) || 30,
          scheduled_date: scheduled,
          work_order_id: form.work_order_id || undefined,
          assigned_to_id: form.assigned_to_id || undefined,
          tags: [],
        };
        await createQualityCheck(cr);
      }
      setModalOpen(false);
      await run(false);
    } catch (e) {
      Alert.alert('Quality', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (q: QualityCheckResponse) => {
    Alert.alert('Delete', q.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteQualityCheck(q.id);
            await run(false);
          } catch (e) {
            Alert.alert('Quality', extractErrorMessage(e, 'Delete failed'));
          }
        },
      },
    ]);
  };

  const woItems = workOrders.map((w) => ({
    id: w.id,
    label: `${w.work_order_number} · ${w.title}`,
  }));
  const userItems = users.map((u) => ({
    id: u.id,
    label: u.name || u.username || u.id,
  }));

  return (
    <WorkshopChrome
      title="Quality control"
      subtitle="Inspections & checks"
      right={
        <Pressable onPress={openCreate} className="p-2">
          <Ionicons name="add-circle" size={26} color="#4f46e5" />
        </Pressable>
      }
      scroll={false}
    >
      <TextInput
        className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
        placeholder="Search…"
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />
      <View className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
        <ProductChipSelect
          label="Status"
          options={['all', ...Q_STATUSES]}
          value={statusF}
          onChange={setStatusF}
        />
      </View>

      {loading && !refreshing ? (
        <View className="py-12 items-center">
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={filtered}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor="#4f46e5"
            />
          }
          renderItem={({ item: q }) => (
            <WorkshopCard>
              <Text className="font-semibold text-slate-900">{q.title}</Text>
              <Text className="text-xs text-slate-500 capitalize">
                {String(q.status).replace(/_/g, ' ')} ·{' '}
                {String(q.inspection_type).replace(/_/g, ' ')}
              </Text>
              <Text className="mt-1 text-xs text-slate-400">
                {q.completion_percentage ?? 0}% complete
              </Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  onPress={() => openEdit(q)}
                  className="rounded-lg bg-indigo-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-indigo-900">Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(q)}
                  className="rounded-lg bg-red-50 px-2 py-1"
                >
                  <Text className="text-xs text-red-700">Delete</Text>
                </Pressable>
              </View>
            </WorkshopCard>
          )}
        />
      )}

      <PickerModal
        visible={woPick}
        title="Work order"
        items={woItems}
        onSelect={(x) => setForm((f) => ({ ...f, work_order_id: x.id }))}
        onClose={() => setWoPick(false)}
      />
      <PickerModal
        visible={userPick}
        title="Assign to"
        items={[{ id: '', label: 'None' }, ...userItems]}
        onSelect={(x) =>
          setForm((f) => ({ ...f, assigned_to_id: x.id }))
        }
        onClose={() => setUserPick(false)}
      />

      <AppModal
        visible={modalOpen}
        animationType="slide"
        transparent
        onClose={() => setModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[94%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold">
              {editing ? 'Edit check' : 'New check'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />
              <WorkshopFieldLabel>Description</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.description}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, description: v }))
                }
                multiline
              />
              <ProductChipSelect
                label="Inspection type"
                options={[...INSP_TYPES]}
                value={form.inspection_type}
                onChange={(s) =>
                  setForm((f) => ({
                    ...f,
                    inspection_type: s as InspectionType,
                  }))
                }
              />
              <ProductChipSelect
                label="Priority"
                options={[...Q_PRIOS]}
                value={form.priority}
                onChange={(s) =>
                  setForm((f) => ({
                    ...f,
                    priority: s as QualityPriority,
                  }))
                }
              />
              <ProductChipSelect
                label="Standard"
                options={[...Q_STDS]}
                value={form.quality_standard}
                onChange={(s) =>
                  setForm((f) => ({
                    ...f,
                    quality_standard: s as QualityStandard,
                  }))
                }
              />
              <WorkshopFieldLabel>Criteria (comma-separated)</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.criteriaText}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, criteriaText: v }))
                }
              />
              <WorkshopFieldLabel>Duration (minutes)</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                keyboardType="number-pad"
                value={form.estimated_duration_minutes}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, estimated_duration_minutes: v }))
                }
              />
              <WorkshopFieldLabel>Scheduled date</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="YYYY-MM-DD"
                value={form.scheduled_date}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, scheduled_date: v }))
                }
              />
              <WorkshopFieldLabel>Work order</WorkshopFieldLabel>
              <Pressable
                onPress={() => setWoPick(true)}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text>
                  {form.work_order_id
                    ? woItems.find((x) => x.id === form.work_order_id)?.label
                    : 'Optional'}
                </Text>
              </Pressable>
              <WorkshopFieldLabel>Assign to</WorkshopFieldLabel>
              <Pressable
                onPress={() => setUserPick(true)}
                className="mb-4 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text>
                  {form.assigned_to_id
                    ? userItems.find((x) => x.id === form.assigned_to_id)
                        ?.label
                    : 'Optional'}
                </Text>
              </Pressable>
            </ScrollView>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setModalOpen(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>
    </WorkshopChrome>
  );
}
