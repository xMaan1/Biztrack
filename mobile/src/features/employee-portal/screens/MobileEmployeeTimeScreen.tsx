import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  getPortalTimeEntries,
  getCurrentTimeSession,
  startTimeSession,
  stopTimeSession,
} from '../../../services/employeePortal/employeePortalMobileApi';
import type { ProjectTimeEntry } from '../../../models/project/pmApiTypes';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopPrimaryButton,
  WorkshopEmptyState,
  WS,
} from '../../workshop/components/WorkshopChrome';

function formatElapsed(startIso?: string | null): string {
  if (!startIso) return '00:00:00';
  const start = new Date(startIso).getTime();
  const sec = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function MobileEmployeeTimeScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [entries, setEntries] = useState<ProjectTimeEntry[]>([]);
  const [session, setSession] = useState<{ id: string; startTime?: string; isActive: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const [te, sess] = await Promise.all([
        getPortalTimeEntries({ start_date: today, end_date: today }),
        getCurrentTimeSession(),
      ]);
      setEntries(te.timeEntries ?? []);
      setSession(sess.session);
    } catch (e) {
      appError('Time', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/time');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!session?.isActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session?.isActive]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggle = async () => {
    setBusy(true);
    try {
      if (session?.isActive && session.id) {
        await stopTimeSession(session.id);
      } else {
        await startTimeSession();
      }
      await load();
    } catch (e) {
      appAlert('Time', extractErrorMessage(e, 'Action failed'));
    } finally {
      setBusy(false);
    }
  };

  void tick;
  const clockedIn = Boolean(session?.isActive);
  const totalHours = entries.reduce((sum, e) => sum + (e.totalHours ?? 0), 0);

  if (loading && entries.length === 0 && !session) return <WorkshopLoading />;

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <WorkshopChrome title="Time tracking" subtitle="Clock in and view entries" scroll={false}>
        <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <Text className="text-center font-mono text-3xl font-bold text-slate-900">
            {clockedIn ? formatElapsed(session?.startTime) : '00:00:00'}
          </Text>
          <Text className="mt-1 text-center text-sm text-slate-500">
            {clockedIn ? 'Clocked in' : 'Not clocked in'}
          </Text>
          <WorkshopPrimaryButton
            label={busy ? '...' : clockedIn ? 'Clock out' : 'Clock in'}
            onPress={() => void toggle()}
            disabled={busy}
          />
          <Text className="mt-3 text-center text-sm text-slate-600">
            Today total: {totalHours.toFixed(1)}h
          </Text>
        </View>
        <Text className="mb-2 text-sm font-semibold text-slate-700">Today&apos;s entries</Text>
        <FlatList
          style={{ flex: 1 }}
          data={entries}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState icon="time-outline" title="No entries today" subtitle="Clock in to start tracking." />
          }
          renderItem={({ item }) => (
            <View className="mb-2 rounded-lg border border-slate-200 bg-white p-3">
              <Text className="text-sm font-medium text-slate-900">
                {item.clockIn?.slice(11, 16) ?? '—'} – {item.clockOut?.slice(11, 16) ?? 'active'}
              </Text>
              <Text className="text-xs text-slate-500">
                {(item.totalHours ?? 0).toFixed(1)}h · {item.status}
              </Text>
            </View>
          )}
        />
      </WorkshopChrome>
    </View>
  );
}
