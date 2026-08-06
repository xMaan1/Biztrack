import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
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
  WorkshopChipSelect,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPrimaryButton,
  WS,
} from '../components/WorkshopChrome';
import { WorkOrderDetailSheet } from '../components/WorkOrderDetailSheet';

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
        appError('Work orders', extractErrorMessage(e, 'Failed to load'));
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
      appAlert('Work order', 'Title and description are required');
      return;
    }
    if (!form.planned_start_date || !form.planned_end_date) {
      appAlert('Work order', 'Planned start and end dates are required');
      return;
    }
    const hrs = parseFloat(form.estimated_hours);
    if (isNaN(hrs) || hrs <= 0) {
      appAlert('Work order', 'Estimated hours must be greater than 0');
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
      appError('Work order', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (w: WO) => {
    appConfirm({
      title: 'Delete',
      message: `Remove ${w.work_order_number}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteWorkOrder(w.id);
          await run(false);
        } catch (e) {
          appError('Work order', extractErrorMessage(e, 'Delete failed'));
        }
      },
    });
  };

  return (
    <WorkshopChrome
      title="Work orders"
      subtitle="Production work queue"
      right={<WorkshopHeaderButton onPress={openCreate} />}
      scroll={false}
    >
      <WorkshopFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search work orders…"
        resultCount={filtered.length}
        activeFilterCount={countActiveFilters([statusF, priorityF, typeF])}
        onResetFilters={() => {
          setStatusF('all');
          setPriorityF('all');
          setTypeF('all');
        }}
      >
        <WorkshopChipSelect
          label="Status"
          options={STATUS_OPTIONS}
          value={statusF}
          onChange={setStatusF}
        />
        <WorkshopChipSelect
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priorityF}
          onChange={setPriorityF}
        />
        <WorkshopChipSelect
          label="Type"
          options={TYPE_OPTIONS}
          value={typeF}
          onChange={setTypeF}
        />
      </WorkshopFilterBar>

      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor={WS.primary}
            />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="hammer-outline"
              title="No work orders"
              subtitle="Create your first work order to start tracking production."
              actionLabel="Create work order"
              onAction={openCreate}
            />
          }
          renderItem={({ item: w }) => (
            <WorkshopListCard
              kind="work-order"
              icon="hammer"
              iconColor="#ea580c"
              iconBg="#fff7ed"
              kicker={w.work_order_number}
              title={w.title}
              subtitle={w.work_order_type?.replace(/_/g, ' ')}
              meta={`${w.estimated_hours}h estimated · ${w.planned_start_date?.split('T')[0] ?? 'No start date'}`}
              badges={[
                { label: w.status, tone: 'status' },
                { label: w.priority, tone: 'priority' },
              ]}
              onPress={() => setViewWorkOrder(w)}
              actions={[
                { icon: 'eye-outline', onPress: () => setViewWorkOrder(w) },
                { icon: 'create-outline', onPress: () => openEditModal(w) },
                { icon: 'trash-outline', onPress: () => remove(w), danger: true },
              ]}
            />
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

      <WorkshopFormSheet
        visible={modalOpen}
        title={mode === 'create' ? 'New work order' : 'Edit work order'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save work order'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable onPress={() => setModalOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
        <WorkshopTextInput
          value={form.title}
          onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
        />
        <WorkshopFieldLabel>Description *</WorkshopFieldLabel>
        <WorkshopTextInput
          value={form.description}
          onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
          multiline
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <WorkshopChipSelect
          label="Type"
          options={FORM_TYPES}
          value={form.work_order_type}
          onChange={(v) => setForm((f) => ({ ...f, work_order_type: v }))}
        />
        <WorkshopChipSelect
          label="Status"
          options={FORM_STATUSES}
          value={form.status}
          onChange={(v) => setForm((f) => ({ ...f, status: v }))}
        />
        <WorkshopChipSelect
          label="Priority"
          options={FORM_PRIORITIES}
          value={form.priority}
          onChange={(v) => setForm((f) => ({ ...f, priority: v }))}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Start date *" value={form.planned_start_date} onChange={(v) => setForm((f) => ({ ...f, planned_start_date: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="End date *" value={form.planned_end_date} onChange={(v) => setForm((f) => ({ ...f, planned_end_date: v }))} />
          </View>
        </View>
        <WorkshopFieldLabel>Estimated hours *</WorkshopFieldLabel>
        <WorkshopTextInput
          keyboardType="decimal-pad"
          value={form.estimated_hours}
          onChangeText={(v) => setForm((f) => ({ ...f, estimated_hours: v }))}
        />
        <WorkshopFieldLabel>Location</WorkshopFieldLabel>
        <WorkshopTextInput
          value={form.location}
          onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
        />
        <WorkshopFieldLabel>Instructions</WorkshopFieldLabel>
        <WorkshopTextInput
          value={form.instructions}
          onChangeText={(v) => setForm((f) => ({ ...f, instructions: v }))}
          multiline
        />
        <WorkshopFieldLabel>Materials (comma-separated)</WorkshopFieldLabel>
        <WorkshopTextInput
          value={form.materialsText}
          onChangeText={(v) => setForm((f) => ({ ...f, materialsText: v }))}
        />
        <WorkshopFieldLabel>Estimated cost</WorkshopFieldLabel>
        <WorkshopTextInput
          keyboardType="decimal-pad"
          value={form.estimated_cost}
          onChangeText={(v) => setForm((f) => ({ ...f, estimated_cost: v }))}
        />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
