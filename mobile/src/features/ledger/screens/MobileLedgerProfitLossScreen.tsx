import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet, type OptionItem } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { getProfitLossDashboard } from '../../../services/ledger/ledgerMobileApi';
import { formatMoney } from '../ledgerFormat';

const PERIODS: OptionItem<string>[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

function num(v: unknown): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : 0;
}

function section(obj: unknown): Record<string, unknown> | undefined {
  return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : undefined;
}

export function MobileLedgerProfitLossScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [period, setPeriod] = useState('month');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getProfitLossDashboard({ period });
      setData(d);
    } catch (e) {
      Alert.alert('Profit & loss', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/ledger/profit-loss',
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

  const summary = section(data?.summary);
  const sales = section(data?.sales);
  const purchases = section(data?.purchases);
  const inventory = section(data?.inventory);
  const qc = section(data?.quotes_contracts);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Profit & loss
        </Text>
        <View className="w-9" />
      </View>

      <Pressable
        className="flex-row items-center justify-between border-b border-slate-200 bg-white px-3 py-2"
        onPress={() => setPeriodOpen(true)}
      >
        <Text className="text-sm text-slate-600">Period</Text>
        <Text className="font-medium text-slate-900">
          {PERIODS.find((p) => p.value === period)?.label}
        </Text>
      </Pressable>

      {loading && !data ? (
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
          <Text className="mb-1 text-xs text-slate-500">
            {data?.start_date && data?.end_date
              ? `${String(data.start_date)} → ${String(data.end_date)}`
              : ''}
          </Text>

          <Text className="mb-2 text-base font-semibold text-slate-900">
            Summary
          </Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            <Metric
              label="Total sales"
              value={formatMoney(num(summary?.total_sales))}
            />
            <Metric
              label="Total purchases"
              value={formatMoney(num(summary?.total_purchases))}
            />
            <Metric
              label="Gross profit"
              value={formatMoney(num(summary?.gross_profit))}
            />
            <Metric
              label="Net profit"
              value={formatMoney(num(summary?.net_profit))}
            />
            <Metric
              label="Payments received"
              value={formatMoney(num(summary?.total_payments_received))}
            />
            <Metric
              label="Inventory value"
              value={formatMoney(num(summary?.inventory_value))}
            />
            <Metric
              label="Investments"
              value={formatMoney(num(summary?.total_investments))}
            />
            <Metric
              label="Profit after investment"
              value={formatMoney(num(summary?.profit_after_investment))}
            />
          </View>

          <Text className="mb-2 text-base font-semibold text-slate-900">
            Sales
          </Text>
          <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
            <Row k="Invoices" v={String(num(sales?.total_invoices))} />
            <Row k="Paid" v={String(num(sales?.paid_invoices))} />
            <Row k="Pending" v={String(num(sales?.pending_invoices))} />
            <Row k="Overdue" v={String(num(sales?.overdue_invoices))} />
            <Row
              k="Total sales"
              v={formatMoney(num(sales?.total_sales))}
            />
          </View>

          <Text className="mb-2 text-base font-semibold text-slate-900">
            Purchases
          </Text>
          <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
            <Row k="PO count" v={String(num(purchases?.total_purchase_orders))} />
            <Row k="Completed" v={String(num(purchases?.completed_purchases))} />
            <Row k="Pending" v={String(num(purchases?.pending_purchases))} />
            <Row
              k="Total"
              v={formatMoney(num(purchases?.total_purchases))}
            />
          </View>

          <Text className="mb-2 text-base font-semibold text-slate-900">
            Inventory
          </Text>
          <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
            <Row k="Products" v={String(num(inventory?.total_products))} />
            <Row
              k="Value"
              v={formatMoney(num(inventory?.total_inventory_value))}
            />
            <Row k="Inbound mvmt" v={String(num(inventory?.inbound_movements))} />
            <Row k="Outbound mvmt" v={String(num(inventory?.outbound_movements))} />
          </View>

          <Text className="mb-2 text-base font-semibold text-slate-900">
            Quotes & contracts
          </Text>
          <View className="mb-6 rounded-xl border border-slate-200 bg-white p-3">
            <Row k="Quotes" v={String(num(qc?.total_quotes))} />
            <Row k="Quotes value" v={formatMoney(num(qc?.quotes_value))} />
            <Row k="Contracts" v={String(num(qc?.total_contracts))} />
            <Row k="Contracts value" v={formatMoney(num(qc?.contracts_value))} />
          </View>
        </ScrollView>
      )}

      <OptionSheet
        visible={periodOpen}
        title="Period"
        options={PERIODS}
        onSelect={(v) => {
          setPeriod(v);
          setPeriodOpen(false);
        }}
        onClose={() => setPeriodOpen(false)}
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[47%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className="text-base font-bold text-slate-900">{value}</Text>
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View className="mb-1 flex-row justify-between border-b border-slate-100 py-1">
      <Text className="text-sm text-slate-600">{k}</Text>
      <Text className="text-sm font-medium text-slate-900">{v}</Text>
    </View>
  );
}
