import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getAccountReceivableStatusLabel,
  type AccountReceivable,
} from '../../../models/ledger';
import { getAccountReceivablesList } from '../../../services/ledger/ledgerMobileApi';
import { formatMoney } from '../ledgerFormat';

export function MobileLedgerAccountReceivablesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [rows, setRows] = useState<AccountReceivable[]>([]);
  const [totals, setTotals] = useState({
    total_outstanding: 0,
    total_overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAccountReceivablesList();
      setRows(res.account_receivables ?? []);
      setTotals({
        total_outstanding: res.total_outstanding ?? 0,
        total_overdue: res.total_overdue ?? 0,
      });
    } catch (e) {
      Alert.alert('Credit book', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/ledger/account-receivables',
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

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(q) ||
          r.invoice_number.toLowerCase().includes(q),
      )
    : rows;

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Credit book
        </Text>
        <View className="w-9" />
      </View>

      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <Text className="text-xs text-slate-500">Outstanding</Text>
        <Text className="text-lg font-bold text-amber-700">
          {formatMoney(totals.total_outstanding)}
        </Text>
        <Text className="mt-1 text-xs text-slate-500">Overdue</Text>
        <Text className="text-base font-semibold text-red-700">
          {formatMoney(totals.total_overdue)}
        </Text>
      </View>

      <TextInput
        className="border-b border-slate-200 bg-white px-3 py-2 text-slate-900"
        placeholder="Search customer or invoice #"
        value={search}
        onChangeText={setSearch}
      />

      {loading && rows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View className="border-b border-slate-100 bg-white px-4 py-3">
              <Text className="font-semibold text-slate-900">
                {item.customer_name}
              </Text>
              <Text className="text-xs text-slate-500">
                {item.invoice_number} · Due{' '}
                {new Date(item.due_date).toLocaleDateString()}
              </Text>
              <Text className="mt-1 text-sm text-slate-700">
                {getAccountReceivableStatusLabel(item.status)}
                {item.days_overdue > 0
                  ? ` · ${item.days_overdue}d overdue`
                  : ''}
              </Text>
              <Text className="mt-1 text-base font-bold text-slate-900">
                Balance {formatMoney(item.outstanding_balance, item.currency)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No receivables</Text>
          }
        />
      )}
    </View>
  );
}
