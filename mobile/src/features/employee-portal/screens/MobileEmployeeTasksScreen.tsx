import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  getPortalTasks,
  createPortalTask,
  logPortalTask,
  completePortalTask,
} from '../../../services/employeePortal/employeePortalMobileApi';
import type { SubTaskRecord } from '../../../models/project/pmApiTypes';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopFAB,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopChipSelect,
  WorkshopPrimaryButton,
  WorkshopBadge,
  WorkshopEmptyState,
  WS,
} from '../../workshop/components/WorkshopChrome';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export function MobileEmployeeTasksScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [tasks, setTasks] = useState<SubTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [selected, setSelected] = useState<SubTaskRecord | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [logHours, setLogHours] = useState('1');
  const [logNotes, setLogNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPortalTasks();
      setTasks(res.tasks ?? []);
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/tasks');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const create = async () => {
    if (!title.trim()) {
      appAlert('Tasks', 'Title is required');
      return;
    }
    setSaving(true);
    try {
      await createPortalTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        priority,
      });
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      await load();
      appAlert('Tasks', 'Task created');
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const log = async () => {
    if (!selected) return;
    const h = parseFloat(logHours);
    if (!Number.isFinite(h) || h <= 0) {
      appAlert('Tasks', 'Enter valid hours');
      return;
    }
    setSaving(true);
    try {
      await logPortalTask(selected.id, {
        hours: h,
        notes: logNotes.trim() || undefined,
        status: 'in_progress',
      });
      setLogOpen(false);
      setLogNotes('');
      await load();
      appAlert('Tasks', 'Time logged');
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Failed to log'));
    } finally {
      setSaving(false);
    }
  };

  const complete = (task: SubTaskRecord) => {
    appConfirm({
      title: 'Tasks',
      message: `Mark "${task.title}" as done?`,
      confirmLabel: 'Done',
      onConfirm: async () => {
        try {
          await completePortalTask(task.id);
          await load();
        } catch (e) {
          appError('Tasks', extractErrorMessage(e, 'Failed to complete'));
        }
      },
    });
  };

  if (loading && tasks.length === 0) return <WorkshopLoading />;

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <WorkshopChrome title="My tasks" subtitle="Assigned tasks and logs" scroll={false}>
        <FlatList
          style={{ flex: 1 }}
          data={tasks}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={WS.primary} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="checkbox-outline"
              title="No tasks"
              subtitle="Create or wait for assigned tasks."
              actionLabel="Create task"
              onAction={() => setCreateOpen(true)}
            />
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 font-semibold text-slate-900">{item.title}</Text>
                <WorkshopBadge label={item.status} />
              </View>
              {item.dueDate ? (
                <Text className="mt-1 text-xs text-indigo-600">Due {item.dueDate.slice(0, 10)}</Text>
              ) : null}
              <Text className="mt-1 text-xs capitalize text-slate-500">{item.priority} priority</Text>
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  className="flex-1 items-center rounded-lg border border-indigo-600 py-2"
                  onPress={() => {
                    setSelected(item);
                    setLogOpen(true);
                  }}
                >
                  <Text className="text-sm font-semibold text-indigo-700">Log time</Text>
                </Pressable>
                {item.status !== 'completed' ? (
                  <Pressable
                    className="flex-1 items-center rounded-lg bg-indigo-600 py-2"
                    onPress={() => complete(item)}
                  >
                    <Text className="text-sm font-semibold text-white">Done</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
        />
      </WorkshopChrome>
      <WorkshopFAB onPress={() => setCreateOpen(true)} />
      <WorkshopFormSheet
        visible={createOpen}
        title="Create task"
        onClose={() => setCreateOpen(false)}
        footer={
          <WorkshopPrimaryButton
            label={saving ? 'Creating...' : 'Create task'}
            onPress={() => void create()}
            disabled={saving}
          />
        }
      >
        <WorkshopFieldLabel>Title</WorkshopFieldLabel>
        <WorkshopTextInput value={title} onChangeText={setTitle} />
        <WorkshopFieldLabel>Description</WorkshopFieldLabel>
        <WorkshopTextInput value={description} onChangeText={setDescription} multiline />
        <WorkshopDatePickerField label="Due date" value={dueDate} onChange={setDueDate} />
        <WorkshopChipSelect label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
      </WorkshopFormSheet>
      <WorkshopFormSheet
        visible={logOpen}
        title="Log time"
        onClose={() => setLogOpen(false)}
        footer={
          <WorkshopPrimaryButton
            label={saving ? 'Saving...' : 'Log time'}
            onPress={() => void log()}
            disabled={saving}
          />
        }
      >
        <Text className="mb-3 text-sm text-slate-600">{selected?.title}</Text>
        <WorkshopFieldLabel>Hours</WorkshopFieldLabel>
        <WorkshopTextInput value={logHours} onChangeText={setLogHours} keyboardType="decimal-pad" />
        <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
        <WorkshopTextInput value={logNotes} onChangeText={setLogNotes} multiline />
      </WorkshopFormSheet>
    </View>
  );
}
