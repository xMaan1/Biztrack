import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type { JobCard, JobCardCreate, JobCardUpdate } from '../../../models/workshop/JobCard';
import {
  getJobCards,
  createJobCard,
  updateJobCard,
  deleteJobCard,
  getWorkOrders,
  getTenantUsers,
  downloadJobCardPdfToShare,
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

const JC_STATUSES = ['draft', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export function MobileWorkshopJobCardsScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobCard | null>(null);
  const [woPick, setWoPick] = useState(false);
  const [userPick, setUserPick] = useState(false);
  const [workOrders, setWorkOrders] = useState<
    { id: string; work_order_number: string; title: string }[]
  >([]);
  const [users, setUsers] = useState<
    { id: string; name?: string; username?: string }[]
  >([]);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'draft',
    priority: 'medium',
    work_order_id: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_vin: '',
    vehicle_color: '',
    vehicle_reg: '',
    vehicle_mileage: '',
    vehicle_engine_number: '',
    assigned_to_id: '',
    planned_date: '',
    date_time_out: '',
    labor_estimate: '0',
    parts_estimate: '0',
    vat_rate_percent: '15',
    notes: '',
  });

  useEffect(() => {
    setSidebarActivePath('/workshop-management/job-cards');
  }, [setSidebarActivePath]);

  const loadRefs = useCallback(async () => {
    const [wo, u] = await Promise.all([getWorkOrders(), getTenantUsers()]);
    setWorkOrders(
      wo.map((w: any) => ({
        id: w.id,
        work_order_number: w.work_order_number,
        title: w.title,
      })),
    );
    setUsers(u);
  }, []);

  const load = useCallback(async () => {
    const data = await getJobCards();
    setList(data);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await Promise.all([loadRefs(), load()]);
      } catch (e) {
        Alert.alert('Job cards', extractErrorMessage(e, 'Failed to load'));
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

  const filtered = list.filter((jc) => {
    const ok =
      statusF === 'all' || jc.status === statusF;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      jc.title.toLowerCase().includes(q) ||
      (jc.job_card_number || '').toLowerCase().includes(q) ||
      (jc.customer_name || '').toLowerCase().includes(q);
    return ok && matchSearch;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      status: 'draft',
      priority: 'medium',
      work_order_id: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_year: '',
      vehicle_vin: '',
      vehicle_color: '',
      vehicle_reg: '',
      vehicle_mileage: '',
      vehicle_engine_number: '',
      assigned_to_id: '',
      planned_date: '',
      date_time_out: '',
      labor_estimate: '0',
      parts_estimate: '0',
      vat_rate_percent: '15',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (jc: JobCard) => {
    setEditing(jc);
    const vi = (jc.vehicle_info || {}) as Record<string, string>;
    const dateTimeOut = jc.completed_at
      ? jc.completed_at.slice(0, 16).replace('T', ' ')
      : '';
    setForm({
      title: jc.title || '',
      description: jc.description || '',
      status: jc.status || 'draft',
      priority: jc.priority || 'medium',
      work_order_id: jc.work_order_id || '',
      vehicle_make: vi.make || '',
      vehicle_model: vi.model || '',
      vehicle_year: vi.year || '',
      vehicle_vin: vi.vin || '',
      vehicle_color: vi.color || '',
      vehicle_reg: vi.registration_number || '',
      vehicle_mileage: vi.mileage || '',
      vehicle_engine_number: (vi.engine_number as string) || '',
      assigned_to_id: jc.assigned_to_id || '',
      planned_date: jc.planned_date ? jc.planned_date.split('T')[0] : '',
      date_time_out: dateTimeOut,
      labor_estimate: String(jc.labor_estimate ?? 0),
      parts_estimate: String(jc.parts_estimate ?? 0),
      vat_rate_percent: String(
        jc.vat_rate != null ? Math.round(Number(jc.vat_rate) * 100) : 15,
      ),
      notes: jc.notes || '',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.title.trim()) {
      Alert.alert('Job card', 'Title is required');
      return;
    }
    const vatPct = parseFloat(form.vat_rate_percent) || 0;
    const payload: JobCardCreate | JobCardUpdate = {
      title: form.title.trim(),
      description: form.description || undefined,
      status: form.status,
      priority: form.priority,
      work_order_id: form.work_order_id || undefined,
      vehicle_info: {
        make: form.vehicle_make || undefined,
        model: form.vehicle_model || undefined,
        year: form.vehicle_year || undefined,
        vin: form.vehicle_vin || undefined,
        color: form.vehicle_color || undefined,
        registration_number: form.vehicle_reg || undefined,
        mileage: form.vehicle_mileage || undefined,
        engine_number: form.vehicle_engine_number || undefined,
      },
      assigned_to_id: form.assigned_to_id || undefined,
      planned_date: form.planned_date
        ? `${form.planned_date}T12:00:00Z`
        : undefined,
      ...(form.date_time_out.trim()
        ? {
            completed_at: `${form.date_time_out.trim().replace(' ', 'T')}:00Z`,
          }
        : {}),
      labor_estimate: parseFloat(form.labor_estimate) || 0,
      parts_estimate: parseFloat(form.parts_estimate) || 0,
      vat_rate: vatPct / 100,
      notes: form.notes || undefined,
    };
    try {
      setSaving(true);
      if (editing) {
        await updateJobCard(editing.id, payload as JobCardUpdate);
      } else {
        await createJobCard(payload as JobCardCreate);
      }
      setModalOpen(false);
      await run(false);
    } catch (e) {
      Alert.alert('Job card', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (jc: JobCard) => {
    Alert.alert('Delete', jc.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteJobCard(jc.id);
            await run(false);
          } catch (e) {
            Alert.alert('Job card', extractErrorMessage(e, 'Delete failed'));
          }
        },
      },
    ]);
  };

  const sharePdf = async (jc: JobCard) => {
    try {
      setPdfBusy(jc.id);
      const { fileUri } = await downloadJobCardPdfToShare(jc.id);
      const can = await Sharing.isAvailableAsync();
      if (can) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('PDF', 'Sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert('PDF', extractErrorMessage(e, 'Could not export PDF'));
    } finally {
      setPdfBusy(null);
    }
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
      title="Job cards"
      subtitle="Workshop job cards"
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
        <View className="flex-row gap-2">
          {['all', ...JC_STATUSES].map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatusF(s)}
              className={`rounded-full px-3 py-1 ${statusF === s ? 'bg-indigo-600' : 'bg-slate-100'}`}
            >
              <Text
                className={`text-xs capitalize ${statusF === s ? 'text-white' : 'text-slate-700'}`}
              >
                {s.replace('_', ' ')}
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
          renderItem={({ item: jc }) => (
            <WorkshopCard>
              <Text className="font-semibold text-slate-900">
                {jc.job_card_number} · {jc.title}
              </Text>
              <Text className="text-xs text-slate-500">
                {jc.customer_name || '—'} ·{' '}
                <Text className="capitalize">{jc.status?.replace('_', ' ')}</Text>
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => openEdit(jc)}
                  className="rounded-lg bg-indigo-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-indigo-900">Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => void sharePdf(jc)}
                  disabled={pdfBusy === jc.id}
                  className="rounded-lg bg-slate-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-slate-800">
                    {pdfBusy === jc.id ? 'PDF…' : 'PDF'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(jc)}
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
              {editing ? 'Edit job card' : 'New job card'}
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
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                multiline
              />
              <WorkshopFieldLabel>Work order</WorkshopFieldLabel>
              <Pressable
                onPress={() => setWoPick(true)}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text>
                  {workOrders.find((w) => w.id === form.work_order_id)
                    ? woItems.find((x) => x.id === form.work_order_id)?.label
                    : 'Optional'}
                </Text>
              </Pressable>
              <WorkshopFieldLabel>Assign to</WorkshopFieldLabel>
              <Pressable
                onPress={() => setUserPick(true)}
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text>
                  {form.assigned_to_id
                    ? userItems.find((x) => x.id === form.assigned_to_id)
                        ?.label
                    : 'Optional'}
                </Text>
              </Pressable>
              <WorkshopFieldLabel>Status / Priority</WorkshopFieldLabel>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {JC_STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setForm((f) => ({ ...f, status: s }))}
                    className={`rounded-full px-2 py-1 ${form.status === s ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${form.status === s ? 'text-white' : 'text-slate-700'}`}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="mb-2 flex-row flex-wrap gap-1">
                {PRIORITIES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setForm((f) => ({ ...f, priority: s }))}
                    className={`rounded-full px-2 py-1 ${form.priority === s ? 'bg-indigo-600' : 'bg-slate-100'}`}
                  >
                    <Text
                      className={`text-xs capitalize ${form.priority === s ? 'text-white' : 'text-slate-700'}`}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <WorkshopFieldLabel>Vehicle reg / VIN / make / model</WorkshopFieldLabel>
              <TextInput
                className="mb-1 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Registration"
                value={form.vehicle_reg}
                onChangeText={(v) => setForm((f) => ({ ...f, vehicle_reg: v }))}
              />
              <TextInput
                className="mb-1 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="VIN"
                value={form.vehicle_vin}
                onChangeText={(v) => setForm((f) => ({ ...f, vehicle_vin: v }))}
              />
              <View className="mb-2 flex-row gap-2">
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  placeholder="Make"
                  value={form.vehicle_make}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, vehicle_make: v }))
                  }
                />
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  placeholder="Model"
                  value={form.vehicle_model}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, vehicle_model: v }))
                  }
                />
              </View>
              <WorkshopFieldLabel>Planned date</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="YYYY-MM-DD"
                value={form.planned_date}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, planned_date: v }))
                }
              />
              <WorkshopFieldLabel>Completed at (optional)</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                placeholder="YYYY-MM-DD HH:mm"
                value={form.date_time_out}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, date_time_out: v }))
                }
              />
              <WorkshopFieldLabel>Labor / Parts / VAT %</WorkshopFieldLabel>
              <View className="mb-2 flex-row gap-2">
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  keyboardType="decimal-pad"
                  value={form.labor_estimate}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, labor_estimate: v }))
                  }
                />
                <TextInput
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-2"
                  keyboardType="decimal-pad"
                  value={form.parts_estimate}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, parts_estimate: v }))
                  }
                />
                <TextInput
                  className="w-16 rounded-lg border border-slate-200 px-2 py-2"
                  keyboardType="decimal-pad"
                  value={form.vat_rate_percent}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, vat_rate_percent: v }))
                  }
                />
              </View>
              <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
              <TextInput
                className="mb-4 rounded-lg border border-slate-200 px-3 py-2"
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
              />
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
