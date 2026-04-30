import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
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
  PaymentMethod,
  TransactionStatus,
  TransactionType,
  getPaymentMethodLabel,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
  type BankAccount,
  type BankTransaction,
} from '../../../models/banking';
import {
  createBankTransaction,
  deleteBankTransaction,
  getBankAccounts,
  getBankTransactions,
  updateBankTransaction,
} from '../../../services/banking/bankingMobileApi';
import { formatMoney } from '../bankingFormat';
import { AppModal } from '../../../components/layout/AppModal';

const TX_TYPES = Object.values(TransactionType).map((v) => ({
  value: v,
  label: getTransactionTypeLabel(v),
}));
const TX_STATUSES = Object.values(TransactionStatus).map((v) => ({
  value: v,
  label: getTransactionStatusLabel(v),
}));
const PAY_METHODS = Object.values(PaymentMethod).map((v) => ({
  value: v,
  label: getPaymentMethodLabel(v),
}));

const TYPE_FILTER_OPTIONS: OptionItem<string>[] = [
  { value: 'all', label: 'All types' },
  ...TX_TYPES,
];

const STATUS_FILTER_OPTIONS: OptionItem<string>[] = [
  { value: 'all', label: 'All statuses' },
  ...TX_STATUSES,
];

function parseDateInputToIso(dateInput: string): string | null {
  const trimmed = dateInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function MobileBankTransactionsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageBanking } = usePermissions();

  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [accountFilter, setAccountFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filterAccountOpen, setFilterAccountOpen] = useState(false);
  const [formAccountOpen, setFormAccountOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<BankTransaction | null>(null);
  const [busy, setBusy] = useState(false);

  const [bankAccountId, setBankAccountId] = useState('');
  const [txDate, setTxDate] = useState('');
  const [txType, setTxType] = useState(TransactionType.DEPOSIT);
  const [txStatus, setTxStatus] = useState(TransactionStatus.PENDING);
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState(PaymentMethod.CASH);
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [typePickOpen, setTypePickOpen] = useState(false);
  const [statusPickOpen, setStatusPickOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [tx, acc] = await Promise.all([
        getBankTransactions({
          limit: 200,
          accountId:
            accountFilter === 'all' ? undefined : accountFilter,
          transactionType:
            typeFilter === 'all' ? undefined : (typeFilter as TransactionType),
          status:
            statusFilter === 'all' ? undefined : (statusFilter as TransactionStatus),
        }),
        getBankAccounts(true),
      ]);
      setTransactions(tx ?? []);
      setAccounts(acc ?? []);
    } catch (e) {
      Alert.alert('Transactions', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [accountFilter, typeFilter, statusFilter]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/banking/transactions',
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

  const formAccountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.id,
        label: `${a.accountName} (${a.bankName})`,
      })),
    [accounts],
  );

  const openCreate = useCallback(() => {
    if (!accounts.length) {
      Alert.alert('Transactions', 'Create a bank account first.');
      return;
    }
    const d = new Date();
    setBankAccountId(accounts[0]?.id ?? '');
    setTxDate(d.toISOString().split('T')[0]);
    setTxType(TransactionType.DEPOSIT);
    setTxStatus(TransactionStatus.PENDING);
    setAmountStr('');
    setCurrency('USD');
    setPaymentMethod(PaymentMethod.CASH);
    setDescription('');
    setReference('');
    setCreateOpen(true);
  }, [accounts]);

  const openEdit = useCallback((t: BankTransaction) => {
    setEditing(t);
    setBankAccountId(t.bankAccountId);
    setTxDate(new Date(t.transactionDate).toISOString().split('T')[0]);
    setTxType(t.transactionType);
    setTxStatus(t.status);
    setAmountStr(String(t.amount));
    setCurrency(t.currency);
    setPaymentMethod(t.paymentMethod ?? PaymentMethod.CASH);
    setDescription(t.description);
    setReference(t.referenceNumber ?? '');
    setEditOpen(true);
  }, []);

  const buildPayload = useCallback(() => {
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (!bankAccountId || !txDate || !description.trim() || Number.isNaN(amount) || amount <= 0) {
      return null;
    }
    const transactionDate = parseDateInputToIso(txDate);
    if (!transactionDate) {
      return null;
    }
    return {
      bankAccountId,
      transactionDate,
      transactionType: txType,
      status: txStatus,
      amount,
      runningBalance: 0,
      currency,
      exchangeRate: 1,
      baseAmount: amount,
      paymentMethod,
      referenceNumber: reference.trim() || undefined,
      description: description.trim(),
    };
  }, [
    bankAccountId,
    txDate,
    txType,
    txStatus,
    amountStr,
    currency,
    paymentMethod,
    reference,
    description,
  ]);

  const submitCreate = useCallback(async () => {
    const p = buildPayload();
    if (!p) {
      Alert.alert('Transactions', 'Account, valid date (YYYY-MM-DD), description, and amount are required.');
      return;
    }
    try {
      setBusy(true);
      await createBankTransaction(p);
      setCreateOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Transactions', extractErrorMessage(e, 'Create failed'));
    } finally {
      setBusy(false);
    }
  }, [buildPayload, load]);

  const submitEdit = useCallback(async () => {
    if (!editing) return;
    const p = buildPayload();
    if (!p) {
      Alert.alert('Transactions', 'Check required fields and date format YYYY-MM-DD.');
      return;
    }
    try {
      setBusy(true);
      await updateBankTransaction(editing.id, {
        transactionDate: p.transactionDate,
        transactionType: p.transactionType,
        status: p.status,
        amount: p.amount,
        currency: p.currency,
        exchangeRate: p.exchangeRate,
        baseAmount: p.baseAmount,
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber,
        description: p.description,
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      Alert.alert('Transactions', extractErrorMessage(e, 'Update failed'));
    } finally {
      setBusy(false);
    }
  }, [editing, buildPayload, load]);

  const confirmDelete = useCallback(
    (t: BankTransaction) => {
      Alert.alert('Delete', `Remove transaction ${t.transactionNumber}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteBankTransaction(t.id);
                await load();
              } catch (e) {
                Alert.alert('Transactions', extractErrorMessage(e, 'Delete failed'));
              }
            })();
          },
        },
      ]);
    },
    [load],
  );

  const formFields = (
    <>
      <Text className="mb-1 text-xs font-medium text-slate-500">Account</Text>
      <Pressable
        className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        onPress={() => setFormAccountOpen(true)}
      >
        <Text className="text-slate-900">
          {accounts.find((a) => a.id === bankAccountId)?.accountName ?? 'Select'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Date</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        placeholder="YYYY-MM-DD"
        value={txDate}
        onChangeText={setTxDate}
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Type</Text>
      <Pressable
        className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        onPress={() => setTypePickOpen(true)}
      >
        <Text className="text-slate-900">{getTransactionTypeLabel(txType)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Status</Text>
      <Pressable
        className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        onPress={() => setStatusPickOpen(true)}
      >
        <Text className="text-slate-900">{getTransactionStatusLabel(txStatus)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Amount</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        keyboardType="decimal-pad"
        value={amountStr}
        onChangeText={setAmountStr}
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Currency</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        value={currency}
        onChangeText={setCurrency}
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Payment method</Text>
      <Pressable
        className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        onPress={() => setPayOpen(true)}
      >
        <Text className="text-slate-900">{getPaymentMethodLabel(paymentMethod)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Reference</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        value={reference}
        onChangeText={setReference}
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Description</Text>
      <TextInput
        className="mb-2 min-h-[72px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        value={description}
        onChangeText={setDescription}
        multiline
      />
    </>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Transactions
        </Text>
        {canManageBanking() ? (
          <Pressable className="px-2 py-1" onPress={openCreate}>
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      <View className="gap-2 border-b border-slate-200 bg-white px-2 py-2">
        <Pressable
          className="flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
          onPress={() => setFilterAccountOpen(true)}
        >
          <Text className="flex-1 text-sm text-slate-900" numberOfLines={1}>
            {filterAccountOptions.find((o) => o.value === accountFilter)?.label}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#64748b" />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
            onPress={() => setTypeOpen(true)}
          >
            <Text className="text-xs text-slate-900" numberOfLines={1}>
              {typeFilter === 'all' ? 'All types' : getTransactionTypeLabel(typeFilter as TransactionType)}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#64748b" />
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
            onPress={() => setStatusOpen(true)}
          >
            <Text className="text-xs text-slate-900" numberOfLines={1}>
              {statusFilter === 'all'
                ? 'All statuses'
                : getTransactionStatusLabel(statusFilter as TransactionStatus)}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {loading && transactions.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View className="border-b border-slate-100 bg-white px-4 py-3">
              <Text className="font-semibold text-slate-900">{item.description}</Text>
              <Text className="text-xs text-slate-500">
                {item.transactionNumber} · {getTransactionTypeLabel(item.transactionType)} ·{' '}
                {getTransactionStatusLabel(item.status)}
              </Text>
              <Text className="mt-1 text-sm text-slate-700">
                {new Date(item.transactionDate).toLocaleString()}
              </Text>
              <Text className="mt-1 text-base font-bold text-slate-900">
                {formatMoney(item.amount, item.currency)}
              </Text>
              {canManageBanking() ? (
                <View className="mt-2 flex-row gap-3">
                  <Pressable onPress={() => openEdit(item)}>
                    <Text className="font-medium text-blue-600">Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(item)}>
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

      <AppModal
        visible={createOpen}
        animationType="slide"
        transparent
        onClose={() => setCreateOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">New transaction</Text>
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
      </AppModal>

      <AppModal
        visible={editOpen}
        animationType="slide"
        transparent
        onClose={() => setEditOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Edit transaction</Text>
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
      </AppModal>

      <OptionSheet
        visible={filterAccountOpen}
        title="Filter by account"
        options={filterAccountOptions}
        onSelect={(v) => {
          setAccountFilter(v);
          setFilterAccountOpen(false);
        }}
        onClose={() => setFilterAccountOpen(false)}
      />
      <OptionSheet
        visible={formAccountOpen}
        title="Account"
        options={formAccountOptions}
        onSelect={(v) => {
          setBankAccountId(v);
          setFormAccountOpen(false);
        }}
        onClose={() => setFormAccountOpen(false)}
      />

      <OptionSheet
        visible={typeOpen}
        title="Type"
        options={TYPE_FILTER_OPTIONS}
        onSelect={(v) => {
          setTypeFilter(v);
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={STATUS_FILTER_OPTIONS}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />
      <OptionSheet
        visible={typePickOpen}
        title="Transaction type"
        options={TX_TYPES}
        onSelect={(v) => {
          setTxType(v as TransactionType);
          setTypePickOpen(false);
        }}
        onClose={() => setTypePickOpen(false)}
      />
      <OptionSheet
        visible={statusPickOpen}
        title="Status"
        options={TX_STATUSES}
        onSelect={(v) => {
          setTxStatus(v as TransactionStatus);
          setStatusPickOpen(false);
        }}
        onClose={() => setStatusPickOpen(false)}
      />
      <OptionSheet
        visible={payOpen}
        title="Payment method"
        options={PAY_METHODS}
        onSelect={(v) => {
          setPaymentMethod(v as PaymentMethod);
          setPayOpen(false);
        }}
        onClose={() => setPayOpen(false)}
      />
    </View>
  );
}
