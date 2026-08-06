import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import {
  ProductionType,
  ProductionPriority,
  ProductionStatus,
  type ProductionPlanCreate,
  type ProductionPlanUpdate,
  type ProductionPlanResponse,
} from '../../../models/production';
import {
  getProductionPlans,
  createProductionPlan,
  updateProductionPlan,
  deleteProductionPlan,
  getWorkOrders,
  getTenantUsers,
} from '../../../services/workshop/workshopMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { PickerModal } from '../../healthcare/components/PickerModal';
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
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WS,
} from '../components/WorkshopChrome';

const PROD_TYPES = Object.values(ProductionType);
const PROD_PRIOS = Object.values(ProductionPriority);
const PROD_STATUSES = Object.values(ProductionStatus);

export function MobileWorkshopProductionScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<ProductionPlanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionPlanResponse | null>(null);
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
    production_type: ProductionType.JOB_SHOP,
    priority: ProductionPriority.MEDIUM,
    status: ProductionStatus.PLANNED,
    planned_start_date: '',
    planned_end_date: '',
    target_quantity: '1',
    unit_of_measure: 'unit',
    production_line: '',
    estimated_material_cost: '0',
    estimated_labor_cost: '0',
    quality_standards: '',
    work_order_id: '',
    assigned_to_id: '',
  });

  useEffect(() => {
    setSidebarActivePath('/workshop-management/production');
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
    const { production_plans } = await getProductionPlans({}, 1, 200);
    setList(production_plans as ProductionPlanResponse[]);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await Promise.all([loadRefs(), load()]);
      } catch (e) {
        appError('Production', extractErrorMessage(e, 'Failed to load'));
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

  const filtered = list.filter((p) => {
    const ok = statusF === 'all' || p.status === statusF;
    const q = search.toLowerCase();
    const match =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.plan_number || '').toLowerCase().includes(q);
    return ok && match;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      production_type: ProductionType.JOB_SHOP,
      priority: ProductionPriority.MEDIUM,
      status: ProductionStatus.PLANNED,
      planned_start_date: '',
      planned_end_date: '',
      target_quantity: '1',
      unit_of_measure: 'unit',
      production_line: '',
      estimated_material_cost: '0',
      estimated_labor_cost: '0',
      quality_standards: '',
      work_order_id: '',
      assigned_to_id: '',
    });
    setModalOpen(true);
  };

  const openEdit = (p: ProductionPlanResponse) => {
    setEditing(p);
    setForm({
      title: p.title || '',
      description: p.description || '',
      production_type: p.production_type,
      priority: p.priority,
      status: p.status,
      planned_start_date: p.planned_start_date
        ? p.planned_start_date.split('T')[0]
        : '',
      planned_end_date: p.planned_end_date
        ? p.planned_end_date.split('T')[0]
        : '',
      target_quantity: String(p.target_quantity ?? 1),
      unit_of_measure: p.unit_of_measure || 'unit',
      production_line: p.production_line || '',
      estimated_material_cost: String(p.estimated_material_cost ?? 0),
      estimated_labor_cost: String(p.estimated_labor_cost ?? 0),
      quality_standards: p.quality_standards || '',
      work_order_id: p.work_order_id || '',
      assigned_to_id: p.assigned_to_id || '',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      appAlert('Production', 'Title is required');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        const up: ProductionPlanUpdate = {
          title: form.title.trim(),
          description: form.description || undefined,
          production_type: form.production_type,
          priority: form.priority,
          status: form.status,
          planned_start_date: form.planned_start_date
            ? `${form.planned_start_date}T08:00:00Z`
            : undefined,
          planned_end_date: form.planned_end_date
            ? `${form.planned_end_date}T17:00:00Z`
            : undefined,
          target_quantity: parseFloat(form.target_quantity) || 1,
          unit_of_measure: form.unit_of_measure || 'unit',
          production_line: form.production_line || undefined,
          estimated_material_cost:
            parseFloat(form.estimated_material_cost) || 0,
          estimated_labor_cost: parseFloat(form.estimated_labor_cost) || 0,
          quality_standards: form.quality_standards || undefined,
          work_order_id: form.work_order_id || undefined,
          assigned_to_id: form.assigned_to_id || undefined,
        };
        await updateProductionPlan(editing.id, up);
      } else {
        const cr: ProductionPlanCreate = {
          title: form.title.trim(),
          description: form.description || undefined,
          production_type: form.production_type,
          priority: form.priority,
          planned_start_date: form.planned_start_date
            ? `${form.planned_start_date}T08:00:00Z`
            : undefined,
          planned_end_date: form.planned_end_date
            ? `${form.planned_end_date}T17:00:00Z`
            : undefined,
          target_quantity: parseFloat(form.target_quantity) || 1,
          unit_of_measure: form.unit_of_measure || 'unit',
          production_line: form.production_line || undefined,
          equipment_required: [],
          materials_required: [],
          labor_requirements: [],
          estimated_material_cost:
            parseFloat(form.estimated_material_cost) || 0,
          estimated_labor_cost: parseFloat(form.estimated_labor_cost) || 0,
          quality_standards: form.quality_standards || undefined,
          inspection_points: [],
          tolerance_specs: [],
          work_order_id: form.work_order_id || undefined,
          assigned_to_id: form.assigned_to_id || undefined,
          tags: [],
        };
        await createProductionPlan(cr);
      }
      setModalOpen(false);
      await run(false);
    } catch (e) {
      appError('Production', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (p: ProductionPlanResponse) => {
    appConfirm({
      title: 'Delete',
      message: p.title,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteProductionPlan(p.id);
          await run(false);
        } catch (e) {
          appError('Production', extractErrorMessage(e, 'Delete failed'));
        }
      },
    });
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
      title="Production"
      subtitle="Production planning"
      right={<WorkshopHeaderButton onPress={openCreate} />}
      scroll={false}
    >
      <WorkshopFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search plans…"
        resultCount={filtered.length}
        activeFilterCount={countActiveFilters([statusF])}
        onResetFilters={() => setStatusF('all')}
      >
        <WorkshopChipSelect
          label="Status"
          options={['all', ...PROD_STATUSES]}
          value={statusF}
          onChange={setStatusF}
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
              icon="cog-outline"
              title="No production plans"
              subtitle="Plan production runs and track targets."
              actionLabel="Create plan"
              onAction={openCreate}
            />
          }
          renderItem={({ item: p }) => (
            <WorkshopListCard
              kind="production"
              icon="cog"
              iconColor="#0891b2"
              iconBg="#ecfeff"
              kicker={p.plan_number}
              title={p.title}
              subtitle={p.production_line || undefined}
              meta={`Target ${p.target_quantity ?? 1} ${p.unit_of_measure ?? 'unit'}`}
              badges={[
                { label: String(p.status), tone: 'status' },
                { label: String(p.priority), tone: 'priority' },
              ]}
              onPress={() => openEdit(p)}
              actions={[
                { icon: 'create-outline', onPress: () => openEdit(p) },
                { icon: 'trash-outline', onPress: () => remove(p), danger: true },
              ]}
            />
          )}
        />
      )}

      <PickerModal visible={woPick} title="Work order" items={woItems} onSelect={(x) => setForm((f) => ({ ...f, work_order_id: x.id }))} onClose={() => setWoPick(false)} />
      <PickerModal visible={userPick} title="Assign to" items={[{ id: '', label: 'None' }, ...userItems]} onSelect={(x) => setForm((f) => ({ ...f, assigned_to_id: x.id }))} onClose={() => setUserPick(false)} />

      <WorkshopFormSheet
        visible={modalOpen}
        title={editing ? 'Edit plan' : 'New plan'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <WorkshopPrimaryButton label={saving ? 'Saving…' : 'Save plan'} onPress={() => void submit()} disabled={saving} />
            <Pressable onPress={() => setModalOpen(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
        <WorkshopTextInput value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} />
        <WorkshopFieldLabel>Description</WorkshopFieldLabel>
        <WorkshopTextInput value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} multiline />
        {editing ? (
          <WorkshopChipSelect label="Status" options={[...PROD_STATUSES]} value={form.status} onChange={(s) => setForm((f) => ({ ...f, status: s as ProductionStatus }))} />
        ) : null}
        <WorkshopChipSelect label="Type" options={[...PROD_TYPES]} value={form.production_type} onChange={(s) => setForm((f) => ({ ...f, production_type: s as ProductionType }))} />
        <WorkshopChipSelect label="Priority" options={[...PROD_PRIOS]} value={form.priority} onChange={(s) => setForm((f) => ({ ...f, priority: s as ProductionPriority }))} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Start date" value={form.planned_start_date} onChange={(v) => setForm((f) => ({ ...f, planned_start_date: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="End date" value={form.planned_end_date} onChange={(v) => setForm((f) => ({ ...f, planned_end_date: v }))} />
          </View>
        </View>
        <WorkshopFieldLabel>Target qty / UOM</WorkshopFieldLabel>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ width: 96 }}><WorkshopTextInput keyboardType="decimal-pad" value={form.target_quantity} onChangeText={(v) => setForm((f) => ({ ...f, target_quantity: v }))} /></View>
          <View style={{ flex: 1 }}><WorkshopTextInput value={form.unit_of_measure} onChangeText={(v) => setForm((f) => ({ ...f, unit_of_measure: v }))} /></View>
        </View>
        <WorkshopFieldLabel>Production line</WorkshopFieldLabel>
        <WorkshopTextInput value={form.production_line} onChangeText={(v) => setForm((f) => ({ ...f, production_line: v }))} />
        <WorkshopFieldLabel>Est. material / labor cost</WorkshopFieldLabel>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><WorkshopTextInput keyboardType="decimal-pad" value={form.estimated_material_cost} onChangeText={(v) => setForm((f) => ({ ...f, estimated_material_cost: v }))} /></View>
          <View style={{ flex: 1 }}><WorkshopTextInput keyboardType="decimal-pad" value={form.estimated_labor_cost} onChangeText={(v) => setForm((f) => ({ ...f, estimated_labor_cost: v }))} /></View>
        </View>
        <WorkshopFieldLabel>Quality standards</WorkshopFieldLabel>
        <WorkshopTextInput value={form.quality_standards} onChangeText={(v) => setForm((f) => ({ ...f, quality_standards: v }))} multiline />
        <WorkshopPickerField label="Work order" value={form.work_order_id ? woItems.find((x) => x.id === form.work_order_id)?.label ?? '' : ''} placeholder="Optional" onPress={() => setWoPick(true)} />
        <WorkshopPickerField label="Assign to" value={form.assigned_to_id ? userItems.find((x) => x.id === form.assigned_to_id)?.label ?? '' : ''} placeholder="Optional" onPress={() => setUserPick(true)} />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
