import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopFieldLabel,
  WorkshopPrimaryButton,
} from '../components/WorkshopChrome';
import { PickerModal } from '../../healthcare/components/PickerModal';
import { AppModal } from '../../../components/layout/AppModal';

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
        Alert.alert('Production', extractErrorMessage(e, 'Failed to load'));
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
      Alert.alert('Production', 'Title is required');
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
      Alert.alert('Production', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (p: ProductionPlanResponse) => {
    Alert.alert('Delete', p.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProductionPlan(p.id);
            await run(false);
          } catch (e) {
            Alert.alert('Production', extractErrorMessage(e, 'Delete failed'));
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
      title="Production"
      subtitle="Production planning"
      right={
        <Pressable onPress={openCreate} className="p-2">
          <Ionicons name="add-circle" size={26} color="#4f46e5" />
        </Pressable>
      }
      scroll={false}
    >
      <TextInput
        className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
        placeholder="Search plans…"
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          {['all', ...PROD_STATUSES].map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatusF(s)}
              className={`rounded-full px-3 py-1 ${statusF === s ? 'bg-indigo-600' : 'bg-slate-100'}`}
            >
              <Text
                className={`text-xs capitalize ${statusF === s ? 'text-white' : 'text-slate-700'}`}
              >
                {s.replace(/_/g, ' ')}
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
          renderItem={({ item: p }) => (
            <WorkshopCard>
              <Text className="font-semibold text-slate-900">
                {p.plan_number} · {p.title}
              </Text>
              <Text className="text-xs text-slate-500 capitalize">
                {String(p.status).replace(/_/g, ' ')} ·{' '}
                {String(p.priority).replace(/_/g, ' ')}
              </Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  onPress={() => openEdit(p)}
                  className="rounded-lg bg-indigo-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-indigo-900">Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(p)}
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

      <AppModal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[94%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold">
              {editing ? 'Edit plan' : 'New plan'}
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
              {editing ? (
                <>
                  <WorkshopFieldLabel>Status</WorkshopFieldLabel>
                  <View className="mb-2 flex-row flex-wrap gap-1">
                    {PROD_STATUSES.map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => setForm((f) => ({ ...f, status: s }))}
                        className={`rounded-full px-2 py-1 ${form.status === s ? 'bg-indigo-600' : 'bg-slate-100'}`}
                      >
                        <Text
                          className={`text-xs capitalize ${form.status === s ? 'text-white' : 'text-slate-700'}`}
                        >
                          {s.replace(/_/g, ' ')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
              <WorkshopFieldLabel>Type</WorkshopFieldLabel>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {PROD_TYPES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() =>
                      setForm((f) => ({ ...f, production_type: s }))
                    }
                    className={`rounded-full px-2 py-1 ${form.production_type === s ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${form.production_type === s ? 'text-white' : 'text-slate-700'}`}
                    >
                      {s.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WorkshopFieldLabel>Priority</WorkshopFieldLabel>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {PROD_PRIOS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setForm((f) => ({ ...f, priority: s }))}
                    className={`rounded-full px-2 py-1 ${form.priority === s ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${form.priority === s ? 'text-white' : 'text-slate-700'}`}
                    >
                      {s.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WorkshopFieldLabel>Planned start / end</WorkshopFieldLabel>
              <View className="mb-2 flex-row gap-2">
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  placeholder="Start YYYY-MM-DD"
                  value={form.planned_start_date}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, planned_start_date: v }))
                  }
                />
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  placeholder="End YYYY-MM-DD"
                  value={form.planned_end_date}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, planned_end_date: v }))
                  }
                />
              </View>
              <WorkshopFieldLabel>Target qty / UOM</WorkshopFieldLabel>
              <View className="mb-2 flex-row gap-2">
                <TextInput
                  className="w-24 rounded-lg border border-slate-200 px-2 py-2"
                  keyboardType="decimal-pad"
                  value={form.target_quantity}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, target_quantity: v }))
                  }
                />
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  value={form.unit_of_measure}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, unit_of_measure: v }))
                  }
                />
              </View>
              <WorkshopFieldLabel>Production line</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.production_line}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, production_line: v }))
                }
              />
              <WorkshopFieldLabel>Est. material / labor cost</WorkshopFieldLabel>
              <View className="mb-2 flex-row gap-2">
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  keyboardType="decimal-pad"
                  value={form.estimated_material_cost}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, estimated_material_cost: v }))
                  }
                />
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  keyboardType="decimal-pad"
                  value={form.estimated_labor_cost}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, estimated_labor_cost: v }))
                  }
                />
              </View>
              <WorkshopFieldLabel>Quality standards</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.quality_standards}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, quality_standards: v }))
                }
                multiline
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
