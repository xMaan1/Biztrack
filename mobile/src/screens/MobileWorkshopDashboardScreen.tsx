import { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../components/layout/MenuHeaderButton';
import { useAuth } from '../contexts/AuthContext';
import { useSidebarDrawer } from '../contexts/SidebarDrawerContext';
import { useDashboard, type DashboardData } from '../hooks/useDashboard';
import { usePlanInfo } from '../hooks/usePlanInfo';

export interface WorkshopDashStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  workOrders: number;
  equipmentMaintenance: number;
  qualityIssues: number;
  productionEfficiency: number;
}

function buildWorkshopStats(data: DashboardData | null): WorkshopDashStats {
  if (!data) {
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalTeamMembers: 0,
      averageProgress: 0,
      workOrders: 0,
      equipmentMaintenance: 0,
      qualityIssues: 0,
      productionEfficiency: 0,
    };
  }
  const avgProgress =
    data.projects.recent.length > 0
      ? Math.round(
          data.projects.recent.reduce(
            (sum, p) => sum + p.completionPercent,
            0,
          ) / data.projects.recent.length,
        )
      : 0;
  const woTotal = data.workOrders.stats.total;
  const woDone = data.workOrders.stats.completed;
  return {
    totalProjects: data.projects.stats.total,
    activeProjects: data.projects.stats.active,
    completedProjects: data.projects.stats.completed,
    totalTeamMembers: data.users.total,
    averageProgress: avgProgress,
    workOrders: woTotal,
    equipmentMaintenance: data.workOrders.stats.draft,
    qualityIssues: data.workOrders.stats.in_progress,
    productionEfficiency:
      woTotal > 0 ? Math.round((woDone / woTotal) * 100) : 0,
  };
}

const quickLinks: { path: string; label: string }[] = [
  { path: '/workshop-management/work-orders', label: 'Work orders' },
  { path: '/workshop-management/job-cards', label: 'Job cards' },
  { path: '/workshop-management/vehicles', label: 'Vehicles' },
  { path: '/workshop-management/production', label: 'Production' },
  { path: '/workshop-management/quality-control', label: 'Quality' },
  { path: '/workshop-management/maintenance', label: 'Maintenance' },
  { path: '/projects', label: 'Projects' },
  { path: '/crm/customers', label: 'Customers' },
];

export function MobileWorkshopDashboardScreen() {
  const { logout, user, currentTenant } = useAuth();
  const { setSidebarActivePath, navigateMenuPath } = useSidebarDrawer();
  const { refreshPlanInfo } = usePlanInfo();
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch,
  } = useDashboard();

  const stats = useMemo(
    () => buildWorkshopStats(dashboardData),
    [dashboardData],
  );

  const completionRate =
    stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;

  useEffect(() => {
    setSidebarActivePath('/dashboard');
  }, [setSidebarActivePath]);

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshPlanInfo(), refetch()]);
  }, [refreshPlanInfo, refetch]);

  const userLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ? `${[user?.firstName, user?.lastName].filter(Boolean).join(' ')} · ${user?.email ?? ''}`
    : user?.email ?? '';

  if (dashboardLoading && !dashboardData) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row border-b border-indigo-100 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="mt-3 text-slate-600">Loading…</Text>
        </View>
      </View>
    );
  }

  if (dashboardError) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row border-b border-indigo-100 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 justify-center px-6">
          <Text className="text-center text-lg font-semibold text-slate-900">
            Dashboard error
          </Text>
          <Text className="mt-2 text-center text-slate-600">
            {dashboardError}
          </Text>
          <Pressable
            className="mt-6 items-center rounded-lg bg-indigo-600 py-3"
            onPress={() => void onRefresh()}
          >
            <Text className="font-semibold text-white">Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-12"
      refreshControl={
        <RefreshControl
          refreshing={dashboardLoading}
          onRefresh={() => void onRefresh()}
          tintColor="#4f46e5"
        />
      }
    >
      <View className="border-b border-indigo-100 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-1 items-start gap-2 pr-2">
            <MenuHeaderButton />
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <View className="rounded-lg bg-indigo-600 p-2">
                  <Ionicons name="construct" size={22} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-indigo-950">
                    Workshop
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Operations overview
                  </Text>
                </View>
              </View>
              {currentTenant ? (
                <Text className="mt-2 text-xs text-slate-500">
                  {currentTenant.name}
                  {userLabel ? ` · ${userLabel}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
          <Pressable
            className="rounded-lg border border-slate-200 px-3 py-2 active:bg-slate-100"
            onPress={() => void logout()}
          >
            <Text className="text-sm font-medium text-slate-700">Sign out</Text>
          </Pressable>
        </View>
        <View className="mt-3 flex-row gap-2">
          <Pressable
            className="flex-1 items-center rounded-lg bg-indigo-600 py-2.5 active:bg-indigo-700"
            onPress={() => void navigateMenuPath('/projects')}
          >
            <Text className="font-semibold text-white">New project</Text>
          </Pressable>
          <Pressable
            className="flex-1 items-center rounded-lg border border-indigo-300 bg-white py-2.5 active:bg-indigo-50"
            onPress={() =>
              void navigateMenuPath('/workshop-management/work-orders')
            }
          >
            <Text className="font-semibold text-indigo-800">Work order</Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2 px-4">
        {[
          {
            label: 'Active projects',
            value: stats.activeProjects,
            sub: `${stats.totalProjects} total · ${completionRate}% done`,
            icon: 'pulse' as const,
            border: 'border-l-indigo-500',
          },
          {
            label: 'Work orders',
            value: stats.workOrders,
            sub: 'In queue',
            icon: 'hammer' as const,
            border: 'border-l-blue-500',
          },
          {
            label: 'Efficiency',
            value: `${stats.productionEfficiency}%`,
            sub: 'Completed / total WO',
            icon: 'flash' as const,
            border: 'border-l-emerald-500',
          },
          {
            label: 'Team',
            value: stats.totalTeamMembers,
            sub: 'Members',
            icon: 'people' as const,
            border: 'border-l-violet-500',
          },
        ].map((t) => (
          <View
            key={t.label}
            className={`min-w-[45%] flex-1 rounded-xl border border-slate-200 border-l-4 ${t.border} bg-white p-3`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium text-slate-500">
                {t.label}
              </Text>
              <Ionicons name={t.icon} size={16} color="#64748b" />
            </View>
            <Text className="mt-1 text-2xl font-bold text-slate-900">
              {t.value}
            </Text>
            <Text className="text-xs text-slate-400">{t.sub}</Text>
          </View>
        ))}
      </View>

      <View className="mt-4 px-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          Workshop management
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {quickLinks.map((q) => (
            <Pressable
              key={q.path}
              onPress={() => void navigateMenuPath(q.path)}
              className="rounded-lg bg-indigo-50 px-3 py-2 active:bg-indigo-100"
            >
              <Text className="text-sm font-medium text-indigo-900">
                {q.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mt-6 px-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          Recent projects
        </Text>
        {dashboardData?.projects.recent?.length ? (
          dashboardData.projects.recent.slice(0, 6).map((p) => (
            <View
              key={p.id}
              className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <Text className="font-medium text-slate-900">{p.name}</Text>
              <Text className="text-xs text-slate-500">
                {p.completionPercent}% · {p.status}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-sm text-slate-500">No recent projects.</Text>
        )}
      </View>
    </ScrollView>
  );
}
