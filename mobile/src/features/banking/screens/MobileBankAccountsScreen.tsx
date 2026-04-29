import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  BankAccountType,
  getAccountTypeLabel,
  type BankAccount,
  type BankAccountCreate,
} from '../../../models/banking';
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccounts,
  updateBankAccount,
} from '../../../services/banking/bankingMobileApi';
import { formatMoney } from '../bankingFormat';
import { AppModal } from '../../../components/layout/AppModal';

const ACCOUNT_TYPES = Object.values(BankAccountType).map((v) => ({
  value: v,
  label: getAccountTypeLabel(v),
}));

export function MobileBankAccountsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageBanking } = usePermissions();

  const [items, setItems] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
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
      const list = await getBankAccounts(true);
      setItems(list ?? []);
    } catch (e) {
      Alert.alert('Accounts', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/banking/accounts',
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.accountName.toLowerCase().includes(q) ||
        a.bankName.toLowerCase().includes(q) ||
        a.accountNumber.includes(q),
    );
  }, [items, search]);

  const openCreate = useCallback(() => {
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
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((a: BankAccount) => {
    setSelected(a);
    setForm({
      accountName: a.accountName,
      accountNumber: a.accountNumber,
      routingNumber: a.routingNumber ?? '',
      bankName: a.bankName,
      bankCode: a.bankCode ?? '',
      accountType: a.accountType,
      currency: a.currency,
      currentBalance: a.currentBalance,
      availableBalance: a.availableBalance,
      pendingBalance: a.pendingBalance,
      isActive: a.isActive,
      isPrimary: a.isPrimary,
      supportsOnlineBanking: a.supportsOnlineBanking,
      description: a.description ?? '',
      tags: a.tags ?? [],
    });
    setEditOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim() || !form.bankName.trim()) {
      Alert.alert('Accounts', 'Name, number, and bank are required.');
      return;
    }
    try {
      setBusy(true);
      await createBankAccount(form);
      setCreateOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Accounts', extractErrorMessage(e, 'Create failed'));
    } finally {
      setBusy(false);
    }
  }, [form, load]);

  const submitEdit = useCallback(async () => {
    if (!selected) return;
    try {
      setBusy(true);
      await updateBankAccount(selected.id, {
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        routingNumber: form.routingNumber || undefined,
        bankName: form.bankName,
        bankCode: form.bankCode || undefined,
        accountType: form.accountType,
        currency: form.currency,
        isActive: form.isActive,
        isPrimary: form.isPrimary,
        supportsOnlineBanking: form.supportsOnlineBanking,
        description: form.description || undefined,
        tags: form.tags,
      });
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('Accounts', extractErrorMessage(e, 'Update failed'));
    } finally {
      setBusy(false);
    }
  }, [selected, form, load]);

  const confirmDelete = useCallback(
    (a: BankAccount) => {
      Alert.alert('Delete account', `Remove "${a.accountName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteBankAccount(a.id);
                await load();
              } catch (e) {
                Alert.alert('Accounts', extractErrorMessage(e, 'Delete failed'));
              }
            })();
          },
        },
      ]);
    },
    [load],
  );

  const formBody = (
    <>
      <Text className="mb-1 text-xs font-medium text-slate-500">Account name</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        value={form.accountName}
        onChangeText={(t) => setForm((f) => ({ ...f, accountName: t }))}
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Account number</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        value={form.accountNumber}
        onChangeText={(t) => setForm((f) => ({ ...f, accountNumber: t }))}
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Bank name</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        value={form.bankName}
        onChangeText={(t) => setForm((f) => ({ ...f, bankName: t }))}
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Routing</Text>
      <TextInput
        className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        value={form.routingNumber ?? ''}
        onChangeText={(t) => setForm((f) => ({ ...f, routingNumber: t }))}
      />
      <Text className="mb-1 text-xs font-medium text-slate-500">Account type</Text>
      <Pressable
        className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
        onPress={() => setTypeOpen(true)}
      >
        <Text className="text-slate-900">{getAccountTypeLabel(form.accountType)}</Text>
        <Ionicons name="chevron-down" size={18} color="#64748b" />
      </Pressable>
      <Text className="mb-1 text-xs font-medium text-slate-500">Description</Text>
      <TextInput
        className="mb-2 min-h-[64px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        value={form.description ?? ''}
        onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
        multiline
      />
      <Pressable
        className="mb-2 flex-row items-center"
        onPress={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
      >
        <Ionicons
          name={form.isActive ? 'checkbox' : 'square-outline'}
          size={22}
          color="#2563eb"
        />
        <Text className="ml-2 text-slate-800">Active</Text>
      </Pressable>
      <Pressable
        className="mb-2 flex-row items-center"
        onPress={() => setForm((f) => ({ ...f, isPrimary: !f.isPrimary }))}
      >
        <Ionicons
          name={form.isPrimary ? 'checkbox' : 'square-outline'}
          size={22}
          color="#2563eb"
        />
        <Text className="ml-2 text-slate-800">Primary</Text>
      </Pressable>
      <Pressable
        className="mb-2 flex-row items-center"
        onPress={() =>
          setForm((f) => ({ ...f, supportsOnlineBanking: !f.supportsOnlineBanking }))
        }
      >
        <Ionicons
          name={form.supportsOnlineBanking ? 'checkbox' : 'square-outline'}
          size={22}
          color="#2563eb"
        />
        <Text className="ml-2 text-slate-800">Online banking</Text>
      </Pressable>
    </>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Bank accounts
        </Text>
        {canManageBanking() ? (
          <Pressable className="px-2 py-1" onPress={openCreate}>
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <View className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-2">
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            className="flex-1 py-2 pl-2 text-slate-900"
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading && items.length === 0 ? (
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
              <Text className="text-base font-semibold text-slate-900">
                {item.accountName}
              </Text>
              <Text className="text-sm text-slate-600">{item.bankName}</Text>
              <Text className="mt-1 text-xs text-slate-500">
                {getAccountTypeLabel(item.accountType)} · {item.accountNumber}
              </Text>
              <Text className="mt-2 font-medium text-slate-800">
                {formatMoney(item.currentBalance, item.currency)}
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
            <Text className="py-8 text-center text-slate-500">No accounts</Text>
          }
        />
      )}

      <AppModal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">New account</Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              {formBody}
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

      <AppModal visible={editOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Edit account</Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              {formBody}
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
                setSelected(null);
              }}
            >
              <Text className="text-center text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <OptionSheet
        visible={typeOpen}
        title="Account type"
        options={ACCOUNT_TYPES}
        onSelect={(v) => {
          setForm((f) => ({ ...f, accountType: v as BankAccountType }));
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
    </View>
  );
}
