import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebarDrawer } from '../contexts/SidebarDrawerContext';
import { MenuHeaderButton } from '../components/layout/MenuHeaderButton';
import { usePlanInfo } from '../hooks/usePlanInfo';
import { useDashboard, type DashboardData } from '../hooks/useDashboard';
import { usePermissions } from '../hooks/usePermissions';
import { useRBAC } from '../contexts/RBACContext';
import { evalSidebarPathPermission } from '../hooks/useSidebarFilteredMenu';
import {
  MobileCommerceDashboard,
  type CommerceStats,
} from '../components/dashboard/MobileCommerceDashboard';
import { NonCommerceScreen } from './NonCommerceScreen';
import { MobileCrmDashboardScreen } from './MobileCrmDashboardScreen';
import {
  MobileCustomersScreen,
  MobileContactsScreen,
  MobileCompaniesScreen,
  MobileLeadsScreen,
  MobileOpportunitiesScreen,
} from '../features/crm';
import {
  MobileQuotesScreen,
  MobileContractsScreen,
  MobileSalesAnalyticsScreen,
  MobileInvoicesScreen,
  MobileInstallmentsScreen,
  MobileDeliveryNotesScreen,
} from '../features/sales';
import { InventoryRouter } from '../features/inventory/InventoryRouter';
import { isInventoryWorkspacePath } from '../features/inventory/inventoryPaths';
import { PosRouter } from '../features/pos/PosRouter';
import { isPosWorkspacePath } from '../features/pos/posPaths';
import { HrmRouter } from '../features/hrm/HrmRouter';
import { isHrmWorkspacePath } from '../features/hrm/hrmPaths';
import { ProjectRouter } from '../features/projects/ProjectRouter';
import { isProjectWorkspacePath } from '../features/projects/projectPaths';
import { BankingRouter } from '../features/banking/BankingRouter';
import { isBankingWorkspacePath } from '../features/banking/bankingPaths';
import { LedgerRouter } from '../features/ledger/LedgerRouter';
import { isLedgerWorkspacePath } from '../features/ledger/ledgerPaths';
import { SettingsRouter } from '../features/settings/SettingsRouter';
import { isSettingsWorkspacePath } from '../features/settings/settingsPaths';
import { WorkspaceRouter } from '../features/workspace/WorkspaceRouter';
import { isWorkspaceHubPath } from '../features/workspace/workspacePaths';
import { MobileHealthcareDashboardScreen } from './MobileHealthcareDashboardScreen';
import {
  HealthcareRouter,
  isHealthcareWorkspacePath,
} from '../features/healthcare';

