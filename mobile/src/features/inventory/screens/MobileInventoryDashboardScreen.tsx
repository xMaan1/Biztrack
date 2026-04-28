import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getInventoryDashboard } from '../../../services/inventory/inventoryMobileApi';
import type { InventoryDashboardStats } from '../../../models/inventory';

const LINKS: { path: string; label: string }[] = [
  { path: '/inventory/warehouses', label: 'Warehouses' },
  { path: '/inventory/storage-locations', label: 'Storage locations' },
  { path: '/inventory/stock-movements', label: 'Stock movements' },
  { path: '/inventory/purchase-orders', label: 'Purchase orders' },
  { path: '/inventory/receiving', label: 'Receiving' },
  { path: '/inventory/products', label: 'Products' },
  { path: '/inventory/alerts', label: 'Alerts' },
  { path: '/inventory/dumps', label: 'Dumps' },
  { path: '/inventory/customer-returns', label: 'Customer returns' },
  { path: '/inventory/supplier-returns', label: 'Supplier returns' },
];

export function MobileInventoryDashboardScreen() {
  const { workspacePath, setSidebarActivePath, navigateMenuPath } =
    useSidebarDrawer();
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getInventoryDashboard();
      setStats(d);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory',
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

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Inventory
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
          {stats ? (
            <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-lg font-semibold text-slate-900">
                Overview
              </Text>
              <Text className="mt-2 text-slate-700">
                Products {stats.totalProducts} · Low stock{' '}
                {stats.lowStockProducts} · Out {stats.outOfStockProducts}
              </Text>
              <Text className="mt-1 text-slate-700">
                Warehouses {stats.totalWarehouses} · Suppliers{' '}
                {stats.totalSuppliers}
              </Text>
              <Text className="mt-1 text-slate-700">
                Pending PO {stats.pendingPurchaseOrders} · Receivings{' '}
                {stats.pendingReceivings}
              </Text>
              <Text className="mt-2 font-semibold text-slate-900">
                Stock value {formatUsd(stats.totalStockValue)}
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
