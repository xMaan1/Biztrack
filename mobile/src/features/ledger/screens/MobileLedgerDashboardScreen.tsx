import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type {
  BudgetResponse,
  IncomeStatementResponse,
  LedgerTransactionResponse,
  TrialBalanceResponse,
} from '../../../models/ledger';
import { getTransactionTypeLabel } from '../../../models/ledger';
import {
  getBudgets,
  getIncomeStatement,
  getLedgerTransactions,
  getTrialBalance,
} from '../../../services/ledger/ledgerMobileApi';
import { formatMoney } from '../ledgerFormat';

export function MobileLedgerDashboardScreen() {
  const { workspacePath, setSidebarActivePath, setWorkspacePath } =
    useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trial, setTrial] = useState<TrialBalanceResponse | null>(null);
  const [income, setIncome] = useState<IncomeStatementResponse | null>(null);
  const [budgets, setBudgets] = useState<BudgetResponse[]>([]);
  const [recent, setRecent] = useState<LedgerTransactionResponse[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [tb, inc, bud, tx] = await Promise.all([
        getTrialBalance().catch(() => null),
        getIncomeStatement().catch(() => null),
        getBudgets(0, 50, true).catch(() => []),
        getLedgerTransactions({ skip: 0, limit: 8 }).catch(() => []),
      ]);
      setTrial(tb);
      setIncome(inc);
      setBudgets(bud ?? []);
      setRecent(tx ?? []);
    } catch (e) {
      Alert.alert('Ledger', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/ledger',
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

  const tbDebit =
    trial?.accounts?.reduce((s, a) => s + (a.debit_balance ?? 0), 0) ?? 0;
  const tbCredit =
    trial?.accounts?.reduce((s, a) => s + (a.credit_balance ?? 0), 0) ?? 0;

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Ledger
        </Text>
        <View className="w-9" />
      </View>

      {loading && !trial && !income ? (
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
          <Text className="mb-2 text-base font-semibold text-slate-900">
            Overview
          </Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            <View className="min-w-[47%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
              <Text className="text-xs text-slate-500">Revenue</Text>
              <Text className="text-lg font-bold text-emerald-700">
                {formatMoney(income?.revenue ?? 0)}
              </Text>
            </View>
            <View className="min-w-[47%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
              <Text className="text-xs text-slate-500">Expenses</Text>
              <Text className="text-lg font-bold text-red-700">
                {formatMoney(income?.expenses ?? 0)}
              </Text>
            </View>
            <View className="min-w-[47%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
              <Text className="text-xs text-slate-500">Net income</Text>
              <Text className="text-lg font-bold text-slate-900">
                {formatMoney(income?.net_income ?? 0)}
              </Text>
            </View>
            <View className="min-w-[47%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
              <Text className="text-xs text-slate-500">Active budgets</Text>
              <Text className="text-lg font-bold text-slate-900">
                {budgets.length}
              </Text>
            </View>
          </View>

          <View className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-sm font-semibold text-slate-900">
              Trial balance
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              As of {trial?.as_of_date ? new Date(trial.as_of_date).toLocaleDateString() : '—'}
            </Text>
            <Text className="mt-2 text-sm text-slate-700">
              Total debits {formatMoney(tbDebit)}
            </Text>
            <Text className="text-sm text-slate-700">
              Total credits {formatMoney(tbCredit)}
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              {trial?.accounts?.length ?? 0} accounts
            </Text>
          </View>

          <Text className="mb-2 text-base font-semibold text-slate-900">
            Quick links
          </Text>
          <View className="mb-3 gap-2">
            {(
              [
                ['Profit & loss', '/ledger/profit-loss', 'trending-up-outline'],
                ['Investments', '/ledger/investments', 'briefcase-outline'],
                ['Transactions', '/ledger/transactions', 'swap-horizontal-outline'],
                ['Credit book', '/ledger/account-receivables', 'book-outline'],
                ['Reports', '/ledger/reports', 'document-text-outline'],
              ] as const
            ).map(([label, path, icon]) => (
              <Pressable
                key={path}
                className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-3"
                onPress={() => setWorkspacePath(path)}
              >
                <Ionicons name={icon as never} size={22} color="#2563eb" />
                <Text className="ml-3 flex-1 font-medium text-slate-900">
                  {label}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 text-base font-semibold text-slate-900">
            Recent transactions
          </Text>
          {(recent ?? []).length === 0 ? (
            <Text className="text-sm text-slate-500">No transactions yet.</Text>
          ) : (
            recent.map((t) => (
              <View
                key={t.id}
                className="mb-2 rounded-lg border border-slate-200 bg-white p-3"
              >
                <Text className="font-medium text-slate-900">{t.description}</Text>
                <Text className="text-xs text-slate-500">
                  {t.transaction_number} ·{' '}
                  {getTransactionTypeLabel(t.transaction_type)}
                </Text>
                <Text className="mt-1 text-sm font-semibold text-slate-800">
                  {formatMoney(t.amount)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
