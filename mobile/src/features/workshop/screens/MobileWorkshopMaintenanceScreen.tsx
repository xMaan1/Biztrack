import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, RefreshControl } from 'react-native';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
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
import { PickerModal } from '../../healthcare/components/PickerModal';
import {
  WorkshopChrome,
  WorkshopSearchBar,
  WorkshopChipSelect,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopSegmentTabs,
  WorkshopStatCard,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WS,
} from '../components/WorkshopChrome';

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
        appError('Maintenance', extractErrorMessage(e, 'Failed to load'));
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
      appAlert('Schedule', 'Title is required');
      return;
    }
    if (!schForm.equipment_id) {
      appAlert('Schedule', 'Select equipment');
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
      appError('Schedule', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const removeSch = (s: MaintenanceScheduleResponse) => {
    appConfirm({
      title: 'Delete',
      message: s.title,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteMaintenanceSchedule(s.id);
          await run(false);
        } catch (e) {
          appError('Schedule', extractErrorMessage(e, 'Delete failed'));
        }
      },
    });
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
      appAlert('Equipment', 'Name is required');
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
      appError('Equipment', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const removeEq = (e: EquipmentResponse) => {
    appConfirm({
      title: 'Delete',
      message: e.name,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteEquipment(e.id);
          await run(false);
        } catch (err) {
          appError('Equipment', extractErrorMessage(err, 'Delete failed'));
        }
      },
    });
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

  const overviewStats = [
    { label: 'Equipment', value: dash.total_equipment, sub: 'Total assets', icon: 'cube' as const, accent: '#4f46e5', accentBg: '#eef2ff' },
    { label: 'Operational', value: dash.operational_equipment, sub: 'Running', icon: 'checkmark-circle' as const, accent: '#10b981', accentBg: '#ecfdf5' },
    { label: 'In maintenance', value: dash.maintenance_equipment, sub: 'Active work', icon: 'build' as const, accent: '#f59e0b', accentBg: '#fffbeb' },
    { label: 'Overdue', value: dash.overdue_maintenance, sub: 'Needs attention', icon: 'warning' as const, accent: '#ef4444', accentBg: '#fef2f2' },
    { label: 'Scheduled', value: dash.scheduled_maintenance, sub: 'Upcoming', icon: 'calendar' as const, accent: '#2563eb', accentBg: '#eff6ff' },
    { label: 'Uptime', value: `${Math.round(dash.uptime_percentage ?? 0)}%`, sub: 'Fleet health', icon: 'pulse' as const, accent: '#0891b2', accentBg: '#ecfeff' },
  ];

  return (
    <WorkshopChrome
      title="Maintenance"
      subtitle="Equipment & schedules"
      right={
        tab === 'schedules' ? (
          <WorkshopHeaderButton onPress={openSchCreate} />
        ) : tab === 'equipment' ? (
          <WorkshopHeaderButton onPress={openEqCreate} />
        ) : (
          <View style={{ width: 72 }} />
        )
      }
      scroll={false}
    >
      <WorkshopSegmentTabs
        tabs={[
          { key: 'overview', label: 'Overview', icon: 'grid' },
          { key: 'schedules', label: 'Schedules', icon: 'calendar' },
          { key: 'equipment', label: 'Equipment', icon: 'construct' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : tab === 'overview' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor={WS.primary}
            />
          }
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {overviewStats.map((s) => (
              <WorkshopStatCard key={s.label} {...s} />
            ))}
          </View>
          <Pressable
            onPress={() => setTab('schedules')}
            style={{
              marginTop: 16,
              borderRadius: 14,
              backgroundColor: WS.primary,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>View schedules</Text>
          </Pressable>
        </ScrollView>
      ) : tab === 'schedules' ? (
        <View style={{ flex: 1 }}>
          <WorkshopSearchBar
            value={schSearch}
            onChangeText={setSchSearch}
            placeholder="Search schedules…"
          />
          <FlatList
            data={schFiltered}
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
                icon="calendar-outline"
                title="No schedules"
                subtitle="Plan preventive and corrective maintenance."
                actionLabel="Create schedule"
                onAction={openSchCreate}
              />
            }
            renderItem={({ item: s }) => (
              <WorkshopListCard
                kind="maintenance"
                icon="calendar"
                iconColor="#d97706"
                iconBg="#fffbeb"
                kicker={s.scheduled_date?.split('T')[0] || 'Unscheduled'}
                title={s.title}
                subtitle={s.maintenance_type.replace(/_/g, ' ')}
                meta={s.category ? `Category · ${s.category}` : undefined}
                badges={[{ label: s.priority, tone: 'priority' }]}
                onPress={() => openSchEdit(s)}
                actions={[
                  { icon: 'create-outline', onPress: () => openSchEdit(s) },
                  { icon: 'trash-outline', onPress: () => removeSch(s), danger: true },
                ]}
              />
            )}
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WorkshopSearchBar
            value={eqSearch}
            onChangeText={setEqSearch}
            placeholder="Search equipment…"
          />
          <FlatList
            data={eqFiltered}
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
                icon="construct-outline"
                title="No equipment"
                subtitle="Register workshop equipment and track status."
                actionLabel="Add equipment"
                onAction={openEqCreate}
              />
            }
            renderItem={({ item: e }) => (
              <WorkshopListCard
                kind="maintenance"
                icon="construct"
                iconColor="#64748b"
                iconBg="#f1f5f9"
                kicker={e.serial_number || String(e.category).replace(/_/g, ' ')}
                title={e.name}
                subtitle={[e.manufacturer, e.model].filter(Boolean).join(' · ') || undefined}
                meta={e.location || undefined}
                badges={[{ label: e.status, tone: 'status' }]}
                onPress={() => openEqEdit(e)}
                actions={[
                  { icon: 'create-outline', onPress: () => openEqEdit(e) },
                  { icon: 'trash-outline', onPress: () => removeEq(e), danger: true },
                ]}
              />
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

      <WorkshopFormSheet
        visible={schModal}
        title={editingSch ? 'Edit schedule' : 'New schedule'}
        onClose={() => setSchModal(false)}
        footer={
          <>
            <WorkshopPrimaryButton label={saving ? 'Saving…' : 'Save schedule'} onPress={() => void submitSch()} disabled={saving} />
            <Pressable onPress={() => setSchModal(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Title *</WorkshopFieldLabel>
        <WorkshopTextInput value={schForm.title} onChangeText={(v) => setSchForm((f) => ({ ...f, title: v }))} />
        <WorkshopFieldLabel>Description</WorkshopFieldLabel>
        <WorkshopTextInput value={schForm.description} onChangeText={(v) => setSchForm((f) => ({ ...f, description: v }))} multiline />
        <WorkshopPickerField
          label="Equipment *"
          value={schForm.equipment_id ? eqItems.find((x) => x.id === schForm.equipment_id)?.label ?? '' : ''}
          placeholder="Select"
          onPress={() => setEqPick(true)}
        />
        <WorkshopChipSelect label="Maintenance type" options={[...M_TYPES]} value={schForm.maintenance_type} onChange={(t) => setSchForm((f) => ({ ...f, maintenance_type: t as MaintenanceType }))} />
        <WorkshopChipSelect label="Priority" options={[...M_PRIOS]} value={schForm.priority} onChange={(p) => setSchForm((f) => ({ ...f, priority: p as MaintenancePriority }))} />
        <WorkshopChipSelect label="Category" options={[...M_CATS]} value={schForm.category} onChange={(c) => setSchForm((f) => ({ ...f, category: c as MaintenanceCategory }))} />
        <WorkshopDatePickerField label="Scheduled date" value={schForm.scheduled_date} onChange={(v) => setSchForm((f) => ({ ...f, scheduled_date: v }))} />
        <WorkshopFieldLabel>Duration (hours) / Est. cost</WorkshopFieldLabel>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><WorkshopTextInput keyboardType="decimal-pad" value={schForm.estimated_duration_hours} onChangeText={(v) => setSchForm((f) => ({ ...f, estimated_duration_hours: v }))} /></View>
          <View style={{ flex: 1 }}><WorkshopTextInput keyboardType="decimal-pad" value={schForm.estimated_cost} onChangeText={(v) => setSchForm((f) => ({ ...f, estimated_cost: v }))} /></View>
        </View>
        <WorkshopFieldLabel>Location</WorkshopFieldLabel>
        <WorkshopTextInput value={schForm.location} onChangeText={(v) => setSchForm((f) => ({ ...f, location: v }))} />
        <WorkshopPickerField
          label="Technician"
          value={schForm.assigned_technician_id ? userItems.find((x) => x.id === schForm.assigned_technician_id)?.label ?? '' : ''}
          placeholder="Optional"
          onPress={() => setTechPick(true)}
        />
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={eqModal}
        title={editingEq ? 'Edit equipment' : 'New equipment'}
        onClose={() => setEqModal(false)}
        footer={
          <>
            <WorkshopPrimaryButton label={saving ? 'Saving…' : 'Save equipment'} onPress={() => void submitEq()} disabled={saving} />
            <Pressable onPress={() => setEqModal(false)} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
            </Pressable>
          </>
        }
      >
        <WorkshopFieldLabel>Name *</WorkshopFieldLabel>
        <WorkshopTextInput value={eqForm.name} onChangeText={(v) => setEqForm((f) => ({ ...f, name: v }))} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <WorkshopFieldLabel>Model</WorkshopFieldLabel>
            <WorkshopTextInput value={eqForm.model} onChangeText={(v) => setEqForm((f) => ({ ...f, model: v }))} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopFieldLabel>Serial</WorkshopFieldLabel>
            <WorkshopTextInput value={eqForm.serial_number} onChangeText={(v) => setEqForm((f) => ({ ...f, serial_number: v }))} />
          </View>
        </View>
        <WorkshopFieldLabel>Manufacturer</WorkshopFieldLabel>
        <WorkshopTextInput value={eqForm.manufacturer} onChangeText={(v) => setEqForm((f) => ({ ...f, manufacturer: v }))} />
        <WorkshopFieldLabel>Location</WorkshopFieldLabel>
        <WorkshopTextInput value={eqForm.location} onChangeText={(v) => setEqForm((f) => ({ ...f, location: v }))} />
        <WorkshopChipSelect label="Category" options={[...M_CATS]} value={eqForm.category} onChange={(c) => setEqForm((f) => ({ ...f, category: c as MaintenanceCategory }))} />
        <WorkshopChipSelect label="Status" options={[...EQ_STATUSES]} value={eqForm.status} onChange={(s) => setEqForm((f) => ({ ...f, status: s as EquipmentStatus }))} />
        <WorkshopFieldLabel>Operating hours</WorkshopFieldLabel>
        <WorkshopTextInput keyboardType="decimal-pad" value={eqForm.operating_hours} onChangeText={(v) => setEqForm((f) => ({ ...f, operating_hours: v }))} />
        <WorkshopDatePickerField label="Install date" value={eqForm.installation_date} onChange={(v) => setEqForm((f) => ({ ...f, installation_date: v }))} />
        <WorkshopDatePickerField label="Warranty expiry" value={eqForm.warranty_expiry} onChange={(v) => setEqForm((f) => ({ ...f, warranty_expiry: v }))} />
        <WorkshopDatePickerField label="Next maintenance" value={eqForm.next_maintenance_date} onChange={(v) => setEqForm((f) => ({ ...f, next_maintenance_date: v }))} />
        <WorkshopFieldLabel>Operating instructions</WorkshopFieldLabel>
        <WorkshopTextInput value={eqForm.operating_instructions} onChangeText={(v) => setEqForm((f) => ({ ...f, operating_instructions: v }))} multiline />
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
