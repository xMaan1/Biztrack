import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getHrmDashboard } from '../../../services/hrm/hrmMobileApi';
import type { HRMDashboard } from '../../../models/hrm';

const LINKS: { path: string; label: string }[] = [
  { path: '/hrm/employees', label: 'Employees' },
  { path: '/hrm/job-postings', label: 'Job postings' },
  { path: '/hrm/performance-reviews', label: 'Performance reviews' },
  { path: '/hrm/leave-management', label: 'Leave' },
  { path: '/hrm/training', label: 'Training' },
  { path: '/hrm/payroll', label: 'Payroll' },
  { path: '/hrm/suppliers', label: 'Suppliers' },
];

export function MobileHrmDashboardScreen() {
  const { workspacePath, setSidebarActivePath, navigateMenuPath } =
    useSidebarDrawer();
  const [data, setData] = useState<HRMDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getHrmDashboard();
      setData(d);
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const m = data?.metrics;

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          HRM
        </Text>
        <View className="w-10" />
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-3 py-3"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {m ? (
            <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-lg font-semibold text-slate-900">Overview</Text>
              <Text className="mt-2 text-slate-700">
                Employees {m.totalEmployees} · Active {m.activeEmployees}
              </Text>
              <Text className="mt-1 text-slate-700">
                New hires (30d) {m.newHires} · Turnover {m.turnoverRate}%
              </Text>
              <Text className="mt-1 text-slate-700">
                Avg salary {formatUsd(m.averageSalary)}
              </Text>
              <Text className="mt-1 text-slate-700">
                Open jobs {m.openPositions} · Pending applications{' '}
                {m.pendingApplications}
              </Text>
              <Text className="mt-1 text-slate-700">
                Upcoming reviews {m.upcomingReviews} · Pending leave{' '}
                {m.pendingLeaveRequests}
              </Text>
              <Text className="mt-1 text-slate-700">
                Training completion {m.trainingCompletionRate}%
              </Text>
            </View>
          ) : null}

          <Text className="mb-2 font-semibold text-slate-800">Shortcuts</Text>
          <View className="flex-row flex-wrap gap-2">
            {LINKS.map((l) => (
              <Pressable
                key={l.path}
                onPress={() => void navigateMenuPath(l.path)}
                className="min-w-[46%] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-4 active:bg-slate-50"
              >
                <Text className="text-center font-medium text-slate-800">
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
