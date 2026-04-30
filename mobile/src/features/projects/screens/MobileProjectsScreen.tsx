import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { MobileFormSheet } from '../../../components/layout/MobileForm';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../contexts/AuthContext';
import type { ProjectRecord, ProjectTeamMemberRef } from '../../../models/project';
import { AppModal } from '../../../components/layout/AppModal';
import {
  createProjectApi,
  deleteProjectApi,
  fetchProjectsPaged,
  fetchProjectTeamMembers,
  updateProjectApi,
} from '../../../services/projects/projectMobileApi';

const PAGE_SIZE = 15;

const PROJECT_STATUSES = [
  'planning',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
] as const;

const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ');
}

export function MobileProjectsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageProjects } = usePermissions();
  const { user } = useAuth();

  const [items, setItems] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [teamPool, setTeamPool] = useState<ProjectTeamMemberRef[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ProjectRecord | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState('');
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [statusPick, setStatusPick] = useState<string>('planning');
  const [priorityPick, setPriorityPick] = useState<string>('medium');
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetchProjectTeamMembers();
      setTeamPool(res.teamMembers ?? []);
    } catch {
      setTeamPool([]);
    }
  }, []);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProjectsPaged(page, PAGE_SIZE, {
        search: search.trim() || undefined,
      });
      setItems(res.projects ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
    } catch (e) {
      Alert.alert('Projects', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/projects',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTeam(), loadPage()]);
    setRefreshing(false);
  }, [loadPage, loadTeam]);

  const openCreate = useCallback(() => {
    setName('');
    setDescription('');
    const selfId = user?.id;
    const defaultManager =
      selfId && teamPool.some((m) => m.id === selfId)
        ? selfId
        : teamPool[0]?.id ?? '';
    setManagerId(defaultManager);
    setMemberIds(new Set());
    setStatusPick('planning');
    setPriorityPick('medium');
    setCreateOpen(true);
  }, [teamPool, user?.id]);

  const openEdit = useCallback((p: ProjectRecord) => {
    setSelected(p);
    setName(p.name);
    setDescription(p.description ?? '');
    setManagerId(p.projectManagerId);
    setMemberIds(new Set((p.teamMembers ?? []).map((m) => m.id)));
    setStatusPick(p.status);
    setPriorityPick(p.priority);
    setEditOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    if (!name.trim() || !managerId) {
      Alert.alert('Projects', 'Name and project manager are required.');
      return;
    }
    try {
      await createProjectApi({
        name: name.trim(),
        description: description.trim() || undefined,
        status: statusPick,
        priority: priorityPick,
        projectManagerId: managerId,
        teamMemberIds: Array.from(memberIds),
      });
      setCreateOpen(false);
      setPage(1);
      await loadPage();
    } catch (e) {
      Alert.alert('Projects', extractErrorMessage(e, 'Could not create'));
    }
  }, [name, description, managerId, memberIds, statusPick, priorityPick, loadPage]);

  const submitEdit = useCallback(async () => {
    if (!selected || !name.trim() || !managerId) {
      return;
    }
    try {
      await updateProjectApi(selected.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        status: statusPick,
        priority: priorityPick,
        projectManagerId: managerId,
        teamMemberIds: Array.from(memberIds),
      });
      setEditOpen(false);
      setSelected(null);
      await loadPage();
    } catch (e) {
      Alert.alert('Projects', extractErrorMessage(e, 'Could not update'));
    }
  }, [selected, name, description, managerId, memberIds, statusPick, priorityPick, loadPage]);

  const confirmDelete = useCallback(
    (p: ProjectRecord) => {
      Alert.alert(
        'Delete project',
        `Remove "${p.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await deleteProjectApi(p.id);
                  setDetailOpen(false);
                  await loadPage();
                } catch (e) {
                  Alert.alert(
                    'Projects',
                    extractErrorMessage(e, 'Could not delete'),
                  );
                }
              })();
            },
          },
        ],
        { cancelable: true },
      );
    },
    [loadPage],
  );

  const managerOptions = useMemo(
    () => teamPool.map((m) => ({ value: m.id, label: m.name })),
    [teamPool],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProjectRecord }) => (
      <Pressable
        className="border-b border-slate-100 bg-white px-4 py-3 active:bg-slate-50"
        onPress={() => {
          setSelected(item);
          setDetailOpen(true);
        }}
      >
        <Text className="text-base font-semibold text-slate-900">{item.name}</Text>
        <Text className="mt-1 text-sm text-slate-600">
          {statusLabel(item.status)} · {statusLabel(item.priority)} ·{' '}
          {item.completionPercent}%
        </Text>
      </Pressable>
    ),
    [],
  );

  const formFields = (
    <>
      <Text className="mb-1 text-xs font-medium text-slate-500">Name</Text>
      <TextInput
        className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
        value={name}
        onChangeText={setName}
        placeholder="Project name"
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Description</Text>
      <TextInput
        className="mb-3 min-h-[72px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
        value={description}
        onChangeText={setDescription}
        placeholder="Optional"
        multiline
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Status</Text>
      <Pressable
        className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
        onPress={() => setStatusOpen(true)}
      >
        <Text className="text-slate-900">{statusLabel(statusPick)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Priority</Text>
      <Pressable
        className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
        onPress={() => setPriorityOpen(true)}
      >
        <Text className="text-slate-900">{statusLabel(priorityPick)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Project manager</Text>
      <Pressable
        className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
        onPress={() => setManagerOpen(true)}
      >
        <Text className="text-slate-900">
          {teamPool.find((m) => m.id === managerId)?.name ?? 'Select'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Team members</Text>
      <View className="mb-2 rounded-lg border border-slate-200 bg-white">
        {teamPool.length === 0 ? (
          <Text className="px-3 py-2 text-sm text-slate-500">No users available</Text>
        ) : (
          teamPool.map((m) => {
            const on = memberIds.has(m.id);
            return (
              <Pressable
                key={m.id}
                className="flex-row items-center border-b border-slate-100 px-3 py-2 last:border-b-0"
                onPress={() => {
                  setMemberIds((prev) => {
                    const n = new Set(prev);
                    if (n.has(m.id)) n.delete(m.id);
                    else n.add(m.id);
                    return n;
                  });
                }}
              >
                <Ionicons
                  name={on ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={on ? '#2563eb' : '#94a3b8'}
                />
                <Text className="ml-2 flex-1 text-slate-900">{m.name}</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Projects
        </Text>
        {canManageProjects() ? (
          <Pressable className="px-2 py-1" onPress={openCreate}>
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <View className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-2">
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            className="flex-1 py-2 pl-2 text-slate-900"
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => {
              setPage(1);
            }}
            returnKeyType="search"
          />
        </View>
      </View>

      {loading && items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No projects</Text>
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

      <AppModal visible={detailOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[85%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Project</Text>
            <ScrollView className="mt-3">
              {selected ? (
                <>
                  <Text className="text-xl font-bold text-slate-900">
                    {selected.name}
                  </Text>
                  <Text className="mt-2 text-slate-600">
                    {selected.description || '—'}
                  </Text>
                  <Text className="mt-3 text-sm text-slate-700">
                    {statusLabel(selected.status)} · {statusLabel(selected.priority)}
                  </Text>
                  <Text className="mt-1 text-sm text-slate-700">
                    Progress {selected.completionPercent}% · Manager{' '}
                    {selected.projectManager?.name ?? '—'}
                  </Text>
                </>
              ) : null}
            </ScrollView>
            <View className="mt-4 flex-row gap-2">
              {canManageProjects() && selected ? (
                <>
                  <Pressable
                    className="flex-1 items-center rounded-lg border border-slate-200 py-3"
                    onPress={() => {
                      setDetailOpen(false);
                      openEdit(selected);
                    }}
                  >
                    <Text className="font-semibold text-slate-800">Edit</Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 items-center rounded-lg bg-red-600 py-3"
                    onPress={() => selected && confirmDelete(selected)}
                  >
                    <Text className="font-semibold text-white">Delete</Text>
                  </Pressable>
                </>
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

      <MobileFormSheet
        visible={createOpen}
        title="New project"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
        saveLabel="Create"
      >
        {formFields}
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit project"
        onCancel={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        onSave={() => void submitEdit()}
      >
        {formFields}
      </MobileFormSheet>

      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={PROJECT_STATUSES.map((s) => ({
          value: s,
          label: statusLabel(s),
        }))}
        onSelect={(v) => {
          setStatusPick(v);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />
      <OptionSheet
        visible={priorityOpen}
        title="Priority"
        options={PROJECT_PRIORITIES.map((s) => ({
          value: s,
          label: statusLabel(s),
        }))}
        onSelect={(v) => {
          setPriorityPick(v);
          setPriorityOpen(false);
        }}
        onClose={() => setPriorityOpen(false)}
      />
      <OptionSheet
        visible={managerOpen}
        title="Project manager"
        options={managerOptions}
        onSelect={(v) => {
          setManagerId(v);
          setManagerOpen(false);
        }}
        onClose={() => setManagerOpen(false)}
      />
    </View>
  );
}