function buildCommerceStats(data: DashboardData | null): CommerceStats {
  if (!data) {
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalTeamMembers: 0,
      averageProgress: 0,
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      lowStockItems: 0,
      pendingOrdersHint: 0,
      netIncome: 0,
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

  const revenue = data.financials?.totalRevenue ?? 0;
  const orderCount = data.workOrders?.stats?.total ?? 0;
  const avgOrder =
    orderCount > 0 ? Math.round(revenue / orderCount) : 0;

  return {
    totalProjects: data.projects.stats.total,
    activeProjects: data.projects.stats.active,
    completedProjects: data.projects.stats.completed,
    totalTeamMembers: data.users.total,
    averageProgress: avgProgress,
    totalSales: revenue,
    totalOrders: orderCount,
    averageOrderValue: avgOrder,
    lowStockItems: data.inventory?.lowStock ?? 0,
    pendingOrdersHint: data.workOrders?.stats?.in_progress ?? 0,
    netIncome: data.financials?.netIncome ?? 0,
  };
}

function SalesAccessDenied(props: { onBack: () => void }) {
  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
        <MenuHeaderButton />
      </View>
      <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Sales access
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          You do not have permission to open this module.
        </Text>
        <Pressable
          className="mt-6 items-center rounded-lg bg-blue-600 py-3"
          onPress={props.onBack}
        >
          <Text className="font-semibold text-white">Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function CommerceDashboardScreen() {
  const { logout, user, currentTenant } = useAuth();
  const { setSidebarActivePath, workspacePath, setWorkspacePath } =
    useSidebarDrawer();
  const { canViewCRM } = usePermissions();
  const { hasPermission, isOwner, hasModuleAccess } = useRBAC();
  const { planInfo, loading: planLoading, error: planError, refreshPlanInfo } =
    usePlanInfo();
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch,
  } = useDashboard();

  const stats = useMemo(
    () => buildCommerceStats(dashboardData),
    [dashboardData],
  );

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshPlanInfo(), refetch()]);
  }, [refreshPlanInfo, refetch]);

  const commerceHome =
    planInfo?.planType === 'commerce' && workspacePath === '/dashboard';

  useEffect(() => {
    if (workspacePath === '/dashboard') {
      setSidebarActivePath('/dashboard');
    }
  }, [workspacePath, setSidebarActivePath]);

  const awaitingFirstPayload =
    planLoading && !planInfo
    ? true
    : Boolean(
        planInfo &&
          commerceHome &&
          dashboardLoading &&
          !dashboardData,
      );

  if (awaitingFirstPayload) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-slate-600">Loading dashboard…</Text>
        </View>
      </View>
    );
  }

  if (planError) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Could not load dashboard
        </Text>
        <Text className="mt-2 text-center text-slate-600">{planError}</Text>
        <Pressable
          className="mt-6 items-center rounded-lg bg-blue-600 py-3 active:bg-blue-700"
          onPress={() => void onRefresh()}
        >
          <Text className="font-semibold text-white">Try again</Text>
        </Pressable>
        <Pressable
          className="mt-4 items-center py-2"
          onPress={() => void logout()}
        >
          <Text className="font-medium text-slate-600">Sign out</Text>
        </Pressable>
        </View>
      </View>
    );
  }

  if (dashboardError && commerceHome) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Could not load dashboard
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          {dashboardError}
        </Text>
        <Pressable
          className="mt-6 items-center rounded-lg bg-blue-600 py-3 active:bg-blue-700"
          onPress={() => void onRefresh()}
        >
          <Text className="font-semibold text-white">Try again</Text>
        </Pressable>
        <Pressable
          className="mt-4 items-center py-2"
          onPress={() => void logout()}
        >
          <Text className="font-medium text-slate-600">Sign out</Text>
        </Pressable>
        </View>
      </View>
    );
  }

  if (!planInfo) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 justify-center px-6">
        <Text className="text-center text-lg font-semibold text-slate-900">
          Plan information not available
        </Text>
        <Text className="mt-2 text-center text-slate-600">
          Unable to load subscription for this workspace.
        </Text>
        <Pressable
          className="mt-6 items-center rounded-lg bg-blue-600 py-3"
          onPress={() => void onRefresh()}
        >
          <Text className="font-semibold text-white">Retry</Text>
        </Pressable>
        </View>
      </View>
    );
  }

  if (isInventoryWorkspacePath(workspacePath)) {
    return <InventoryRouter />;
  }

  if (isPosWorkspacePath(workspacePath)) {
    return <PosRouter />;
  }

  if (isHrmWorkspacePath(workspacePath)) {
    return <HrmRouter />;
  }

  if (isProjectWorkspacePath(workspacePath)) {
    return <ProjectRouter />;
  }

  if (isBankingWorkspacePath(workspacePath)) {
    return <BankingRouter />;
  }

  if (isLedgerWorkspacePath(workspacePath)) {
    return <LedgerRouter />;
  }

  if (isSettingsWorkspacePath(workspacePath)) {
    return <SettingsRouter />;
  }

  if (isWorkspaceHubPath(workspacePath)) {
    return <WorkspaceRouter />;
  }

  if (planInfo.planType === 'healthcare') {
    if (workspacePath === '/dashboard') {
      return <MobileHealthcareDashboardScreen />;
    }
    if (isHealthcareWorkspacePath(workspacePath)) {
      return <HealthcareRouter />;
    }
    if (workspacePath === '/crm' && canViewCRM()) {
      return <MobileCrmDashboardScreen />;
    }
    if (workspacePath === '/crm/customers' && canViewCRM()) {
      return <MobileCustomersScreen />;
    }
    if (workspacePath === '/crm/contacts' && canViewCRM()) {
      return <MobileContactsScreen />;
    }
    if (workspacePath === '/crm/companies' && canViewCRM()) {
      return <MobileCompaniesScreen />;
    }
    if (workspacePath === '/crm/leads' && canViewCRM()) {
      return <MobileLeadsScreen />;
    }
    if (workspacePath === '/crm/opportunities' && canViewCRM()) {
      return <MobileOpportunitiesScreen />;
    }
    if (workspacePath === '/sales/invoices') {
      if (
        hasModuleAccess('sales') &&
        evalSidebarPathPermission('/sales/invoices', isOwner, hasPermission)
      ) {
        return <MobileInvoicesScreen />;
      }
      return (
        <SalesAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
      );
    }
    if (
      workspacePath === '/crm' ||
      workspacePath === '/crm/customers' ||
      workspacePath === '/crm/contacts' ||
      workspacePath === '/crm/companies' ||
      workspacePath === '/crm/leads' ||
      workspacePath === '/crm/opportunities'
    ) {
      return (
        <View className="flex-1 bg-slate-50">
          <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
            <MenuHeaderButton />
          </View>
          <View className="flex-1 justify-center px-6">
            <Text className="text-center text-lg font-semibold text-slate-900">
              CRM access
            </Text>
            <Text className="mt-2 text-center text-slate-600">
              You do not have permission to open this module.
            </Text>
            <Pressable
              className="mt-6 items-center rounded-lg bg-blue-600 py-3"
              onPress={() => setWorkspacePath('/dashboard')}
            >
              <Text className="font-semibold text-white">Back</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    return <NonCommerceScreen planType={planInfo.planType} />;
  }

  if (planInfo.planType === 'workshop') {
    if (workspacePath === '/sales/invoices') {
      if (
        hasModuleAccess('sales') &&
        evalSidebarPathPermission('/sales/invoices', isOwner, hasPermission)
      ) {
        return <MobileInvoicesScreen />;
      }
      return (
        <SalesAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
      );
    }
    if (workspacePath === '/crm/customers' || workspacePath === '/dashboard') {
      return <MobileCustomersScreen />;
    }
    return <NonCommerceScreen planType={planInfo.planType} />;
  }

  if (planInfo.planType !== 'commerce') {
    return <NonCommerceScreen planType={planInfo.planType} />;
  }

  if (workspacePath === '/crm' && canViewCRM()) {
    return <MobileCrmDashboardScreen />;
  }

  if (workspacePath === '/crm/customers' && canViewCRM()) {
    return <MobileCustomersScreen />;
  }

  if (workspacePath === '/crm/contacts' && canViewCRM()) {
    return <MobileContactsScreen />;
  }

  if (workspacePath === '/crm/companies' && canViewCRM()) {
    return <MobileCompaniesScreen />;
  }

  if (workspacePath === '/crm/leads' && canViewCRM()) {
    return <MobileLeadsScreen />;
  }

  if (workspacePath === '/crm/opportunities' && canViewCRM()) {
    return <MobileOpportunitiesScreen />;
  }

  if (
    workspacePath === '/sales/quotes' ||
    workspacePath === '/sales/contracts' ||
    workspacePath === '/sales/analytics' ||
    workspacePath === '/sales/invoices' ||
    workspacePath === '/sales/installments' ||
    workspacePath === '/sales/delivery-notes'
  ) {
    const salesOk =
      hasModuleAccess('sales') &&
      evalSidebarPathPermission(workspacePath, isOwner, hasPermission);
    if (!salesOk) {
      return (
        <SalesAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
      );
    }
    switch (workspacePath) {
      case '/sales/quotes':
        return <MobileQuotesScreen />;
      case '/sales/contracts':
        return <MobileContractsScreen />;
      case '/sales/analytics':
        return <MobileSalesAnalyticsScreen />;
      case '/sales/invoices':
        return <MobileInvoicesScreen />;
      case '/sales/installments':
        return <MobileInstallmentsScreen />;
      case '/sales/delivery-notes':
        return <MobileDeliveryNotesScreen />;
      default:
        return (
          <SalesAccessDenied onBack={() => setWorkspacePath('/dashboard')} />
        );
    }
  }

  if (
    workspacePath === '/crm' ||
    workspacePath === '/crm/customers' ||
    workspacePath === '/crm/contacts' ||
    workspacePath === '/crm/companies' ||
    workspacePath === '/crm/leads' ||
    workspacePath === '/crm/opportunities'
  ) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 justify-center px-6">
          <Text className="text-center text-lg font-semibold text-slate-900">
            CRM access
          </Text>
          <Text className="mt-2 text-center text-slate-600">
            You do not have permission to open this module.
          </Text>
          <Pressable
            className="mt-6 items-center rounded-lg bg-blue-600 py-3"
            onPress={() => setWorkspacePath('/dashboard')}
          >
            <Text className="font-semibold text-white">Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const userLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ? `${[user?.firstName, user?.lastName].filter(Boolean).join(' ')} · ${user?.email ?? ''}`
    : user?.email ?? '';

  return (
    <View className="flex-1 bg-slate-50">
      <MobileCommerceDashboard
        stats={stats}
        onLogout={logout}
        userLabel={
          currentTenant
            ? `${currentTenant.name}${userLabel ? ` · ${userLabel}` : ''}`
            : userLabel
        }
        refreshing={planLoading || dashboardLoading}
        onRefresh={() => void onRefresh()}
      />
    </View>
  );
}
