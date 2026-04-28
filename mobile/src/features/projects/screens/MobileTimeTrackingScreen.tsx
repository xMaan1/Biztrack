import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Employee } from '../../../models/hrm';
import type { ProjectRecord, ProjectTimeEntry, SubTaskRecord } from '../../../models/project';
import { getEmployees } from '../../../services/hrm/hrmMobileApi';
import { AppModal } from '../../../components/layout/AppModal';
import {
  createProjectTimeEntryApi,
  deleteProjectTimeEntryApi,
  fetchProjectTimeEntriesPaged,
  fetchProjectsPaged,
  fetchTasksPaged,
  updateProjectTimeEntryApi,
} from '../../../services/projects/projectMobileApi';

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildClockInIso(dateYmd: string, timeHm: string): string {
  const t = timeHm.trim();
  if (/^\d{2}:\d{2}$/.test(t)) {
    return `${dateYmd}T${t}:00`;
  }
  return t.length > 0 ? t : `${dateYmd}T09:00:00`;
}

export function MobileTimeTrackingScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageProjects } = usePermissions();

  const [entries, setEntries] = useState<ProjectTimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [tasks, setTasks] = useState<SubTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [empId, setEmpId] = useState('');
  const [dateStr, setDateStr] = useState(todayYmd);
  const [timeStr, setTimeStr] = useState('09:00');
  const [hoursStr, setHoursStr] = useState('1');
  const [projId, setProjId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');

  const [empOpen, setEmpOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const loadRefs = useCallback(async () => {
    try {
      const [em, pr] = await Promise.all([
        getEmployees(1, 200),
        fetchProjectsPaged(1, 200),
      ]);
      setEmployees(em.employees ?? []);
      setProjects(pr.projects ?? []);
      setEmpId((prev) => prev || em.employees?.[0]?.id || '');
    } catch {
      setEmployees([]);
      setProjects([]);
    }
  }, []);

  const selectedEmployeeLabel = useMemo(() => {
    const e = employees.find((x) => x.id === empId);
    if (!e) return 'Select';
    return `${e.firstName} ${e.lastName}`.trim() || e.email;
  }, [employees, empId]);

  const loadTasksForProject = useCallback(async (pid: string) => {
    if (!pid) {
      setTasks([]);
      return;
    }
    try {
      const res = await fetchTasksPaged(1, 100, {
        project: pid,
        main_tasks_only: true,
        include_subtasks: false,
      });
      setTasks(res.tasks ?? []);
    } catch {
      setTasks([]);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProjectTimeEntriesPaged(page, 25);
      setEntries(res.timeEntries ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
    } catch (e) {
      Alert.alert('Time tracking', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/time-tracking',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (projId) void loadTasksForProject(projId);
    else {
      setTasks([]);
      setTaskId('');
    }
  }, [projId, loadTasksForProject]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRefs(), loadEntries()]);
    setRefreshing(false);
  }, [loadRefs, loadEntries]);

  const openCreate = useCallback(() => {
    setEditingEntryId(null);
    setDateStr(todayYmd());
    setTimeStr('09:00');
    setHoursStr('1');
    setProjId('');
    setTaskId('');
    setNotes('');
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((entry: ProjectTimeEntry) => {
    setEditingEntryId(entry.id);
    setEmpId(entry.employeeId);
    setDateStr(entry.date || todayYmd());
    const clockIn = entry.clockIn || '';
    const time = clockIn.includes('T')
      ? clockIn.split('T')[1]?.slice(0, 5) || '09:00'
      : clockIn.slice(0, 5) || '09:00';
    setTimeStr(time);
    setHoursStr(String(entry.totalHours ?? 1));
    setProjId(entry.projectId ?? '');
    setTaskId(entry.taskId ?? '');
    setNotes(entry.notes ?? '');
    setCreateOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    if (!empId) {
      Alert.alert('Time tracking', 'Select an employee.');
      return;
    }
    const h = parseFloat(hoursStr.replace(',', '.'));
    if (Number.isNaN(h) || h <= 0) {
      Alert.alert('Time tracking', 'Enter valid hours.');
      return;
    }
    try {
      const payload = {
        employeeId: empId,
        date: dateStr,
        clockIn: buildClockInIso(dateStr, timeStr),
        totalHours: h,
        projectId: projId || undefined,
        taskId: taskId || undefined,
        notes: notes.trim() || undefined,
        status: 'active' as const,
      };
      if (editingEntryId) {
        await updateProjectTimeEntryApi(editingEntryId, payload);
      } else {
        await createProjectTimeEntryApi(payload);
      }
      setCreateOpen(false);
      setEditingEntryId(null);
      await loadEntries();
    } catch (e) {
      Alert.alert('Time tracking', extractErrorMessage(e, 'Could not save'));
    }
  }, [editingEntryId, empId, dateStr, timeStr, hoursStr, projId, taskId, notes, loadEntries]);

  const removeEntry = useCallback((entry: ProjectTimeEntry) => {
    Alert.alert('Delete entry', `Delete entry on ${entry.date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteProjectTimeEntryApi(entry.id);
              await loadEntries();
            } catch (e) {
              Alert.alert('Time tracking', extractErrorMessage(e, 'Could not delete'));
            }
          })();
        },
      },
    ]);
  }, [loadEntries]);

  const empOptions = useMemo(
    () => employees.map((e) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName}`.trim() || e.email,
    })),
    [employees],
  );

  const projOptions = useMemo(
    () => [{ value: '', label: 'No project' }, ...projects.map((p) => ({ value: p.id, label: p.name }))],
    [projects],
  );

  const taskOptions = useMemo(
    () => [{ value: '', label: 'No task' }, ...tasks.map((t) => ({ value: t.id, label: t.title }))],
    [tasks],
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Time tracking
        </Text>
        {canManageProjects() ? (
          <Pressable className="px-2 py-1" onPress={openCreate}>
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      {loading && entries.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View className="border-b border-slate-100 bg-white px-4 py-3">
              <Text className="text-sm text-slate-500">{item.date}</Text>
              <Text className="mt-1 text-base font-semibold text-slate-900">
                {item.totalHours != null ? `${item.totalHours} h` : '—'}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                {item.clockIn}
                {item.clockOut ? ` → ${item.clockOut}` : ''}
              </Text>
              {item.notes ? (
                <Text className="mt-2 text-sm text-slate-600">{item.notes}</Text>
              ) : null}
              {canManageProjects() ? (
                <View className="mt-2 flex-row gap-3">
                  <Pressable onPress={() => openEdit(item)}>
                    <Text className="font-medium text-blue-600">Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => removeEntry(item)}>
                    <Text className="font-medium text-red-600">Delete</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No time entries</Text>
          }
        />
      )}

      <View className="flex-row items-center justify-center border-t border-slate-200 bg-white py-2">
        <Pressable
          disabled={page <= 1}
          className="px-4 py-2"
          onPress={() => setPage((p) => Math.max(1, p - 1))}
        >
          <Text className={page <= 1 ? 'text-slate-300' : 'text-blue-600'}>Prev</Text>
        </Pressable>
        <Text className="text-slate-600">
          {page} / {totalPages}
        </Text>
        <Pressable
          disabled={page >= totalPages}
          className="px-4 py-2"
          onPress={() => setPage((p) => p + 1)}
        >
          <Text
            className={page >= totalPages ? 'text-slate-300' : 'text-blue-600'}
          >
            Next
          </Text>
        </Pressable>
      </View>

      <AppModal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-semibold text-slate-900">
              {editingEntryId ? 'Edit time entry' : 'Log time'}
            </Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              <Text className="mb-1 text-xs font-medium text-slate-500">Employee</Text>
              <Pressable
                className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                onPress={() => setEmpOpen(true)}
              >
                <Text className="text-slate-900">{selectedEmployeeLabel}</Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </Pressable>
              <Text className="mb-1 text-xs font-medium text-slate-500">Date</Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                value={dateStr}
                onChangeText={setDateStr}
                placeholder="YYYY-MM-DD"
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">Start time</Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                value={timeStr}
                onChangeText={setTimeStr}
                placeholder="HH:MM"
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">Hours</Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                value={hoursStr}
                onChangeText={setHoursStr}
                keyboardType="decimal-pad"
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">Project</Text>
              <Pressable
                className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                onPress={() => setProjOpen(true)}
              >
                <Text className="text-slate-900">
                  {projId ? projects.find((p) => p.id === projId)?.name : 'Optional'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </Pressable>
              <Text className="mb-1 text-xs font-medium text-slate-500">Task</Text>
              <Pressable
                className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                onPress={() => {
                  if (!projId) {
                    Alert.alert('Time tracking', 'Select a project first to attach a task.');
                    return;
                  }
                  setTaskOpen(true);
                }}
              >
                <Text className="text-slate-900">
                  {!projId ? 'Pick a project first' : taskId ? tasks.find((t) => t.id === taskId)?.title : 'Optional'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </Pressable>
              <Text className="mb-1 text-xs font-medium text-slate-500">Notes</Text>
              <TextInput
                className="mb-3 min-h-[64px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </ScrollView>
            <Pressable
              className="mt-2 items-center rounded-lg bg-blue-600 py-3"
              onPress={() => void submitCreate()}
            >
              <Text className="font-semibold text-white">
                {editingEntryId ? 'Save changes' : 'Save entry'}
              </Text>
            </Pressable>
            <Pressable
              className="mt-2 items-center py-2"
              onPress={() => {
                setCreateOpen(false);
                setEditingEntryId(null);
              }}
            >
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <OptionSheet
        visible={empOpen}
        title="Employee"
        options={empOptions}
        onSelect={(v) => {
          setEmpId(v);
          setEmpOpen(false);
        }}
        onClose={() => setEmpOpen(false)}
      />
      <OptionSheet
        visible={projOpen}
        title="Project"
        options={projOptions}
        onSelect={(v) => {
          setProjId(v);
          setTaskId('');
          setProjOpen(false);
        }}
        onClose={() => setProjOpen(false)}
      />
      <OptionSheet
        visible={taskOpen}
        title="Task"
        options={taskOptions}
        onSelect={(v) => {
          setTaskId(v);
          setTaskOpen(false);
        }}
        onClose={() => setTaskOpen(false)}
      />
    </View>
  );
}
