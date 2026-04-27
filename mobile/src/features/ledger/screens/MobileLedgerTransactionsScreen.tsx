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
import {
  OptionSheet,
  type OptionItem,
} from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  TransactionStatus,
  TransactionType,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
  type ChartOfAccountsResponse,
  type LedgerTransactionResponse,
} from '../../../models/ledger';
import {
  createLedgerTransaction,
  deleteLedgerTransaction,
  getChartOfAccounts,
  getLedgerTransactions,
  updateLedgerTransaction,
} from '../../../services/ledger/ledgerMobileApi';
import { formatMoney } from '../ledgerFormat';

const TX_TYPES = Object.values(TransactionType).map((v) => ({
  value: v,
  label: getTransactionTypeLabel(v),
}));
const TYPE_FILTER: OptionItem<string>[] = [
  { value: 'all', label: 'All types' },
  ...TX_TYPES,
];
const STATUSES = Object.values(TransactionStatus).map((v) => ({
  value: v,
  label: getTransactionStatusLabel(v),
}));
const STATUS_FILTER: OptionItem<string>[] = [
  { value: 'all', label: 'All statuses' },
  ...STATUSES,
];

function parseDateInputToIso(dateInput: string): string | null {
  const trimmed = dateInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function MobileLedgerTransactionsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageLedger } = usePermissions();
  const [accounts, setAccounts] = useState<ChartOfAccountsResponse[]>([]);
  const [tx, setTx] = useState<LedgerTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [accDebitOpen, setAccDebitOpen] = useState(false);
  const [accCreditOpen, setAccCreditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LedgerTransactionResponse | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [desc, setDesc] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [debitId, setDebitId] = useState('');
  const [creditId, setCreditId] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txType, setTxType] = useState(TransactionType.GENERAL);
  const [txStatus, setTxStatus] = useState(TransactionStatus.PENDING);
  const [refNum, setRefNum] = useState('');
  const [pickTypeOpen, setPickTypeOpen] = useState(false);
  const [pickStatusOpen, setPickStatusOpen] = useState(false);

  const accOpts = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.id,
        label: `${a.account_code} ${a.account_name}`,
      })),
    [accounts],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [coa, list] = await Promise.all([
        getChartOfAccounts(0, 500),
        getLedgerTransactions({
          skip: 0,
          limit: 150,
          transactionType:
            typeFilter === 'all' ? undefined : (typeFilter as TransactionType),
          startDate: undefined,
          endDate: undefined,
        }),
      ]);
      setAccounts(coa ?? []);
      let rows = list ?? [];
      if (statusFilter !== 'all') {
        rows = rows.filter((t) => t.status === statusFilter);
      }
      setTx(rows);
    } catch (e) {
      Alert.alert('Ledger', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/ledger/transactions',
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

  const openCreate = useCallback(() => {
    if (!accounts.length) {
      Alert.alert('Ledger', 'Chart of accounts is empty.');
      return;
    }
    const d = new Date();
    setTxDate(d.toISOString().split('T')[0]);
    setTxType(TransactionType.GENERAL);
    setTxStatus(TransactionStatus.PENDING);
    setDebitId(accounts[0]?.id ?? '');
    setCreditId(accounts[1]?.id ?? accounts[0]?.id ?? '');
    setAmountStr('');
    setDesc('');
    setRefNum('');
    setCreateOpen(true);
  }, [accounts]);

  const openEdit = useCallback((t: LedgerTransactionResponse) => {
    setEditing(t);
    setTxDate(new Date(t.transaction_date).toISOString().split('T')[0]);
    setTxType(t.transaction_type);
    setTxStatus(t.status);
    setDebitId(t.account_id);
    setCreditId(t.contra_account_id);
    setAmountStr(String(t.amount));
    setDesc(t.description);
    setRefNum(t.reference_number ?? '');
    setEditOpen(true);
  }, []);

  const buildCreateBody = useCallback(() => {
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (
      !desc.trim() ||
      !debitId ||
      !creditId ||
      !txDate ||
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      return null;
    }
    const transactionDateIso = parseDateInputToIso(txDate);
    if (!transactionDateIso) {
      return null;
    }
    return {
      description: desc.trim(),
      amount,
      account_id: debitId,
      contra_account_id: creditId,
      transaction_date: transactionDateIso,
      transaction_type: txType,
      status: txStatus,
      reference_number: refNum.trim() || undefined,
    };
  }, [desc, debitId, creditId, txDate, amountStr, txType, txStatus, refNum]);

  const submitCreate = useCallback(async () => {
    const b = buildCreateBody();
    if (!b) {
      Alert.alert('Ledger', 'Fill required fields, valid date, and two accounts.');
      return;
    }
    try {
      setBusy(true);
      await createLedgerTransaction(b);
      setCreateOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Ledger', extractErrorMessage(e, 'Create failed'));
    } finally {
      setBusy(false);
    }
  }, [buildCreateBody, load]);

  const submitEdit = useCallback(async () => {
    if (!editing) return;
    const b = buildCreateBody();
    if (!b) {
      Alert.alert('Ledger', 'Check fields and date format (YYYY-MM-DD).');
      return;
    }
    try {
      setBusy(true);
      await updateLedgerTransaction(editing.id, {
        description: b.description,
        amount: b.amount,
        account_id: b.account_id,
        contra_account_id: b.contra_account_id,
        transaction_date: b.transaction_date,
        transaction_type: b.transaction_type,
        status: b.status,
        reference_number: b.reference_number,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      Alert.alert('Ledger', extractErrorMessage(e, 'Update failed'));
    } finally {
      setBusy(false);
    }
  }, [editing, buildCreateBody, load]);

  const formFields = (
    <>
      <Text className="mb-1 text-xs text-slate-500">Debit account</Text>
      <Pressable
        className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        onPress={() => setAccDebitOpen(true)}
      >
        <Text className="flex-1 text-slate-900" numberOfLines={1}>
          {accOpts.find((o) => o.value === debitId)?.label ?? 'Select'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs text-slate-500">Credit account</Text>
      <Pressable
        className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        onPress={() => setAccCreditOpen(true)}
      >
        <Text className="flex-1 text-slate-900" numberOfLines={1}>
          {accOpts.find((o) => o.value === creditId)?.label ?? 'Select'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs text-slate-500">Date</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
        value={txDate}
        onChangeText={setTxDate}
        placeholder="YYYY-MM-DD"
      />
      <Text className="mb-1 text-xs text-slate-500">Type</Text>
      <Pressable
        className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        onPress={() => setPickTypeOpen(true)}
      >
        <Text>{getTransactionTypeLabel(txType)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs text-slate-500">Status</Text>
      <Pressable
        className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        onPress={() => setPickStatusOpen(true)}
      >
        <Text>{getTransactionStatusLabel(txStatus)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs text-slate-500">Amount</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
        keyboardType="decimal-pad"
        value={amountStr}
        onChangeText={setAmountStr}
      />
      <Text className="mb-1 text-xs text-slate-500">Reference</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
        value={refNum}
        onChangeText={setRefNum}
      />
      <Text className="mb-1 text-xs text-slate-500">Description</Text>
      <TextInput
        className="mb-2 min-h-[72px] rounded-lg border border-slate-200 px-3 py-2"
        value={desc}
        onChangeText={setDesc}
        multiline
      />
    </>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Ledger transactions
        </Text>
        {canManageLedger() ? (
          <Pressable className="px-2 py-1" onPress={openCreate}>
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      <View className="flex-row gap-2 border-b border-slate-200 bg-white px-2 py-2">
        <Pressable
          className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
          onPress={() => setTypeOpen(true)}
        >
          <Text className="text-xs text-slate-900" numberOfLines={1}>
            {TYPE_FILTER.find((o) => o.value === typeFilter)?.label}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#64748b" />
        </Pressable>
        <Pressable
          className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
          onPress={() => setStatusOpen(true)}
        >
          <Text className="text-xs text-slate-900" numberOfLines={1}>
            {STATUS_FILTER.find((o) => o.value === statusFilter)?.label}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#64748b" />
        </Pressable>
      </View>

      {loading && tx.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={tx}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View className="border-b border-slate-100 bg-white px-4 py-3">
              <Text className="font-semibold text-slate-900">{item.description}</Text>
              <Text className="text-xs text-slate-500">
                {item.transaction_number} · {getTransactionTypeLabel(item.transaction_type)} ·{' '}
                {getTransactionStatusLabel(item.status)}
              </Text>
              <Text className="mt-1 text-base font-bold text-slate-900">
                {formatMoney(item.amount)}
              </Text>
              {canManageLedger() ? (
                <View className="mt-2 flex-row gap-3">
                  <Pressable onPress={() => openEdit(item)}>
                    <Text className="font-medium text-blue-600">Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Delete', item.transaction_number, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            void (async () => {
                              try {
                                await deleteLedgerTransaction(item.id);
                                await load();
                              } catch (e) {
                                Alert.alert(
                                  'Ledger',
                                  extractErrorMessage(e, 'Delete failed'),
                                );
                              }
                            })();
                          },
                        },
                      ])
                    }
                  >
                    <Text className="font-medium text-red-600">Delete</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No transactions</Text>
          }
        />
      )}

      <Modal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">
              New transaction
            </Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              {formFields}
            </ScrollView>
            <Pressable
              className="items-center rounded-lg bg-blue-600 py-3"
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
      </Modal>

      <Modal visible={editOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Edit</Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              {formFields}
            </ScrollView>
            <Pressable
              className="items-center rounded-lg bg-blue-600 py-3"
              disabled={busy}
              onPress={() => void submitEdit()}
            >
              <Text className="font-semibold text-white">Save</Text>
            </Pressable>
            <Pressable
              className="mt-2 py-2"
              onPress={() => {
                setEditOpen(false);
                setEditing(null);
              }}
            >
              <Text className="text-center text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <OptionSheet
        visible={typeOpen}
        title="Filter type"
        options={TYPE_FILTER}
        onSelect={(v) => {
          setTypeFilter(v);
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
      <OptionSheet
        visible={statusOpen}
        title="Filter status"
        options={STATUS_FILTER}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />
      <OptionSheet
        visible={accDebitOpen}
        title="Debit account"
        options={accOpts}
        onSelect={(v) => {
          setDebitId(v);
          setAccDebitOpen(false);
        }}
        onClose={() => setAccDebitOpen(false)}
      />
      <OptionSheet
        visible={accCreditOpen}
        title="Credit account"
        options={accOpts}
        onSelect={(v) => {
          setCreditId(v);
          setAccCreditOpen(false);
        }}
        onClose={() => setAccCreditOpen(false)}
      />
      <OptionSheet
        visible={pickTypeOpen}
        title="Type"
        options={TX_TYPES}
        onSelect={(v) => {
          setTxType(v as TransactionType);
          setPickTypeOpen(false);
        }}
        onClose={() => setPickTypeOpen(false)}
      />
      <OptionSheet
        visible={pickStatusOpen}
        title="Status"
        options={STATUSES}
        onSelect={(v) => {
          setTxStatus(v as TransactionStatus);
          setPickStatusOpen(false);
        }}
        onClose={() => setPickStatusOpen(false)}
      />
    </View>
  );
}
