import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { fetchPosProducts } from '../../../services/inventory/inventoryMobileApi';
import type { Product } from '../../../models/pos';

type Props = {
  sidebarPathWhenNotDashboard?: string;
  title?: string;
};

export function MobileInventoryProductsScreen({
  sidebarPathWhenNotDashboard = '/inventory/products',
  title = 'Products',
}: Props = {}) {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Product | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPosProducts();
      setProducts(res.products ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : sidebarPathWhenNotDashboard,
    );
  }, [setSidebarActivePath, workspacePath, sidebarPathWhenNotDashboard]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = products.filter((p) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return (
      p.name.toLowerCase().includes(t) ||
      p.sku.toLowerCase().includes(t)
    );
  });

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          {title}
        </Text>
        <View className="w-10" />
      </View>
      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search name or SKU…"
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        />
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No products</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <Text className="font-semibold text-slate-900">{item.name}</Text>
              <Text className="text-sm text-slate-600">{item.sku}</Text>
              <Text className="mt-1 text-slate-800">
                Stock {item.stockQuantity} · {formatUsd(item.unitPrice)}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[85%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Product</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-bold text-slate-900">{detail.name}</Text>
                <Text className="mt-1 text-slate-600">{detail.sku}</Text>
                <Text className="mt-3 text-slate-800">
                  Price {formatUsd(detail.unitPrice)} · Cost{' '}
                  {formatUsd(detail.costPrice)}
                </Text>
                <Text className="mt-2 text-slate-700">
                  Stock {detail.stockQuantity} · Min {detail.minStockLevel}
                </Text>
                <Text className="mt-2 text-slate-600">{detail.category}</Text>
              </ScrollView>
            ) : null}
            <Pressable
              onPress={() => setDetail(null)}
              className="mt-4 items-center rounded-lg bg-slate-100 py-3"
            >
              <Text className="font-semibold text-slate-800">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
