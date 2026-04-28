import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import {
  MaintenanceType,
  MaintenancePriority,
  MaintenanceCategory,
  EquipmentStatus,
  type MaintenanceScheduleCreate,
  type MaintenanceScheduleUpdate,
  type MaintenanceScheduleResponse,
  type EquipmentCreate,
  type EquipmentUpdate,
  type EquipmentResponse,
  type MaintenanceDashboardStats,
} from '../../../models/maintenance';
import {
  getMaintenanceDashboard,
  getMaintenanceSchedules,
  createMaintenanceSchedule,
  updateMaintenanceSchedule,
  deleteMaintenanceSchedule,
  getEquipmentList,
  createEquipment,
  updateEquipment,
  deleteEquipment,
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

const M_TYPES = Object.values(MaintenanceType);
const M_PRIOS = Object.values(MaintenancePriority);
const M_CATS = Object.values(MaintenanceCategory);
const EQ_STATUSES = Object.values(EquipmentStatus);

type Tab = 'overview' | 'schedules' | 'equipment';

const emptyDash: MaintenanceDashboardStats = {
  total_equipment: 0,
  operational_equipment: 0,
  maintenance_equipment: 0,
  overdue_maintenance: 0,
  scheduled_maintenance: 0,
  completed_maintenance: 0,
  total_cost: 0,
  efficiency_score: 0,
  uptime_percentage: 0,
};

export function MobileWorkshopMaintenanceScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [tab, setTab] = useState<Tab>('overview');
  const [dash, setDash] = useState<MaintenanceDashboardStats>(emptyDash);
  const [schedules, setSchedules] = useState<MaintenanceScheduleResponse[]>([]);
  const [equipment, setEquipment] = useState<EquipmentResponse[]>([]);
  const [users, setUsers] = useState<
    { id: string; name?: string; username?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schSearch, setSchSearch] = useState('');
  const [eqSearch, setEqSearch] = useState('');
  const [schModal, setSchModal] = useState(false);
  const [eqModal, setEqModal] = useState(false);
  const [editingSch, setEditingSch] =
    useState<MaintenanceScheduleResponse | null>(null);
  const [editingEq, setEditingEq] = useState<EquipmentResponse | null>(null);
  const [eqPick, setEqPick] = useState(false);
  const [techPick, setTechPick] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schForm, setSchForm] = useState({
    title: '',
    description: '',
    maintenance_type: MaintenanceType.PREVENTIVE,
    priority: MaintenancePriority.MEDIUM,
    category: MaintenanceCategory.GENERAL,
    equipment_id: '',
    location: '',
    scheduled_date: '',
    estimated_duration_hours: '2',
    estimated_cost: '0',
    assigned_technician_id: '',
  });
  const [eqForm, setEqForm] = useState({
    name: '',
    model: '',
    serial_number: '',
    manufacturer: '',
    category: MaintenanceCategory.GENERAL,
    location: '',
    status: EquipmentStatus.OPERATIONAL,
    operating_hours: '0',
    installation_date: '',
    warranty_expiry: '',
    next_maintenance_date: '',
    operating_instructions: '',
  });

  useEffect(() => {
    setSidebarActivePath('/workshop-management/maintenance');
  }, [setSidebarActivePath]);

  const load = useCallback(async () => {
    const [u, eq, sch] = await Promise.all([
      getTenantUsers(),
      getEquipmentList(0, 200),
      getMaintenanceSchedules(0, 200),
    ]);
    setUsers(u);
    setEquipment(eq);
    setSchedules(sch);
    try {
      const d = await getMaintenanceDashboard();
      setDash(d);
    } catch {
      setDash(emptyDash);
    }
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert('Maintenance', extractErrorMessage(e, 'Failed to load'));
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

  const eqItems = equipment.map((e) => ({
    id: e.id,
    label: e.name || e.id,
  }));
  const userItems = users.map((u) => ({
    id: u.id,
    label: u.name || u.username || u.id,
  }));

  const openSchCreate = () => {
    setEditingSch(null);
    setSchForm({
      title: '',
      description: '',
      maintenance_type: MaintenanceType.PREVENTIVE,
      priority: MaintenancePriority.MEDIUM,
      category: MaintenanceCategory.GENERAL,
      equipment_id: equipment[0]?.id || '',
      location: '',
      scheduled_date: '',
      estimated_duration_hours: '2',
      estimated_cost: '0',
      assigned_technician_id: '',
    });
    setSchModal(true);
  };

  const openSchEdit = (s: MaintenanceScheduleResponse) => {
    setEditingSch(s);
    setSchForm({
      title: s.title,
      description: s.description || '',
      maintenance_type: s.maintenance_type,
      priority: s.priority,
      category: s.category,
      equipment_id: s.equipment_id,
      location: s.location || '',
      scheduled_date: s.scheduled_date
        ? s.scheduled_date.split('T')[0]
        : '',
      estimated_duration_hours: String(s.estimated_duration_hours ?? 2),
      estimated_cost: String(s.estimated_cost ?? 0),
      assigned_technician_id: s.assigned_technician_id || '',
    });
    setSchModal(true);
  };

  const submitSch = async () => {
    if (!schForm.title.trim()) {
      Alert.alert('Schedule', 'Title is required');
      return;
    }
    if (!schForm.equipment_id) {
      Alert.alert('Schedule', 'Select equipment');
      return;
    }
    const scheduled = schForm.scheduled_date
      ? `${schForm.scheduled_date}T09:00:00Z`
      : new Date().toISOString();
    try {
      setSaving(true);
      if (editingSch) {
        const up: MaintenanceScheduleUpdate = {
          title: schForm.title.trim(),
          description: schForm.description || undefined,
          maintenance_type: schForm.maintenance_type,
          priority: schForm.priority,
          category: schForm.category,
          equipment_id: schForm.equipment_id,
          location: schForm.location || undefined,
          scheduled_date: scheduled,
          estimated_duration_hours:
            parseFloat(schForm.estimated_duration_hours) || 2,
          estimated_cost: parseFloat(schForm.estimated_cost) || 0,
          assigned_technician_id:
            schForm.assigned_technician_id || undefined,
        };
        await updateMaintenanceSchedule(editingSch.id, up);
      } else {
        const cr: MaintenanceScheduleCreate = {
          title: schForm.title.trim(),
          description: schForm.description || undefined,
          maintenance_type: schForm.maintenance_type,
          priority: schForm.priority,
          category: schForm.category,
          equipment_id: schForm.equipment_id,
          location: schForm.location || undefined,
          scheduled_date: scheduled,
          estimated_duration_hours:
            parseFloat(schForm.estimated_duration_hours) || 2,
          assigned_technician_id:
            schForm.assigned_technician_id || undefined,
          required_parts: [],
          required_tools: [],
          safety_requirements: [],
          maintenance_procedures: [],
          estimated_cost: parseFloat(schForm.estimated_cost) || 0,
          tags: [],
        };
        await createMaintenanceSchedule(cr);
      }
      setSchModal(false);
      await run(false);
    } catch (e) {
      Alert.alert('Schedule', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const removeSch = (s: MaintenanceScheduleResponse) => {
    Alert.alert('Delete', s.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMaintenanceSchedule(s.id);
            await run(false);
          } catch (e) {
            Alert.alert('Schedule', extractErrorMessage(e, 'Delete failed'));
          }
        },
      },
    ]);
  };

  const openEqCreate = () => {
    setEditingEq(null);
    setEqForm({
      name: '',
      model: '',
      serial_number: '',
      manufacturer: '',
      category: MaintenanceCategory.GENERAL,
      location: '',
      status: EquipmentStatus.OPERATIONAL,
      operating_hours: '0',
      installation_date: '',
      warranty_expiry: '',
      next_maintenance_date: '',
      operating_instructions: '',
    });
    setEqModal(true);
  };

  const openEqEdit = (e: EquipmentResponse) => {
    setEditingEq(e);
    setEqForm({
      name: e.name,
      model: e.model || '',
      serial_number: e.serial_number || '',
      manufacturer: e.manufacturer || '',
      category: e.category,
      location: e.location || '',
      status: e.status,
      operating_hours: String(e.operating_hours ?? 0),
      installation_date: e.installation_date
        ? e.installation_date.split('T')[0]
        : '',
      warranty_expiry: e.warranty_expiry
        ? e.warranty_expiry.split('T')[0]
        : '',
      next_maintenance_date: e.next_maintenance_date
        ? e.next_maintenance_date.split('T')[0]
        : '',
      operating_instructions: e.operating_instructions || '',
    });
    setEqModal(true);
  };

  const isoDay = (d: string) =>
    d ? `${d}T12:00:00Z` : undefined;

  const submitEq = async () => {
    if (!eqForm.name.trim()) {
      Alert.alert('Equipment', 'Name is required');
      return;
    }
    try {
      setSaving(true);
      if (editingEq) {
        const up: EquipmentUpdate = {
          name: eqForm.name.trim(),
          model: eqForm.model || undefined,
          serial_number: eqForm.serial_number || undefined,
          manufacturer: eqForm.manufacturer || undefined,
          category: eqForm.category,
          location: eqForm.location || undefined,
          status: eqForm.status,
          operating_hours: parseFloat(eqForm.operating_hours) || 0,
          installation_date: isoDay(eqForm.installation_date),
          warranty_expiry: isoDay(eqForm.warranty_expiry),
          next_maintenance_date: isoDay(eqForm.next_maintenance_date),
          operating_instructions:
            eqForm.operating_instructions || undefined,
        };
        await updateEquipment(editingEq.id, up);
      } else {
        const cr: EquipmentCreate = {
          name: eqForm.name.trim(),
          model: eqForm.model || undefined,
          serial_number: eqForm.serial_number || undefined,
          manufacturer: eqForm.manufacturer || undefined,
          category: eqForm.category,
          location: eqForm.location || undefined,
          status: eqForm.status,
          installation_date: isoDay(eqForm.installation_date),
          warranty_expiry: isoDay(eqForm.warranty_expiry),
          next_maintenance_date: isoDay(eqForm.next_maintenance_date),
          operating_hours: parseFloat(eqForm.operating_hours) || 0,
          specifications: {},
          maintenance_history: [],
          assigned_technicians: [],
          critical_spare_parts: [],
          operating_instructions:
            eqForm.operating_instructions || undefined,
          safety_guidelines: [],
          tags: [],
        };
        await createEquipment(cr);
      }
      setEqModal(false);
      await run(false);
    } catch (e) {
      Alert.alert('Equipment', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const removeEq = (e: EquipmentResponse) => {
    Alert.alert('Delete', e.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEquipment(e.id);
            await run(false);
          } catch (err) {
            Alert.alert(
              'Equipment',
              extractErrorMessage(err, 'Delete failed'),
            );
          }
        },
      },
    ]);
  };

  const schFiltered = schedules.filter((s) => {
    const q = schSearch.toLowerCase();
    return (
      !q ||
      s.title.toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    );
  });

  const eqFiltered = equipment.filter((e) => {
    const q = eqSearch.toLowerCase();
    return (
      !q ||
      e.name.toLowerCase().includes(q) ||
      (e.model || '').toLowerCase().includes(q)
    );
  });

  const tabRow = (
    <View className="mb-3 flex-row rounded-xl bg-slate-100 p-1">
      {(
        [
          ['overview', 'Overview'],
          ['schedules', 'Schedules'],
          ['equipment', 'Equipment'],
        ] as const
      ).map(([k, label]) => (
        <Pressable
          key={k}
          onPress={() => setTab(k)}
          className={`flex-1 rounded-lg py-2 ${tab === k ? 'bg-white shadow-sm' : ''}`}
        >
          <Text
            className={`text-center text-xs font-semibold ${tab === k ? 'text-indigo-900' : 'text-slate-600'}`}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <WorkshopChrome
      title="Maintenance"
      subtitle="Equipment & schedules"
      scroll={false}
    >
      {tabRow}

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : tab === 'overview' ? (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor="#4f46e5"
            />
          }
        >
          {[
            ['Equipment', dash.total_equipment],
            ['Operational', dash.operational_equipment],
            ['In maintenance', dash.maintenance_equipment],
            ['Overdue', dash.overdue_maintenance],
            ['Scheduled', dash.scheduled_maintenance],
            ['Completed', dash.completed_maintenance],
            ['Uptime %', Math.round(dash.uptime_percentage ?? 0)],
            ['Efficiency', Math.round(dash.efficiency_score ?? 0)],
          ].map(([label, val]) => (
            <WorkshopCard key={String(label)}>
              <Text className="text-xs font-medium text-slate-500">
                {label}
              </Text>
              <Text className="text-2xl font-bold text-slate-900">{val}</Text>
            </WorkshopCard>
          ))}
        </ScrollView>
      ) : tab === 'schedules' ? (
        <View className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <TextInput
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2"
              placeholder="Search schedules…"
              placeholderTextColor="#94a3b8"
              value={schSearch}
              onChangeText={setSchSearch}
            />
            <Pressable onPress={openSchCreate} className="p-2">
              <Ionicons name="add-circle" size={28} color="#4f46e5" />
            </Pressable>
          </View>
          <FlatList
            data={schFiltered}
            keyExtractor={(x) => x.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void run(true)}
                tintColor="#4f46e5"
              />
            }
            renderItem={({ item: s }) => (
              <WorkshopCard>
                <Text className="font-semibold text-slate-900">{s.title}</Text>
                <Text className="text-xs text-slate-500 capitalize">
                  {s.maintenance_type.replace(/_/g, ' ')} ·{' '}
                  {s.scheduled_date?.split('T')[0] || '—'}
                </Text>
                <View className="mt-2 flex-row gap-2">
                  <Pressable
                    onPress={() => openSchEdit(s)}
                    className="rounded-lg bg-indigo-100 px-2 py-1"
                  >
                    <Text className="text-xs font-medium text-indigo-900">
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeSch(s)}
                    className="rounded-lg bg-red-50 px-2 py-1"
                  >
                    <Text className="text-xs text-red-700">Delete</Text>
                  </Pressable>
                </View>
              </WorkshopCard>
            )}
          />
        </View>
      ) : (
        <View className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <TextInput
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2"
              placeholder="Search equipment…"
              placeholderTextColor="#94a3b8"
              value={eqSearch}
              onChangeText={setEqSearch}
            />
            <Pressable onPress={openEqCreate} className="p-2">
              <Ionicons name="add-circle" size={28} color="#4f46e5" />
            </Pressable>
          </View>
          <FlatList
            data={eqFiltered}
            keyExtractor={(x) => x.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void run(true)}
                tintColor="#4f46e5"
              />
            }
            renderItem={({ item: e }) => (
              <WorkshopCard>
                <Text className="font-semibold text-slate-900">{e.name}</Text>
                <Text className="text-xs text-slate-500 capitalize">
                  {e.status.replace(/_/g, ' ')}
                  {e.location ? ` · ${e.location}` : ''}
                </Text>
                <View className="mt-2 flex-row gap-2">
                  <Pressable
                    onPress={() => openEqEdit(e)}
                    className="rounded-lg bg-indigo-100 px-2 py-1"
                  >
                    <Text className="text-xs font-medium text-indigo-900">
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeEq(e)}
                    className="rounded-lg bg-red-50 px-2 py-1"
                  >
                    <Text className="text-xs text-red-700">Delete</Text>
                  </Pressable>
                </View>
              </WorkshopCard>
            )}
          />
        </View>
      )}

      <PickerModal
        visible={eqPick}
        title="Equipment"
        items={eqItems}
        onSelect={(x) => setSchForm((f) => ({ ...f, equipment_id: x.id }))}
        onClose={() => setEqPick(false)}
      />
      <PickerModal
        visible={techPick}
        title="Technician"
        items={[{ id: '', label: 'None' }, ...userItems]}
        onSelect={(x) =>
          setSchForm((f) => ({ ...f, assigned_technician_id: x.id }))
        }
        onClose={() => setTechPick(false)}
      />

      <AppModal visible={schModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold">
              {editingSch ? 'Edit schedule' : 'New schedule'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={schForm.title}
                onChangeText={(v) => setSchForm((f) => ({ ...f, title: v }))}
              />
              <WorkshopFieldLabel>Description</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={schForm.description}
                onChangeText={(v) =>
                  setSchForm((f) => ({ ...f, description: v }))
                }
                multiline
              />
              <WorkshopFieldLabel>Equipment *</WorkshopFieldLabel>
              <Pressable
                onPress={() => setEqPick(true)}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text>
                  {schForm.equipment_id
                    ? eqItems.find((x) => x.id === schForm.equipment_id)
                        ?.label
                    : 'Select'}
                </Text>
              </Pressable>
              <WorkshopFieldLabel>Type / Priority / Category</WorkshopFieldLabel>
              <ScrollView horizontal className="mb-1 max-h-8">
                <View className="flex-row flex-wrap gap-1">
                  {M_TYPES.map((t) => (
                    <Pressable
                      key={t}
                      onPress={() =>
                        setSchForm((f) => ({ ...f, maintenance_type: t }))
                      }
                      className={`rounded-full px-2 py-1 ${schForm.maintenance_type === t ? 'bg-indigo-600' : 'bg-slate-100'}`}
                    >
                      <Text
                        className={`text-xs capitalize ${schForm.maintenance_type === t ? 'text-white' : 'text-slate-700'}`}
                      >
                        {t.replace(/_/g, ' ')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {M_PRIOS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setSchForm((f) => ({ ...f, priority: p }))}
                    className={`rounded-full px-2 py-1 ${schForm.priority === p ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${schForm.priority === p ? 'text-white' : 'text-slate-700'}`}
                    >
                      {p.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {M_CATS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() =>
                      setSchForm((f) => ({ ...f, category: c }))
                    }
                    className={`rounded-full px-2 py-1 ${schForm.category === c ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${schForm.category === c ? 'text-white' : 'text-slate-700'}`}
                    >
                      {c.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WorkshopFieldLabel>Scheduled date</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="YYYY-MM-DD"
                value={schForm.scheduled_date}
                onChangeText={(v) =>
                  setSchForm((f) => ({ ...f, scheduled_date: v }))
                }
              />
              <WorkshopFieldLabel>Duration (hours) / Est. cost</WorkshopFieldLabel>
              <View className="mb-2 flex-row gap-2">
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  keyboardType="decimal-pad"
                  value={schForm.estimated_duration_hours}
                  onChangeText={(v) =>
                    setSchForm((f) => ({ ...f, estimated_duration_hours: v }))
                  }
                />
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  keyboardType="decimal-pad"
                  value={schForm.estimated_cost}
                  onChangeText={(v) =>
                    setSchForm((f) => ({ ...f, estimated_cost: v }))
                  }
                />
              </View>
              <WorkshopFieldLabel>Location</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={schForm.location}
                onChangeText={(v) =>
                  setSchForm((f) => ({ ...f, location: v }))
                }
              />
              <WorkshopFieldLabel>Technician</WorkshopFieldLabel>
              <Pressable
                onPress={() => setTechPick(true)}
                className="mb-4 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text>
                  {schForm.assigned_technician_id
                    ? userItems.find(
                        (x) => x.id === schForm.assigned_technician_id,
                      )?.label
                    : 'Optional'}
                </Text>
              </Pressable>
            </ScrollView>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save'}
              onPress={() => void submitSch()}
              disabled={saving}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setSchModal(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <AppModal visible={eqModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold">
              {editingEq ? 'Edit equipment' : 'New equipment'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <WorkshopFieldLabel>Name *</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={eqForm.name}
                onChangeText={(v) => setEqForm((f) => ({ ...f, name: v }))}
              />
              <View className="mb-2 flex-row gap-2">
                <View className="flex-1">
                  <WorkshopFieldLabel>Model</WorkshopFieldLabel>
                  <TextInput
                    className="rounded-lg border border-slate-200 px-2 py-2"
                    value={eqForm.model}
                    onChangeText={(v) =>
                      setEqForm((f) => ({ ...f, model: v }))
                    }
                  />
                </View>
                <View className="flex-1">
                  <WorkshopFieldLabel>Serial</WorkshopFieldLabel>
                  <TextInput
                    className="rounded-lg border border-slate-200 px-2 py-2"
                    value={eqForm.serial_number}
                    onChangeText={(v) =>
                      setEqForm((f) => ({ ...f, serial_number: v }))
                    }
                  />
                </View>
              </View>
              <WorkshopFieldLabel>Manufacturer / Location</WorkshopFieldLabel>
              <TextInput
                className="mb-1 rounded-lg border border-slate-200 px-3 py-2"
                value={eqForm.manufacturer}
                onChangeText={(v) =>
                  setEqForm((f) => ({ ...f, manufacturer: v }))
                }
              />
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={eqForm.location}
                onChangeText={(v) =>
                  setEqForm((f) => ({ ...f, location: v }))
                }
              />
              <WorkshopFieldLabel>Category</WorkshopFieldLabel>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {M_CATS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setEqForm((f) => ({ ...f, category: c }))}
                    className={`rounded-full px-2 py-1 ${eqForm.category === c ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${eqForm.category === c ? 'text-white' : 'text-slate-700'}`}
                    >
                      {c.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WorkshopFieldLabel>Status</WorkshopFieldLabel>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {EQ_STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setEqForm((f) => ({ ...f, status: s }))}
                    className={`rounded-full px-2 py-1 ${eqForm.status === s ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${eqForm.status === s ? 'text-white' : 'text-slate-700'}`}
                    >
                      {s.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WorkshopFieldLabel>Operating hours</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                keyboardType="decimal-pad"
                value={eqForm.operating_hours}
                onChangeText={(v) =>
                  setEqForm((f) => ({ ...f, operating_hours: v }))
                }
              />
              <WorkshopFieldLabel>Install / warranty / next service</WorkshopFieldLabel>
              <TextInput
                className="mb-1 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Install YYYY-MM-DD"
                value={eqForm.installation_date}
                onChangeText={(v) =>
                  setEqForm((f) => ({ ...f, installation_date: v }))
                }
              />
              <TextInput
                className="mb-1 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Warranty YYYY-MM-DD"
                value={eqForm.warranty_expiry}
                onChangeText={(v) =>
                  setEqForm((f) => ({ ...f, warranty_expiry: v }))
                }
              />
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Next maintenance YYYY-MM-DD"
                value={eqForm.next_maintenance_date}
                onChangeText={(v) =>
                  setEqForm((f) => ({ ...f, next_maintenance_date: v }))
                }
              />
              <WorkshopFieldLabel>Operating instructions</WorkshopFieldLabel>
              <TextInput
                className="mb-4 rounded-lg border border-slate-200 px-3 py-2"
                value={eqForm.operating_instructions}
                onChangeText={(v) =>
                  setEqForm((f) => ({ ...f, operating_instructions: v }))
                }
                multiline
              />
            </ScrollView>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save'}
              onPress={() => void submitEq()}
              disabled={saving}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setEqModal(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>
    </WorkshopChrome>
  );
}
