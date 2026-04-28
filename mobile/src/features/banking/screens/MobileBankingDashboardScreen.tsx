import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  BankAccountType,
  type BankAccountCreate,
  type BankTransaction,
  type BankingDashboard,
  type Till,
} from '../../../models/banking';
import {
  createBankAccount,
  getBankAccounts,
  getBankingDashboard,
  getTills,
} from '../../../services/banking/bankingMobileApi';
import { formatMoney } from '../bankingFormat';
import { AppModal } from '../../../components/layout/AppModal';

function Metric(props: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: string;
}) {
  return (
    <View className="mb-3 flex-1 min-w-[46%] rounded-xl border border-slate-200 bg-white p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-slate-500">{props.title}</Text>
        <Ionicons name={props.icon} size={16} color="#64748b" />
      </View>
      <Text className={`mt-1 text-lg font-bold ${props.tone ?? 'text-slate-900'}`}>
        {props.value}
      </Text>
    </View>
  );
}

export function MobileBankingDashboardScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageBanking } = usePermissions();

  const [dash, setDash] = useState<BankingDashboard | null>(null);
  const [accounts, setAccounts] = useState<Awaited<
    ReturnType<typeof getBankAccounts>
  >>([]);
  const [tills, setTills] = useState<Till[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<BankAccountCreate>({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    bankCode: '',
    accountType: BankAccountType.CHECKING,
    currency: 'USD',
    currentBalance: 0,
    availableBalance: 0,
    pendingBalance: 0,
    isActive: true,
    isPrimary: false,
    supportsOnlineBanking: false,
    description: '',
    tags: [],
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [d, acc, tl] = await Promise.all([
        getBankingDashboard(),
        getBankAccounts(true),
        getTills(100),
      ]);
      setDash(d);
      setAccounts(acc ?? []);
      setTills(tl ?? []);
    } catch (e) {
      Alert.alert('Banking', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/banking',
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

  const submitCreate = useCallback(async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim() || !form.bankName.trim()) {
      Alert.alert('Banking', 'Account name, number, and bank name are required.');
      return;
    }
    try {
      setBusy(true);
      await createBankAccount(form);
      setCreateOpen(false);
      setForm({
        accountName: '',
        accountNumber: '',
        routingNumber: '',
        bankName: '',
        bankCode: '',
        accountType: BankAccountType.CHECKING,
        currency: 'USD',
        currentBalance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        isActive: true,
        isPrimary: false,
        supportsOnlineBanking: false,
        description: '',
        tags: [],
      });
      await load();
    } catch (e) {
      Alert.alert('Banking', extractErrorMessage(e, 'Could not create account'));
    } finally {
      setBusy(false);
    }
  }, [form, load]);

  const recent: BankTransaction[] = dash?.recentTransactions ?? [];

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Banking
        </Text>
        {canManageBanking() ? (
          <Pressable className="px-2 py-1" onPress={() => setCreateOpen(true)}>
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      {loading && !dash ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-3 pt-3"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="mb-2 flex-row flex-wrap gap-2">
            <Metric
              title="Total balance"
              value={formatMoney(dash?.totalBankBalance ?? 0)}
              icon="wallet-outline"
            />
            <Metric
              title="Available"
              value={formatMoney(dash?.totalAvailableBalance ?? 0)}
              icon="checkmark-circle-outline"
            />
            <Metric
              title="Pending"
              value={formatMoney(dash?.totalPendingBalance ?? 0)}
              icon="time-outline"
            />
            <Metric
              title="Pending txns"
              value={String(dash?.pendingTransactionsCount ?? 0)}
              icon="list-outline"
            />
            <Metric
              title="Daily inflow"
              value={formatMoney(dash?.dailyInflow ?? 0)}
              icon="trending-up-outline"
              tone="text-emerald-700"
            />
            <Metric
              title="Daily outflow"
              value={formatMoney(dash?.dailyOutflow ?? 0)}
              icon="trending-down-outline"
              tone="text-red-700"
            />
            <Metric
              title="Net cash flow"
              value={formatMoney(dash?.netCashFlow ?? 0)}
              icon="swap-horizontal-outline"
            />
            <Metric
              title="Receivables"
              value={formatMoney(dash?.outstandingReceivables ?? 0)}
              icon="arrow-down-circle-outline"
            />
            <Metric
              title="Payables"
              value={formatMoney(dash?.outstandingPayables ?? 0)}
              icon="arrow-up-circle-outline"
            />
          </View>

          <Text className="mb-2 mt-2 text-base font-semibold text-slate-900">
            Accounts
          </Text>
          {(dash?.bankAccountsSummary ?? []).length === 0 && accounts.length === 0 ? (
            <Text className="mb-3 text-sm text-slate-500">No accounts yet.</Text>
          ) : (
            (dash?.bankAccountsSummary ?? []).map((raw) => {
              const s = raw as unknown as Record<string, unknown>;
              const id = String(s.id ?? '');
              const name = String(s.name ?? s.account_name ?? '');
              const bankName = String(s.bankName ?? s.bank_name ?? '');
              const cur = Number(s.currentBalance ?? s.current_balance ?? 0);
              const av = Number(s.availableBalance ?? s.available_balance ?? 0);
              return (
                <View
                  key={id}
                  className="mb-2 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <Text className="font-semibold text-slate-900">{name}</Text>
                  <Text className="text-xs text-slate-500">{bankName}</Text>
                  <Text className="mt-1 text-sm text-slate-700">
                    {formatMoney(cur)} · Avail {formatMoney(av)}
                  </Text>
                </View>
              );
            })
          )}

          <Text className="mb-2 mt-3 text-base font-semibold text-slate-900">
            Recent transactions
          </Text>
          {recent.length === 0 ? (
            <Text className="mb-3 text-sm text-slate-500">No recent activity.</Text>
          ) : (
            recent.slice(0, 8).map((t) => (
              <View
                key={t.id}
                className="mb-2 rounded-lg border border-slate-100 bg-white p-2"
              >
                <Text className="text-sm font-medium text-slate-900">
                  {t.description}
                </Text>
                <Text className="text-xs text-slate-500">
                  {t.transactionNumber} · {new Date(t.transactionDate).toLocaleString()}
                </Text>
                <Text className="mt-1 text-sm font-semibold text-slate-800">
                  {formatMoney(t.amount, t.currency)}
                </Text>
              </View>
            ))
          )}

          <Text className="mb-2 mt-3 text-base font-semibold text-slate-900">
            Tills
          </Text>
          {tills.length === 0 ? (
            <Text className="mb-6 text-sm text-slate-500">No tills configured.</Text>
          ) : (
            tills.map((t) => (
              <View
                key={t.id}
                className="mb-2 rounded-lg border border-slate-200 bg-white p-3"
              >
                <Text className="font-semibold text-slate-900">{t.name}</Text>
                {t.location ? (
                  <Text className="text-xs text-slate-500">{t.location}</Text>
                ) : null}
                <Text className="mt-1 text-sm">
                  {formatMoney(t.currentBalance, t.currency)}
                  {t.isActive ? '' : ' · Inactive'}
                </Text>
              </View>
            ))
          )}
          <View className="h-8" />
        </ScrollView>
      )}

      <AppModal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">New account</Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              <Field
                label="Account name"
                value={form.accountName}
                onChange={(v) => setForm((f) => ({ ...f, accountName: v }))}
              />
              <Field
                label="Account number"
                value={form.accountNumber}
                onChange={(v) => setForm((f) => ({ ...f, accountNumber: v }))}
              />
              <Field
                label="Bank name"
                value={form.bankName}
                onChange={(v) => setForm((f) => ({ ...f, bankName: v }))}
              />
              <Field
                label="Routing (optional)"
                value={form.routingNumber ?? ''}
                onChange={(v) => setForm((f) => ({ ...f, routingNumber: v }))}
              />
              <Field
                label="Description"
                value={form.description ?? ''}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
              />
            </ScrollView>
            <Pressable
              className="mt-2 items-center rounded-lg bg-blue-600 py-3"
              disabled={busy}
              onPress={() => void submitCreate()}
            >
              <Text className="font-semibold text-white">Create</Text>
            </Pressable>
            <Pressable className="mt-2 py-2" onPress={() => setCreateOpen(false)}>
              <Text className="text-center text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <Text className="mb-1 text-xs font-medium text-slate-500">{props.label}</Text>
      <TextInput
        className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        value={props.value}
        onChangeText={props.onChange}
      />
    </>
  );
}
