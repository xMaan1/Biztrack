import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { usePermissions } from '../../../hooks/usePermissions';
import type { ProjectRecord, SubTaskRecord } from '../../../models/project';
import { AppModal } from '../../../components/layout/AppModal';
import {
  createTaskApi,
  deleteTaskApi,
  fetchProjectsPaged,
  fetchProjectTeamMembers,
  fetchTasksPaged,
  updateTaskApi,
} from '../../../services/projects/projectMobileApi';

const TASK_STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'] as const;
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

function label(s: string): string {
  return s.replace(/_/g, ' ');
}

export function MobileTasksScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canCreateTasks, canUpdateTasks, canDeleteTasks } = usePermissions();

  const [tasks, setTasks] = useState<SubTaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [team, setTeam] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<SubTaskRecord | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignId, setAssignId] = useState<string>('');
  const [due, setDue] = useState('');
  const [statusPick, setStatusPick] = useState('todo');
  const [priorityPick, setPriorityPick] = useState('medium');
  const [statusPickOpen, setStatusPickOpen] = useState(false);
  const [priorityPickOpen, setPriorityPickOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [projectPickOpen, setProjectPickOpen] = useState(false);

  const loadRefs = useCallback(async () => {
    try {
      const [pr, tm] = await Promise.all([
        fetchProjectsPaged(1, 100),
        fetchProjectTeamMembers(),
      ]);
      setProjects(pr.projects ?? []);
      setTeam((tm.teamMembers ?? []).map((m) => ({ id: m.id, name: m.name })));
    } catch {
      setProjects([]);
      setTeam([]);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchTasksPaged(1, 100, {
        project: projectFilter === 'all' ? undefined : projectFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        main_tasks_only: true,
        include_subtasks: false,
      });
      setTasks(res.tasks ?? []);
    } catch (e) {
      Alert.alert('Tasks', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [projectFilter, statusFilter]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/tasks',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRefs(), loadTasks()]);
    setRefreshing(false);
  }, [loadRefs, loadTasks]);

  const openCreate = useCallback(() => {
    const first = projects[0]?.id ?? '';
    setTitle('');
    setDescription('');
    setProjectId(first);
    setAssignId('');
    setDue('');
    setStatusPick('todo');
    setPriorityPick('medium');
    setCreateOpen(true);
  }, [projects]);

  const openEdit = useCallback((t: SubTaskRecord) => {
    setSelected(t);
    setTitle(t.title);
    setDescription(t.description ?? '');
    setProjectId(t.projectId ?? '');
    setAssignId(t.assignedToId ?? '');
    setDue(t.dueDate ?? '');
    setStatusPick(t.status);
    setPriorityPick(t.priority);
    setEditOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    if (!title.trim() || !projectId) {
      Alert.alert('Tasks', 'Title and project are required.');
      return;
    }
    try {
      await createTaskApi({
        title: title.trim(),
        description: description.trim() || undefined,
        status: statusPick,
        priority: priorityPick,
        projectId,
        assignedToId: assignId || undefined,
        dueDate: due.trim() || undefined,
      });
      setCreateOpen(false);
      await loadTasks();
    } catch (e) {
      Alert.alert('Tasks', extractErrorMessage(e, 'Could not create'));
    }
  }, [title, description, projectId, assignId, due, statusPick, priorityPick, loadTasks]);

  const submitEdit = useCallback(async () => {
    if (!selected || !title.trim()) return;
    try {
      await updateTaskApi(selected.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status: statusPick,
        priority: priorityPick,
        assignedToId: assignId || undefined,
        dueDate: due.trim() || undefined,
      });
      setEditOpen(false);
      setSelected(null);
      await loadTasks();
    } catch (e) {
      Alert.alert('Tasks', extractErrorMessage(e, 'Could not update'));
    }
  }, [selected, title, description, assignId, due, statusPick, priorityPick, loadTasks]);

  const confirmDelete = useCallback(
    (t: SubTaskRecord) => {
      Alert.alert('Delete task', `Remove "${t.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteTaskApi(t.id);
                setDetailOpen(false);
                await loadTasks();
              } catch (e) {
                Alert.alert('Tasks', extractErrorMessage(e, 'Could not delete'));
              }
            })();
          },
        },
      ]);
    },
    [loadTasks],
  );

  const projectOptions = useMemo(
    () => [
      { value: 'all', label: 'All projects' },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects],
  );

  const projectFormOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects],
  );

  const assignOptions = useMemo(
    () => [{ value: '', label: 'Unassigned' }, ...team.map((m) => ({ value: m.id, label: m.name }))],
    [team],
  );

  const renderItem = useCallback(
    ({ item }: { item: SubTaskRecord }) => (
      <Pressable
        className="border-b border-slate-100 bg-white px-4 py-3 active:bg-slate-50"
        onPress={() => {
          setSelected(item);
          setDetailOpen(true);
        }}
      >
        <Text className="text-base font-semibold text-slate-900">{item.title}</Text>
        <Text className="mt-1 text-sm text-slate-600">
          {label(item.status)} · {label(item.priority)}
          {item.assignedTo?.name ? ` · ${item.assignedTo.name}` : ''}
        </Text>
      </Pressable>
    ),
    [],
  );

  const formBody = (
    <>
      <Text className="mb-1 text-xs font-medium text-slate-500">Title</Text>
      <TextInput
        className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
        value={title}
        onChangeText={setTitle}
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Description</Text>
      <TextInput
        className="mb-3 min-h-[64px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      {createOpen ? (
        <>
          <Text className="mb-1 text-xs font-medium text-slate-500">Project</Text>
          <Pressable
            className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setProjectPickOpen(true)}
          >
            <Text className="text-slate-900">
              {projects.find((p) => p.id === projectId)?.name ?? 'Select'}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#64748b" />
          </Pressable>
        </>
      ) : null}
      <Text className="mb-1 text-xs font-medium text-slate-500">Assignee</Text>
      <Pressable
        className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
        onPress={() => setAssignOpen(true)}
      >
        <Text className="text-slate-900">
          {assignId
            ? team.find((x) => x.id === assignId)?.name ?? '—'
            : 'Unassigned'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Due date</Text>
      <TextInput
        className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
        value={due}
        onChangeText={setDue}
        placeholder="YYYY-MM-DD"
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Status</Text>
      <Pressable
        className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
        onPress={() => setStatusPickOpen(true)}
      >
        <Text className="text-slate-900">{label(statusPick)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Priority</Text>
      <Pressable
        className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
        onPress={() => setPriorityPickOpen(true)}
      >
        <Text className="text-slate-900">{label(priorityPick)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
    </>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Tasks
        </Text>
        {canCreateTasks() ? (
          <Pressable className="px-2 py-1" onPress={openCreate}>
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      <View className="flex-row gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <Pressable
          className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
          onPress={() => setProjectSheetOpen(true)}
        >
          <Text className="flex-1 text-sm text-slate-900" numberOfLines={1}>
            {projectOptions.find((o) => o.value === projectFilter)?.label}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#64748b" />
        </Pressable>
        <Pressable
          className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
          onPress={() => setStatusSheetOpen(true)}
        >
          <Text className="flex-1 text-sm text-slate-900" numberOfLines={1}>
            {statusFilter === 'all' ? 'All statuses' : label(statusFilter)}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#64748b" />
        </Pressable>
      </View>

      {loading && tasks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(x) => x.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No tasks</Text>
          }
        />
      )}

      <AppModal visible={detailOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[85%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Task</Text>
            <ScrollView className="mt-3">
              {selected ? (
                <>
                  <Text className="text-xl font-bold text-slate-900">
                    {selected.title}
                  </Text>
                  <Text className="mt-2 text-slate-600">
                    {selected.description || '—'}
                  </Text>
                  <Text className="mt-3 text-sm text-slate-700">
                    {label(selected.status)} · {label(selected.priority)}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-700">
                    Assignee: {selected.assignedTo?.name ?? '—'}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-700">
                    Due: {selected.dueDate ?? '—'}
                  </Text>
                </>
              ) : null}
            </ScrollView>
            <View className="mt-4 flex-row gap-2">
              {canUpdateTasks() && selected ? (
                <Pressable
                  className="flex-1 items-center rounded-lg border border-slate-200 py-3"
                  onPress={() => {
                    setDetailOpen(false);
                    openEdit(selected);
                  }}
                >
                  <Text className="font-semibold text-slate-800">Edit</Text>
                </Pressable>
              ) : null}
              {canDeleteTasks() && selected ? (
                <Pressable
                  className="flex-1 items-center rounded-lg bg-red-600 py-3"
                  onPress={() => selected && confirmDelete(selected)}
                >
                  <Text className="font-semibold text-white">Delete</Text>
                </Pressable>
              ) : null}
              <Pressable
                className="flex-1 items-center rounded-lg bg-slate-200 py-3"
                onPress={() => setDetailOpen(false)}
              >
                <Text className="font-semibold text-slate-800">Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      <AppModal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-semibold text-slate-900">New task</Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              {formBody}
            </ScrollView>
            <Pressable
              className="mt-3 items-center rounded-lg bg-blue-600 py-3"
              onPress={() => void submitCreate()}
            >
              <Text className="font-semibold text-white">Create</Text>
            </Pressable>
            <Pressable
              className="mt-2 items-center py-2"
              onPress={() => setCreateOpen(false)}
            >
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <AppModal visible={editOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Edit task</Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              {formBody}
            </ScrollView>
            <Pressable
              className="mt-3 items-center rounded-lg bg-blue-600 py-3"
              onPress={() => void submitEdit()}
            >
              <Text className="font-semibold text-white">Save</Text>
            </Pressable>
            <Pressable
              className="mt-2 items-center py-2"
              onPress={() => {
                setEditOpen(false);
                setSelected(null);
              }}
            >
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <OptionSheet
        visible={projectSheetOpen}
        title="Project"
        options={projectOptions}
        onSelect={(v) => {
          setProjectFilter(v);
          setProjectSheetOpen(false);
        }}
        onClose={() => setProjectSheetOpen(false)}
      />
      <OptionSheet
        visible={statusSheetOpen}
        title="Status"
        options={[
          { value: 'all', label: 'All statuses' },
          ...TASK_STATUSES.map((s) => ({ value: s, label: label(s) })),
        ]}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusSheetOpen(false);
        }}
        onClose={() => setStatusSheetOpen(false)}
      />
      <OptionSheet
        visible={statusPickOpen}
        title="Status"
        options={TASK_STATUSES.map((s) => ({ value: s, label: label(s) }))}
        onSelect={(v) => {
          setStatusPick(v);
          setStatusPickOpen(false);
        }}
        onClose={() => setStatusPickOpen(false)}
      />
      <OptionSheet
        visible={priorityPickOpen}
        title="Priority"
        options={TASK_PRIORITIES.map((s) => ({ value: s, label: label(s) }))}
        onSelect={(v) => {
          setPriorityPick(v);
          setPriorityPickOpen(false);
        }}
        onClose={() => setPriorityPickOpen(false)}
      />
      <OptionSheet
        visible={assignOpen}
        title="Assignee"
        options={assignOptions}
        onSelect={(v) => {
          setAssignId(v);
          setAssignOpen(false);
        }}
        onClose={() => setAssignOpen(false)}
      />
      <OptionSheet
        visible={projectPickOpen}
        title="Project"
        options={projectFormOptions}
        onSelect={(v) => {
          setProjectId(v);
          setProjectPickOpen(false);
        }}
        onClose={() => setProjectPickOpen(false)}
      />
    </View>
  );
}
