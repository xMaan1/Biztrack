import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  TransactionStatus,
  getTransactionStatusLabel,
  type BankAccount,
  type BankTransaction,
  type ReconciliationSummary,
} from '../../../models/banking';
import {
  getBankAccounts,
  getBankTransactions,
  getReconciliationSummary,
  reconcileTransaction,
  updateBankTransaction,
} from '../../../services/banking/bankingMobileApi';
import { formatMoney } from '../bankingFormat';

const PAGE = 20;
const STATUS_OPTS = [
  { value: 'all', label: 'All statuses' },
  ...Object.values(TransactionStatus).map((v) => ({
    value: v,
    label: getTransactionStatusLabel(v),
  })),
];

type TxFilters = {
  accountId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
};

function parseDateInputToIso(dateInput: string, endOfDay = false): string | undefined {
  const trimmed = dateInput.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
  const timeSuffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
  const d = new Date(`${trimmed}${timeSuffix}`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function buildTxParams(f: TxFilters, skip: number) {
  return {
    skip,
    limit: PAGE,
    accountId: f.accountId === 'all' ? undefined : f.accountId,
    status:
      f.status === 'all' ? undefined : (f.status as TransactionStatus),
    startDate: parseDateInputToIso(f.dateFrom),
    endDate: parseDateInputToIso(f.dateTo, true),
  };
}

export function MobileBankReconciliationScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageBanking } = usePermissions();

  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [applied, setApplied] = useState<TxFilters>({
    accountId: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [search, setSearch] = useState('');
  const [filterAccountOpen, setFilterAccountOpen] = useState(false);
  const [filterStatusOpen, setFilterStatusOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [notesOpen, setNotesOpen] = useState(false);
  const [pendingReconcileId, setPendingReconcileId] = useState<string | null>(
    null,
  );
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const filterAccountOptions = useMemo(
    () => [
      { value: 'all', label: 'All accounts' },
      ...accounts.map((a) => ({
        value: a.id,
        label: `${a.accountName} (${a.bankName})`,
      })),
    ],
    [accounts],
  );

  const fetchSummary = useCallback(async () => {
    const s = await getReconciliationSummary();
    setSummary(s);
  }, []);

  const fetchPage = useCallback(
    async (nextPage: number, replace: boolean, f: TxFilters) => {
      const skip = nextPage * PAGE;
      const list = await getBankTransactions(buildTxParams(f, skip));
      const rows = list ?? [];
      setHasMore(rows.length >= PAGE);
      setPage(nextPage);
      if (replace) {
        setTransactions(rows);
      } else {
        setTransactions((prev) => [...prev, ...rows]);
      }
    },
    [],
  );

  const runInitial = useCallback(async () => {
    try {
      setLoading(true);
      const acc = await getBankAccounts(true);
      setAccounts(acc ?? []);
      await fetchSummary();
      const f: TxFilters = {
        accountId: 'all',
        status: 'all',
        dateFrom: '',
        dateTo: '',
      };
      setApplied(f);
      await fetchPage(0, true, f);
    } catch (e) {
      Alert.alert('Reconciliation', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [fetchPage, fetchSummary]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/banking/reconciliation',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void runInitial();
  }, [runInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchSummary();
      await fetchPage(0, true, applied);
    } catch (e) {
      Alert.alert('Reconciliation', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setRefreshing(false);
    }
  }, [applied, fetchPage, fetchSummary]);

  const applyFilters = useCallback(() => {
    void (async () => {
      if (dateFrom.trim() && !parseDateInputToIso(dateFrom)) {
        Alert.alert('Reconciliation', 'Invalid From date. Use YYYY-MM-DD.');
        return;
      }
      if (dateTo.trim() && !parseDateInputToIso(dateTo, true)) {
        Alert.alert('Reconciliation', 'Invalid To date. Use YYYY-MM-DD.');
        return;
      }
      const f: TxFilters = {
        accountId: accountFilter,
        status: statusFilter,
        dateFrom,
        dateTo,
      };
      try {
        setLoading(true);
        setApplied(f);
        await fetchSummary();
        await fetchPage(0, true, f);
      } catch (e) {
        Alert.alert('Reconciliation', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
      }
    })();
  }, [
    accountFilter,
    statusFilter,
    dateFrom,
    dateTo,
    fetchPage,
    fetchSummary,
  ]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    void (async () => {
      try {
        setLoadingMore(true);
        await fetchPage(page + 1, false, applied);
      } catch (e) {
        Alert.alert('Reconciliation', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoadingMore(false);
      }
    })();
  }, [applied, fetchPage, hasMore, loading, loadingMore, page]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        t.transactionNumber.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const openReconcile = useCallback((id: string) => {
    setPendingReconcileId(id);
    setReconcileNotes('');
    setNotesOpen(true);
  }, []);

  const reloadAfterMutation = useCallback(async () => {
    await fetchSummary();
    await fetchPage(0, true, applied);
  }, [applied, fetchPage, fetchSummary]);

  const submitReconcile = useCallback(async () => {
    if (!pendingReconcileId) return;
    try {
      setBusy(true);
      await reconcileTransaction(pendingReconcileId, reconcileNotes);
      setNotesOpen(false);
      setPendingReconcileId(null);
      await reloadAfterMutation();
    } catch (e) {
      Alert.alert('Reconciliation', extractErrorMessage(e, 'Reconcile failed'));
    } finally {
      setBusy(false);
    }
  }, [pendingReconcileId, reconcileNotes, reloadAfterMutation]);

  const unreconcile = useCallback(
    (t: BankTransaction) => {
      Alert.alert('Unreconcile', `Mark ${t.transactionNumber} as not reconciled?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unreconcile',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await updateBankTransaction(t.id, {
                  isReconciled: false,
                });
                await reloadAfterMutation();
              } catch (e) {
                Alert.alert(
                  'Reconciliation',
                  extractErrorMessage(e, 'Update failed'),
                );
              }
            })();
          },
        },
      ]);
    },
    [reloadAfterMutation],
  );

  const pct = summary?.reconciliationPercentage ?? 0;
  const lastDate = summary?.lastReconciliationDate
    ? new Date(summary.lastReconciliationDate).toLocaleString()
    : '—';

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Reconciliation
        </Text>
        <View className="w-9" />
      </View>

      <ScrollView
        className="max-h-[220px] border-b border-slate-200 bg-white"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row flex-wrap gap-2 px-3 py-3">
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Text className="text-xs text-slate-500">Total</Text>
            <Text className="text-lg font-bold text-slate-900">
              {summary?.totalTransactions ?? '—'}
            </Text>
          </View>
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Text className="text-xs text-slate-500">Reconciled</Text>
            <Text className="text-lg font-bold text-emerald-700">
              {summary?.reconciledTransactions ?? '—'}
            </Text>
          </View>
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Text className="text-xs text-slate-500">Unreconciled</Text>
            <Text className="text-lg font-bold text-amber-700">
              {summary?.unreconciledTransactions ?? '—'}
            </Text>
          </View>
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Text className="text-xs text-slate-500">Match %</Text>
            <Text className="text-lg font-bold text-slate-900">
              {summary ? `${pct.toFixed(1)}%` : '—'}
            </Text>
          </View>
        </View>
        <Text className="px-3 pb-3 text-xs text-slate-500">
          Last reconciliation: {lastDate}
        </Text>
      </ScrollView>

      <View className="gap-2 border-b border-slate-200 bg-white px-2 py-2">
        <TextInput
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
          placeholder="Search description or #"
          value={search}
          onChangeText={setSearch}
        />
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-900"
            placeholder="From YYYY-MM-DD"
            value={dateFrom}
            onChangeText={setDateFrom}
          />
          <TextInput
            className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-900"
            placeholder="To YYYY-MM-DD"
            value={dateTo}
            onChangeText={setDateTo}
          />
        </View>
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
            onPress={() => setFilterAccountOpen(true)}
          >
            <Text className="flex-1 text-xs text-slate-900" numberOfLines={1}>
              {filterAccountOptions.find((o) => o.value === accountFilter)?.label}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#64748b" />
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
            onPress={() => setFilterStatusOpen(true)}
          >
            <Text className="text-xs text-slate-900" numberOfLines={1}>
              {STATUS_OPTS.find((o) => o.value === statusFilter)?.label}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#64748b" />
          </Pressable>
        </View>
        <Pressable
          className="items-center rounded-lg bg-blue-600 py-2"
          onPress={applyFilters}
        >
          <Text className="font-semibold text-white">Apply filters</Text>
        </Pressable>
      </View>

      {loading && transactions.length === 0 ? (
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4">
                <ActivityIndicator color="#2563eb" />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View className="border-b border-slate-100 bg-white px-4 py-3">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">
                    {item.description}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {item.transactionNumber} ·{' '}
                    {getTransactionStatusLabel(item.status)}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-600">
                    {new Date(item.transactionDate).toLocaleString()}
                  </Text>
                  <Text className="mt-1 text-base font-bold text-slate-900">
                    {formatMoney(item.amount, item.currency)}
                  </Text>
                  <Text
                    className={`mt-1 text-xs ${
                      item.isReconciled ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {item.isReconciled ? 'Reconciled' : 'Not reconciled'}
                  </Text>
                </View>
              </View>
              {canManageBanking() ? (
                <View className="mt-2 flex-row flex-wrap gap-3">
                  {!item.isReconciled ? (
                    <Pressable onPress={() => openReconcile(item.id)}>
                      <Text className="font-medium text-blue-600">Reconcile</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => unreconcile(item)}>
                      <Text className="font-medium text-slate-700">Unreconcile</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">
              No transactions
            </Text>
          }
        />
      )}

      <Modal visible={notesOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">
              Reconciliation notes
            </Text>
            <TextInput
              className="mt-3 min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Optional notes"
              value={reconcileNotes}
              onChangeText={setReconcileNotes}
              multiline
            />
            <Pressable
              className="mt-4 items-center rounded-lg bg-blue-600 py-3"
              disabled={busy}
              onPress={() => void submitReconcile()}
            >
              <Text className="font-semibold text-white">Confirm</Text>
            </Pressable>
            <Pressable
              className="mt-2 py-2"
              onPress={() => {
                setNotesOpen(false);
                setPendingReconcileId(null);
              }}
            >
              <Text className="text-center text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <OptionSheet
        visible={filterAccountOpen}
        title="Account"
        options={filterAccountOptions}
        onSelect={(v) => {
          setAccountFilter(v);
          setFilterAccountOpen(false);
        }}
        onClose={() => setFilterAccountOpen(false)}
      />
      <OptionSheet
        visible={filterStatusOpen}
        title="Status"
        options={STATUS_OPTS}
        onSelect={(v) => {
          setStatusFilter(v);
          setFilterStatusOpen(false);
        }}
        onClose={() => setFilterStatusOpen(false)}
      />
    </View>
  );
}
