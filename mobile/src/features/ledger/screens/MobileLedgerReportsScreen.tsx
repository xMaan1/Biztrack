import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type {
  IncomeStatementResponse,
  TrialBalanceResponse,
} from '../../../models/ledger';
import {
  getBalanceSheet,
  getIncomeStatement,
  getTrialBalance,
} from '../../../services/ledger/ledgerMobileApi';
import { formatMoney } from '../ledgerFormat';

type Tab = 'trial' | 'income' | 'balance';

function parseDateInputToIso(dateInput: string): string | null {
  const trimmed = dateInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function MobileLedgerReportsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [tab, setTab] = useState<Tab>('trial');
  const [asOf, setAsOf] = useState(() =>
    new Date().toISOString().split('T')[0],
  );
  const [start, setStart] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
  );
  const [end, setEnd] = useState(() =>
    new Date().toISOString().split('T')[0],
  );
  const [loading, setLoading] = useState(false);
  const [trial, setTrial] = useState<TrialBalanceResponse | null>(null);
  const [income, setIncome] = useState<IncomeStatementResponse | null>(null);
  const [balance, setBalance] = useState<unknown>(null);

  const run = useCallback(async () => {
    try {
      setLoading(true);
      if (tab === 'trial') {
        if (!parseDateInputToIso(asOf)) {
          Alert.alert('Reports', 'Use valid as-of date format YYYY-MM-DD.');
          return;
        }
        const t = await getTrialBalance(asOf);
        setTrial(t);
      } else if (tab === 'income') {
        const startIso = parseDateInputToIso(start);
        const endIso = parseDateInputToIso(end);
        if (!startIso || !endIso) {
          Alert.alert('Reports', 'Use valid start/end date format YYYY-MM-DD.');
          return;
        }
        const i = await getIncomeStatement(
          startIso,
          endIso,
        );
        setIncome(i);
      } else {
        if (!parseDateInputToIso(asOf)) {
          Alert.alert('Reports', 'Use valid as-of date format YYYY-MM-DD.');
          return;
        }
        const b = await getBalanceSheet(asOf);
        setBalance(b);
      }
    } catch (e) {
      Alert.alert('Reports', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [tab, asOf, start, end]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/ledger/reports',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Reports
        </Text>
        <View className="w-9" />
      </View>

      <View className="flex-row border-b border-slate-200 bg-white">
        {(
          [
            ['trial', 'Trial balance'],
            ['income', 'Income'],
            ['balance', 'Balance sheet'],
          ] as const
        ).map(([k, label]) => (
          <Pressable
            key={k}
            className={`flex-1 border-b-2 py-3 ${
              tab === k ? 'border-blue-600' : 'border-transparent'
            }`}
            onPress={() => setTab(k)}
          >
            <Text
              className={`text-center text-xs font-medium ${
                tab === k ? 'text-blue-600' : 'text-slate-600'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-2 border-b border-slate-200 bg-white px-3 py-2">
        {tab === 'income' ? (
          <>
            <Text className="text-xs text-slate-500">Start</Text>
            <TextInput
              className="rounded-lg border border-slate-200 px-2 py-2 text-slate-900"
              value={start}
              onChangeText={setStart}
            />
            <Text className="text-xs text-slate-500">End</Text>
            <TextInput
              className="rounded-lg border border-slate-200 px-2 py-2 text-slate-900"
              value={end}
              onChangeText={setEnd}
            />
          </>
        ) : (
          <>
            <Text className="text-xs text-slate-500">As of date</Text>
            <TextInput
              className="rounded-lg border border-slate-200 px-2 py-2 text-slate-900"
              value={asOf}
              onChangeText={setAsOf}
            />
          </>
        )}
        <Pressable
          className="items-center rounded-lg bg-blue-600 py-2"
          onPress={() => void run()}
        >
          <Text className="font-semibold text-white">Run report</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-3 py-3">
          {tab === 'trial' && trial ? (
            <>
              <Text className="mb-2 text-sm text-slate-600">
                As of {new Date(trial.as_of_date).toLocaleDateString()}
              </Text>
              {(trial.accounts ?? []).map((a) => (
                <View
                  key={a.account_id}
                  className="mb-2 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <Text className="font-medium text-slate-900">
                    {a.account_code} {a.account_name}
                  </Text>
                  <Text className="text-sm text-slate-700">
                    Dr {formatMoney(a.debit_balance)} · Cr{' '}
                    {formatMoney(a.credit_balance)}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {tab === 'income' && income ? (
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <Row label="Revenue" value={formatMoney(income.revenue)} />
              <Row label="Expenses" value={formatMoney(income.expenses)} />
              <Row label="Net income" value={formatMoney(income.net_income)} />
              <Text className="mt-2 text-xs text-slate-500">
                {new Date(income.start_date).toLocaleDateString()} –{' '}
                {new Date(income.end_date).toLocaleDateString()}
              </Text>
            </View>
          ) : null}

          {tab === 'balance' && balance ? (
            <BalanceSheetView data={balance} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-2 flex-row justify-between">
      <Text className="text-slate-600">{label}</Text>
      <Text className="font-semibold text-slate-900">{value}</Text>
    </View>
  );
}

function BalanceSheetView({ data }: { data: unknown }) {
  const o = data as Record<string, unknown>;
  const assets = o.assets as Record<string, unknown> | undefined;
  const liab = o.liabilities as Record<string, unknown> | undefined;
  const equity = o.equity as Record<string, unknown> | undefined;
  const asOf = o.as_of_date;

  if (assets && typeof assets === 'object') {
    return (
      <View>
        <Text className="mb-2 text-sm text-slate-600">
          As of{' '}
          {asOf ? new Date(String(asOf)).toLocaleDateString() : '—'}
        </Text>
        <Section title="Assets" sec={assets} />
        <Section title="Liabilities" sec={liab} />
        <Section title="Equity" sec={equity} />
        {typeof o.total_liabilities_and_equity === 'number' ? (
          <Text className="mt-2 font-semibold text-slate-900">
            L+E {formatMoney(o.total_liabilities_and_equity as number)}
          </Text>
        ) : null}
      </View>
    );
  }

  const ta = o.total_assets;
  const tl = o.total_liabilities;
  const te = o.total_equity;
  return (
    <View className="rounded-xl border border-slate-200 bg-white p-4">
      {typeof ta === 'number' ? (
        <Row label="Total assets" value={formatMoney(ta)} />
      ) : null}
      {typeof tl === 'number' ? (
        <Row label="Total liabilities" value={formatMoney(tl)} />
      ) : null}
      {typeof te === 'number' ? (
        <Row label="Total equity" value={formatMoney(te)} />
      ) : null}
    </View>
  );
}

function Section({
  title,
  sec,
}: {
  title: string;
  sec?: Record<string, unknown>;
}) {
  if (!sec) return null;
  const total = sec.total as number | undefined;
  const accounts = sec.accounts as
    | Array<{ account_name?: string; balance?: number }>
    | undefined;
  return (
    <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
      <Text className="mb-2 font-semibold text-slate-900">{title}</Text>
      {typeof total === 'number' ? (
        <Text className="mb-2 text-sm text-slate-700">
          Total {formatMoney(total)}
        </Text>
      ) : null}
      {(accounts ?? []).map((a, i) => (
        <Text key={i} className="text-sm text-slate-600">
          {a.account_name ?? '—'} · {formatMoney(a.balance ?? 0)}
        </Text>
      ))}
    </View>
  );
}
