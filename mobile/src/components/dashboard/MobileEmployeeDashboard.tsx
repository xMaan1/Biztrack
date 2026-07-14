import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../layout/MenuHeaderButton';
import { getEmployeePortalDashboard } from '../../services/employeePortal/employeePortalMobileApi';
import type { EmployeePortalDashboard } from '../../models/employeePortal';
import { startTimeSession, stopTimeSession } from '../../services/employeePortal/employeePortalMobileApi';
import { extractErrorMessage } from '../../utils/errorUtils';
import { appAlert } from '../../utils/appDialog';

interface MobileEmployeeDashboardProps {
  onLogout: () => void;
  userLabel?: string;
  onNavigatePath?: (path: string) => void | Promise<void>;
}

function formatElapsed(startIso?: string | null): string {
  if (!startIso) return '00:00:00';
  const start = new Date(startIso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function MobileEmployeeDashboard({
  onLogout,
  userLabel,
  onNavigatePath,
}: MobileEmployeeDashboardProps) {
  const [data, setData] = useState<EmployeePortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clockBusy, setClockBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const d = await getEmployeePortalDashboard();
      setData(d);
    } catch (e) {
      appAlert('Employee', extractErrorMessage(e, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data?.activeSession?.isActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [data?.activeSession?.isActive]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleClock = async () => {
    if (!data) return;
    setClockBusy(true);
    try {
      if (data.activeSession?.isActive && data.activeSession.id) {
        await stopTimeSession(data.activeSession.id);
      } else {
        await startTimeSession();
      }
      await load();
    } catch (e) {
      appAlert('Time', extractErrorMessage(e, 'Clock action failed'));
    } finally {
      setClockBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const stats = data?.stats;
  const employee = data?.employee;
  const firstName = employee?.firstName || 'there';
  const clockedIn = Boolean(data?.activeSession?.isActive);
  void tick;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-10 pt-2"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-start justify-between">
          <View className="min-w-0 flex-1 flex-row items-start gap-2 pr-2">
            <MenuHeaderButton />
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-bold text-indigo-700">
                Good day, {firstName}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                Your work overview
              </Text>
              {userLabel ? (
                <Text className="mt-1 text-xs text-slate-500">{userLabel}</Text>
              ) : null}
            </View>
          </View>
          <Pressable
            className="rounded-lg border border-slate-200 px-3 py-2 active:bg-slate-100"
            onPress={() => void onLogout()}
          >
            <Text className="text-sm font-medium text-slate-700">Sign out</Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3 px-4">
        {[
          {
            label: 'Tasks',
            value: stats?.openTasks ?? 0,
            sub: `${stats?.tasksDueToday ?? 0} due today`,
            border: 'border-l-indigo-500',
            text: 'text-indigo-700',
            icon: 'checkbox-outline' as const,
            path: '/employee-portal/tasks',
          },
          {
            label: 'Hours',
            value: `${stats?.hoursToday ?? 0}h`,
            sub: 'Today',
            border: 'border-l-violet-500',
            text: 'text-violet-600',
            icon: 'time-outline' as const,
            path: '/employee-portal/time',
          },
          {
            label: 'Leave',
            value: stats?.leaveBalance ?? 0,
            sub: 'Days balance',
            border: 'border-l-emerald-500',
            text: 'text-emerald-600',
            icon: 'calendar-outline' as const,
            path: '/employee-portal/leave',
          },
          {
            label: 'Devices',
            value: stats?.devicesCount ?? 0,
            sub: 'Assigned',
            border: 'border-l-purple-500',
            text: 'text-purple-600',
            icon: 'laptop-outline' as const,
            path: '/employee-portal/devices',
          },
        ].map((card) => (
          <Pressable
            key={card.path}
            className={`min-w-[45%] flex-1 rounded-xl border-l-4 ${card.border} bg-white p-4 shadow-sm active:opacity-90`}
            onPress={() => void onNavigatePath?.(card.path)}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium text-slate-600">{card.label}</Text>
              <Ionicons name={card.icon} size={16} color="#4f46e5" />
            </View>
            <Text className={`mt-2 text-xl font-bold ${card.text}`}>{card.value}</Text>
            <Text className="text-xs text-slate-500">{card.sub}</Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-4 px-4">
        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="timer-outline" size={20} color="#4f46e5" />
              <Text className="text-base font-semibold text-slate-900">Clock</Text>
            </View>
            <Text className="text-sm font-semibold text-violet-600">
              Today {stats?.hoursToday ?? 0}h
            </Text>
          </View>
          <Text className="mt-3 text-center font-mono text-2xl font-bold text-slate-900">
            {clockedIn ? formatElapsed(data?.activeSession?.startTime) : '00:00:00'}
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            {clockedIn ? 'Currently working' : 'Tap Clock in to start your day'}
          </Text>
          {clockedIn && data?.activeSession?.description ? (
            <Text className="mt-2 text-center text-sm font-medium text-slate-700" numberOfLines={2}>
              {data.activeSession.description}
            </Text>
          ) : null}
          <Pressable
            className={`mt-4 items-center rounded-lg py-3 ${clockedIn ? 'bg-red-600 active:bg-red-700' : 'bg-emerald-600 active:bg-emerald-700'}`}
            disabled={clockBusy}
            onPress={() => void toggleClock()}
          >
            <Text className="font-semibold text-white">
              {clockBusy
                ? clockedIn
                  ? 'Clocking out…'
                  : 'Clocking in…'
                : clockedIn
                  ? 'Clock out'
                  : 'Clock in'}
            </Text>
          </Pressable>
          <Pressable
            className="mt-3 items-center py-2"
            onPress={() => void onNavigatePath?.('/employee-portal/time')}
          >
            <Text className="text-sm font-semibold text-indigo-600">View time history</Text>
          </Pressable>
        </View>
      </View>

      {(data?.isManager && (data.teamTimeToday?.length ?? 0) > 0) ? (
        <View className="mt-4 px-4">
          <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Text className="text-base font-semibold text-slate-900">Team hours today</Text>
            {(data.teamTimeToday ?? []).map((row) => (
              <View
                key={row.employeeId}
                className="mt-3 flex-row items-center justify-between border-b border-slate-100 pb-2"
              >
                <Text className="text-sm font-medium text-slate-800">{row.name}</Text>
                <Text className="text-sm font-semibold text-violet-600">
                  {(row.hoursToday ?? 0).toFixed(1)}h
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="mt-4 gap-4 px-4">
        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkbox-outline" size={20} color="#4f46e5" />
              <Text className="text-base font-semibold text-slate-900">Today&apos;s tasks</Text>
            </View>
            <Pressable onPress={() => void onNavigatePath?.('/employee-portal/tasks')}>
              <Text className="text-sm font-semibold text-indigo-600">View all</Text>
            </Pressable>
          </View>
          {(data?.todayTasks ?? []).length === 0 ? (
            <Text className="mt-4 text-center text-sm text-slate-500">No open tasks</Text>
          ) : (
            (data?.todayTasks ?? []).map((task) => (
              <Pressable
                key={task.id}
                className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 active:bg-slate-100"
                onPress={() => void onNavigatePath?.('/employee-portal/tasks')}
              >
                <Text className="font-medium text-slate-900">{task.title}</Text>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-xs capitalize text-slate-500">{task.status}</Text>
                  {task.dueDate ? (
                    <Text className="text-xs text-indigo-600">
                      Due {task.dueDate.slice(0, 10)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Text className="text-base font-semibold text-slate-900">Quick actions</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {[
              { path: '/employee-portal/leave', label: 'Request leave', icon: 'calendar-outline' as const },
              { path: '/employee-portal/tasks', label: 'Log task', icon: 'add-circle-outline' as const },
              { path: '/employee-portal/profile', label: 'My profile', icon: 'person-outline' as const },
              { path: '/employee-portal/devices', label: 'My devices', icon: 'laptop-outline' as const },
            ].map((action) => (
              <Pressable
                key={action.path}
                className="min-w-[45%] flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 py-4 active:bg-slate-100"
                onPress={() => void onNavigatePath?.(action.path)}
              >
                <Ionicons name={action.icon} size={22} color="#4f46e5" />
                <Text className="mt-2 text-sm font-medium text-slate-700">{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
