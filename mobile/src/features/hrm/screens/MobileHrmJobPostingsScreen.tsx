import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { getJobPostings, deleteJobPosting, createJobPosting, updateJobPosting } from '../../../services/hrm/hrmMobileApi';
import type { JobPosting, JobPostingCreate, JobPostingUpdate } from '../../../models/hrm';
import { Department, EmployeeType, JobStatus } from '../../../models/hrm';
import { AppModal } from '../../../components/layout/AppModal';

const DEPARTMENTS = Object.values(Department);
const EMPLOYEE_TYPES = Object.values(EmployeeType);
const JOB_STATUSES = Object.values(JobStatus);

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

function buildEmptyForm() {
  return {
    title: '',
    department: Department.GENERAL,
    description: '',
    location: '',
    type: EmployeeType.FULL_TIME,
    salaryRange: '',
    status: JobStatus.DRAFT,
    openDate: todayIsoDate(),
    closeDate: '',
  };
}

export function MobileHrmJobPostingsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<JobPosting | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<JobPosting | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(buildEmptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getJobPostings(1, 100, q.trim() ? { search: q.trim() } : undefined);
      setRows(res.jobPostings ?? []);
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/job-postings',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    const t = setTimeout(() => void load(), q.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const remove = (j: JobPosting) => {
    Alert.alert('Delete job', j.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteJobPosting(j.id);
              setDetail(null);
              await load();
            } catch (err) {
              Alert.alert('HRM', extractErrorMessage(err, 'Failed to delete'));
            }
          })(),
      },
    ]);
  };

  const cycleOption = <T extends string>(list: readonly T[], current: T): T => {
    const index = list.indexOf(current);
    if (index < 0) return list[0] as T;
    return list[(index + 1) % list.length] as T;
  };

  const openCreate = () => {
    setForm(buildEmptyForm());
    setCreateOpen(true);
  };

  const openEdit = (job: JobPosting) => {
    setSelected(job);
    setForm({
      title: job.title,
      department: job.department,
      description: job.description,
      location: job.location,
      type: job.type,
      salaryRange: job.salaryRange || '',
      status: job.status,
      openDate: job.openDate ? job.openDate.split('T')[0] || job.openDate : todayIsoDate(),
      closeDate: job.closeDate ? job.closeDate.split('T')[0] || job.closeDate : '',
    });
    setEditOpen(true);
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      Alert.alert('HRM', 'Title, description, and location are required.');
      return false;
    }
    if (!form.openDate.trim()) {
      Alert.alert('HRM', 'Open date is required.');
      return false;
    }
    return true;
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload: JobPostingCreate = {
        title: form.title.trim(),
        department: form.department,
        description: form.description.trim(),
        location: form.location.trim(),
        type: form.type,
        salaryRange: form.salaryRange.trim() || undefined,
        status: form.status,
        openDate: form.openDate.trim(),
        closeDate: form.closeDate.trim() || undefined,
      };
      await createJobPosting(payload);
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
      const payload: JobPostingUpdate = {
        title: form.title.trim(),
        department: form.department,
        description: form.description.trim(),
        location: form.location.trim(),
        type: form.type,
        salaryRange: form.salaryRange.trim() || undefined,
        status: form.status,
        openDate: form.openDate.trim(),
        closeDate: form.closeDate.trim() || undefined,
      };
      await updateJobPosting(selected.id, payload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Job postings
        </Text>
        {canManageHRM() ? (
          <Pressable onPress={openCreate} className="px-2 py-1">
            <Text className="font-semibold text-blue-600">New</Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>
      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search…"
          placeholderTextColor="#475569"
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        />
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
            <Text className="py-8 text-center text-slate-500">No job postings</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">{item.title}</Text>
              <Text className="text-xs text-slate-500">
                {String(item.department)} · {String(item.status)}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">{item.location}</Text>
            </Pressable>
          )}
        />
      )}

      <AppModal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[88%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Job</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-bold text-slate-900">{detail.title}</Text>
                <Text className="mt-2 text-slate-700">{detail.description}</Text>
                <Text className="mt-3 text-sm text-slate-600">
                  {String(detail.type)} · {detail.location}
                </Text>
                {detail.salaryRange ? (
                  <Text className="mt-2 text-slate-800">{detail.salaryRange}</Text>
                ) : null}
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row gap-2">
              {detail && canManageHRM() ? (
                <Pressable onPress={() => openEdit(detail)} className="flex-1 items-center rounded-lg bg-blue-600 py-3">
                  <Text className="font-semibold text-white">Edit</Text>
                </Pressable>
              ) : null}
              {detail && canManageHRM() ? (
                <Pressable
                  onPress={() => remove(detail)}
                  className="flex-1 items-center rounded-lg bg-red-600 py-3"
                >
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
            <Text className="text-lg font-semibold text-slate-900">New job posting</Text>
            <ScrollView keyboardShouldPersistTaps="handled" className="mt-3 max-h-[76%]">
              <View className="gap-3">
                <TextInput value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} placeholder="Title" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Description" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
                <TextInput value={form.location} onChangeText={(v) => setForm((p) => ({ ...p, location: v }))} placeholder="Location" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.salaryRange} onChangeText={(v) => setForm((p) => ({ ...p, salaryRange: v }))} placeholder="Salary range" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.openDate} onChangeText={(v) => setForm((p) => ({ ...p, openDate: v }))} placeholder="Open date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.closeDate} onChangeText={(v) => setForm((p) => ({ ...p, closeDate: v }))} placeholder="Close date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <Pressable onPress={() => setForm((p) => ({ ...p, department: cycleOption(DEPARTMENTS, p.department) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Department: {form.department}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, type: cycleOption(EMPLOYEE_TYPES, p.type) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Type: {form.type}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, status: cycleOption(JOB_STATUSES, p.status) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Status: {form.status}</Text>
                </Pressable>
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
            <Text className="text-lg font-semibold text-slate-900">Edit job posting</Text>
            <ScrollView keyboardShouldPersistTaps="handled" className="mt-3 max-h-[76%]">
              <View className="gap-3">
                <TextInput value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} placeholder="Title" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="Description" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
                <TextInput value={form.location} onChangeText={(v) => setForm((p) => ({ ...p, location: v }))} placeholder="Location" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.salaryRange} onChangeText={(v) => setForm((p) => ({ ...p, salaryRange: v }))} placeholder="Salary range" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.openDate} onChangeText={(v) => setForm((p) => ({ ...p, openDate: v }))} placeholder="Open date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.closeDate} onChangeText={(v) => setForm((p) => ({ ...p, closeDate: v }))} placeholder="Close date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <Pressable onPress={() => setForm((p) => ({ ...p, department: cycleOption(DEPARTMENTS, p.department) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Department: {form.department}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, type: cycleOption(EMPLOYEE_TYPES, p.type) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Type: {form.type}</Text>
                </Pressable>
                <Pressable onPress={() => setForm((p) => ({ ...p, status: cycleOption(JOB_STATUSES, p.status) }))} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Status: {form.status}</Text>
                </Pressable>
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
