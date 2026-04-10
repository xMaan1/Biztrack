import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import {
  getWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
} from '../../../services/workshop/workshopMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopFieldLabel,
  WorkshopPrimaryButton,
} from '../components/WorkshopChrome';

type WO = {
  id: string;
  work_order_number: string;
  title: string;
  description: string;
  work_order_type: string;
  status: string;
  priority: string;
  planned_start_date: string;
  planned_end_date: string;
  estimated_hours: number;
  created_at?: string;
  location?: string;
  instructions?: string;
  safety_notes?: string;
  quality_requirements?: string;
  materials_required?: string[];
  estimated_cost?: number;
  tags?: string[];
};

const STATUSES = ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TYPES = ['production', 'maintenance', 'repair', 'inspection', 'custom'];

function emptyForm() {
  return {
    title: '',
    description: '',
    work_order_type: 'production',
    status: 'draft',
    priority: 'medium',
    planned_start_date: '',
    planned_end_date: '',
    estimated_hours: '8',
    location: '',
    instructions: '',
    safety_notes: '',
    quality_requirements: '',
    estimated_cost: '0',
    materialsText: '',
    tagsText: '',
  };
}

export function MobileWorkshopWorkOrdersScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [priorityF, setPriorityF] = useState('all');
  const [typeF, setTypeF] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selected, setSelected] = useState<WO | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSidebarActivePath('/workshop-management/work-orders');
  }, [setSidebarActivePath]);

  const load = useCallback(async () => {
    const data = await getWorkOrders();
    setList(data as WO[]);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert('Work orders', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    void run(false);
  }, [run]);

  const filtered = useMemo(() => {
    let rows = [...list];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          (w.work_order_number || '').toLowerCase().includes(q) ||
          (w.description || '').toLowerCase().includes(q),
      );
    }
    if (statusF !== 'all') rows = rows.filter((w) => w.status === statusF);
    if (priorityF !== 'all')
      rows = rows.filter((w) => w.priority === priorityF);
    if (typeF !== 'all')
      rows = rows.filter((w) => w.work_order_type === typeF);
    rows.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    );
    return rows;
  }, [list, search, statusF, priorityF, typeF]);

  const openCreate = () => {
    setSelected(null);
    setMode('create');
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openView = (w: WO, m: 'edit' | 'view') => {
    setSelected(w);
    setMode(m);
    setForm({
      title: w.title || '',
      description: w.description || '',
      work_order_type: w.work_order_type || 'production',
      status: w.status || 'draft',
      priority: w.priority || 'medium',
      planned_start_date: w.planned_start_date?.split('T')[0] ?? '',
      planned_end_date: w.planned_end_date?.split('T')[0] ?? '',
      estimated_hours: String(w.estimated_hours ?? 0),
      location: w.location ?? '',
      instructions: w.instructions ?? '',
      safety_notes: w.safety_notes ?? '',
      quality_requirements: w.quality_requirements ?? '',
      estimated_cost: String(w.estimated_cost ?? 0),
      materialsText: (w.materials_required || []).join(', '),
      tagsText: (w.tags || []).join(', '),
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (mode === 'view') {
      setModalOpen(false);
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Work order', 'Title and description are required');
      return;
    }
    if (!form.planned_start_date || !form.planned_end_date) {
      Alert.alert('Work order', 'Planned start and end dates are required');
      return;
    }
    const hrs = parseFloat(form.estimated_hours);
    if (isNaN(hrs) || hrs <= 0) {
      Alert.alert('Work order', 'Estimated hours must be greater than 0');
      return;
    }
    const materials = form.materialsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = form.tagsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      work_order_type: form.work_order_type,
      status: form.status,
      priority: form.priority,
      planned_start_date: form.planned_start_date,
      planned_end_date: form.planned_end_date,
      estimated_hours: hrs,
      location: form.location.trim() || undefined,
      instructions: form.instructions.trim() || undefined,
      safety_notes: form.safety_notes.trim() || undefined,
      quality_requirements: form.quality_requirements.trim() || undefined,
      materials_required: materials,
      estimated_cost: parseFloat(form.estimated_cost) || 0,
      tags,
    };
    try {
      setSaving(true);
      if (mode === 'create') {
        await createWorkOrder(body);
      } else if (selected) {
        await updateWorkOrder(selected.id, body);
      }
      setModalOpen(false);
      await run(false);
    } catch (e) {
      Alert.alert('Work order', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (w: WO) => {
    Alert.alert('Delete', `Remove ${w.work_order_number}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWorkOrder(w.id);
            await run(false);
          } catch (e) {
            Alert.alert(
              'Work order',
              extractErrorMessage(e, 'Delete failed'),
            );
          }
        },
      },
    ]);
  };

  const readOnly = mode === 'view';

  return (
    <WorkshopChrome
      title="Work orders"
      subtitle="Production work queue"
      right={
        <Pressable onPress={openCreate} className="p-2">
          <Ionicons name="add-circle" size={26} color="#4f46e5" />
        </Pressable>
      }
      scroll={false}
    >
      <TextInput
        className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
        placeholder="Search…"
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2 pb-1">
          {['all', ...STATUSES].map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatusF(s)}
              className={`rounded-full px-3 py-1 ${statusF === s ? 'bg-indigo-600' : 'bg-slate-100'}`}
            >
              <Text
                className={`text-xs capitalize ${statusF === s ? 'text-white' : 'text-slate-700'}`}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

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
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No work orders.</Text>
          }
          renderItem={({ item: w }) => (
            <WorkshopCard>
              <Text className="font-semibold text-slate-900">
                {w.work_order_number} · {w.title}
              </Text>
              <Text className="text-xs capitalize text-slate-500">
                {w.status?.replace('_', ' ')} · {w.priority} · {w.work_order_type}
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => openView(w, 'view')}
                  className="rounded-lg bg-slate-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium">View</Text>
                </Pressable>
                <Pressable
                  onPress={() => openView(w, 'edit')}
                  className="rounded-lg bg-indigo-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-indigo-900">Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(w)}
                  className="rounded-lg bg-red-50 px-2 py-1"
                >
                  <Text className="text-xs text-red-700">Delete</Text>
                </Pressable>
              </View>
            </WorkshopCard>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold text-slate-900">
              {mode === 'create'
                ? 'New work order'
                : mode === 'edit'
                  ? 'Edit work order'
                  : 'Work order'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
              <TextInput
                editable={!readOnly}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />
              <WorkshopFieldLabel>Description *</WorkshopFieldLabel>
              <TextInput
                editable={!readOnly}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
              />
              <WorkshopFieldLabel>Type</WorkshopFieldLabel>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {TYPES.map((t) => (
                  <Pressable
                    key={t}
                    disabled={readOnly}
                    onPress={() => setForm((f) => ({ ...f, work_order_type: t }))}
                    className={`rounded-full px-2 py-1 ${form.work_order_type === t ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs ${form.work_order_type === t ? 'text-white' : 'text-slate-700'}`}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WorkshopFieldLabel>Status</WorkshopFieldLabel>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {STATUSES.map((t) => (
                  <Pressable
                    key={t}
                    disabled={readOnly}
                    onPress={() => setForm((f) => ({ ...f, status: t }))}
                    className={`rounded-full px-2 py-1 ${form.status === t ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs ${form.status === t ? 'text-white' : 'text-slate-700'}`}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WorkshopFieldLabel>Priority</WorkshopFieldLabel>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {PRIORITIES.map((t) => (
                  <Pressable
                    key={t}
                    disabled={readOnly}
                    onPress={() => setForm((f) => ({ ...f, priority: t }))}
                    className={`rounded-full px-2 py-1 ${form.priority === t ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${form.priority === t ? 'text-white' : 'text-slate-700'}`}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WorkshopFieldLabel>Planned start *</WorkshopFieldLabel>
              <TextInput
                editable={!readOnly}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="YYYY-MM-DD"
                value={form.planned_start_date}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, planned_start_date: v }))
                }
              />
              <WorkshopFieldLabel>Planned end *</WorkshopFieldLabel>
              <TextInput
                editable={!readOnly}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="YYYY-MM-DD"
                value={form.planned_end_date}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, planned_end_date: v }))
                }
              />
              <WorkshopFieldLabel>Estimated hours *</WorkshopFieldLabel>
              <TextInput
                editable={!readOnly}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                keyboardType="decimal-pad"
                value={form.estimated_hours}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, estimated_hours: v }))
                }
              />
              <WorkshopFieldLabel>Location</WorkshopFieldLabel>
              <TextInput
                editable={!readOnly}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.location}
                onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
              />
              <WorkshopFieldLabel>Instructions</WorkshopFieldLabel>
              <TextInput
                editable={!readOnly}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.instructions}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, instructions: v }))
                }
                multiline
              />
              <WorkshopFieldLabel>Materials (comma-separated)</WorkshopFieldLabel>
              <TextInput
                editable={!readOnly}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.materialsText}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, materialsText: v }))
                }
              />
              <WorkshopFieldLabel>Estimated cost</WorkshopFieldLabel>
              <TextInput
                editable={!readOnly}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                keyboardType="decimal-pad"
                value={form.estimated_cost}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, estimated_cost: v }))
                }
              />
            </ScrollView>
            {!readOnly ? (
              <WorkshopPrimaryButton
                label={saving ? 'Saving…' : 'Save'}
                onPress={() => void submit()}
                disabled={saving}
              />
            ) : null}
            <Pressable
              className="mt-3 items-center py-2"
              onPress={() => setModalOpen(false)}
            >
              <Text className="text-slate-600">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </WorkshopChrome>
  );
}
