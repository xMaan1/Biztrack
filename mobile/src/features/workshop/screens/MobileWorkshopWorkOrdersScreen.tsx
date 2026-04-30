import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import {
  getWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
} from '../../../services/workshop/workshopMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { AppModal } from '../../../components/layout/AppModal';
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopFieldLabel,
  WorkshopPrimaryButton,
} from '../components/WorkshopChrome';
import { WorkOrderDetailSheet } from '../components/WorkOrderDetailSheet';
import { ProductChipSelect } from '../../inventory/screens/products/ProductChipSelect';

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

const STATUS_OPTIONS = [
  'all',
  'draft',
  'planned',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
];
const PRIORITY_OPTIONS = ['all', 'low', 'medium', 'high', 'urgent'];
const TYPE_OPTIONS = [
  'all',
  'production',
  'maintenance',
  'repair',
  'installation',
  'inspection',
];
const FORM_STATUSES = STATUS_OPTIONS.filter((s) => s !== 'all');
const FORM_PRIORITIES = PRIORITY_OPTIONS.filter((p) => p !== 'all');
const FORM_TYPES = TYPE_OPTIONS.filter((t) => t !== 'all');

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
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<WO | null>(null);
  const [viewWorkOrder, setViewWorkOrder] = useState<WO | null>(null);
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
    setViewWorkOrder(null);
    setSelected(null);
    setMode('create');
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEditModal = (w: WO) => {
    setViewWorkOrder(null);
    setSelected(w);
    setMode('edit');
    setForm({
      title: w.title || '',
      description: w.description || '',
      work_order_type: FORM_TYPES.includes(w.work_order_type)
        ? w.work_order_type
        : 'production',
      status: FORM_STATUSES.includes(w.status) ? w.status : 'draft',
      priority: FORM_PRIORITIES.includes(w.priority) ? w.priority : 'medium',
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
      <View className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
        <ProductChipSelect
          label="Status"
          options={STATUS_OPTIONS}
          value={statusF}
          onChange={setStatusF}
        />
        <ProductChipSelect
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priorityF}
          onChange={setPriorityF}
        />
        <ProductChipSelect
          label="Type"
          options={TYPE_OPTIONS}
          value={typeF}
          onChange={setTypeF}
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
                  onPress={() => setViewWorkOrder(w)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1"
                >
                  <Text className="text-xs font-semibold text-slate-800">View</Text>
                </Pressable>
                <Pressable
                  onPress={() => openEditModal(w)}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1"
                >
                  <Text className="text-xs font-semibold text-blue-900">Edit</Text>
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

      <WorkOrderDetailSheet
        visible={viewWorkOrder != null}
        workOrder={viewWorkOrder}
        onClose={() => setViewWorkOrder(null)}
        onEdit={(w) => {
          setViewWorkOrder(null);
          openEditModal(w as WO);
        }}
      />

      <AppModal
        visible={modalOpen}
        animationType="slide"
        transparent
        onClose={() => setModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <View className="mb-2 items-center">
              <View className="h-1 w-9 rounded-full bg-slate-200" />
            </View>
            <Text className="mb-3 text-lg font-semibold text-slate-900">
              {mode === 'create' ? 'New work order' : 'Edit work order'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
              />
              <WorkshopFieldLabel>Description *</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
              />
              <ProductChipSelect
                label="Type"
                options={FORM_TYPES}
                value={form.work_order_type}
                onChange={(v) => setForm((f) => ({ ...f, work_order_type: v }))}
              />
              <ProductChipSelect
                label="Status"
                options={FORM_STATUSES}
                value={form.status}
                onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              />
              <ProductChipSelect
                label="Priority"
                options={FORM_PRIORITIES}
                value={form.priority}
                onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
              />
              <WorkshopFieldLabel>Planned start *</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="YYYY-MM-DD"
                value={form.planned_start_date}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, planned_start_date: v }))
                }
              />
              <WorkshopFieldLabel>Planned end *</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="YYYY-MM-DD"
                value={form.planned_end_date}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, planned_end_date: v }))
                }
              />
              <WorkshopFieldLabel>Estimated hours *</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                keyboardType="decimal-pad"
                value={form.estimated_hours}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, estimated_hours: v }))
                }
              />
              <WorkshopFieldLabel>Location</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.location}
                onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
              />
              <WorkshopFieldLabel>Instructions</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.instructions}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, instructions: v }))
                }
                multiline
              />
              <WorkshopFieldLabel>Materials (comma-separated)</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.materialsText}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, materialsText: v }))
                }
              />
              <WorkshopFieldLabel>Estimated cost</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                keyboardType="decimal-pad"
                value={form.estimated_cost}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, estimated_cost: v }))
                }
              />
            </ScrollView>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable
              className="mt-3 items-center py-2"
              onPress={() => setModalOpen(false)}
            >
              <Text className="text-slate-600">Close</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>
    </WorkshopChrome>
  );
}
