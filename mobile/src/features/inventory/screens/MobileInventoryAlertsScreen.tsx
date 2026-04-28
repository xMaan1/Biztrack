import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { getInventoryDashboard } from '../../../services/inventory/inventoryMobileApi';
import type { InventoryDashboardStats, StockAlert } from '../../../models/inventory';

export function MobileInventoryAlertsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
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
      workspacePath === '/dashboard' ? '/dashboard' : '/inventory/alerts',
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

  const alerts = stats?.lowStockAlerts ?? [];

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Alerts
        </Text>
        <View className="w-10" />
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item, i) => `${item.productId}-${i}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            stats ? (
              <View className="border-b border-slate-200 bg-white px-4 py-3">
                <Text className="text-slate-800">
                  Low stock items: {stats.lowStockProducts} · Out of stock:{' '}
                  {stats.outOfStockProducts}
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No alerts</Text>
          }
          renderItem={({ item }: { item: StockAlert }) => (
            <View className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Text className="font-semibold text-slate-900">{item.productName}</Text>
              <Text className="text-sm text-slate-600">{item.sku}</Text>
              <Text className="mt-2 text-slate-800">
                Current {item.currentStock} · Min {item.minStockLevel}
              </Text>
              <Text className="mt-1 text-xs uppercase text-amber-900">
                {item.alertType}
              </Text>
              {item.message ? (
                <Text className="mt-2 text-sm text-slate-700">{item.message}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}
