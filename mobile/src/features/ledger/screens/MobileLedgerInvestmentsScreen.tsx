import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet, type OptionItem } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  approveInvestment,
  createInvestment,
  deleteInvestment,
  getInvestmentDashboardStats,
  getInvestments,
  updateInvestment,
  type InvestmentRow,
  type InvestmentTypeCode,
} from '../../../services/ledger/investmentsMobileApi';
import { formatMoney } from '../ledgerFormat';
import { AppModal } from '../../../components/layout/AppModal';

const TYPES: OptionItem<InvestmentTypeCode>[] = [
  { value: 'cash_investment', label: 'Cash investment' },
  { value: 'card_transfer', label: 'Card transfer' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'equipment_purchase', label: 'Equipment' },
];

const STATUSES: OptionItem<string>[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

function parseDateInputToIso(dateInput: string): string | null {
  const trimmed = dateInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function MobileLedgerInvestmentsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageLedger } = usePermissions();
  const [rows, setRows] = useState<InvestmentRow[]>([]);
  const [stats, setStats] = useState<Awaited<
    ReturnType<typeof getInvestmentDashboardStats>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusOpen, setStatusOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [invDate, setInvDate] = useState('');
  const [invType, setInvType] = useState<InvestmentTypeCode>('cash_investment');
  const [typeOpen, setTypeOpen] = useState(false);
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [desc, setDesc] = useState('');
  const [notes, setNotes] = useState('');
  const [refNum, setRefNum] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [list, st] = await Promise.all([
        getInvestments({
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        getInvestmentDashboardStats().catch(() => null),
      ]);
      setRows(list.investments);
      setStats(st);
    } catch (e) {
      Alert.alert('Investments', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/ledger/investments',
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
    const d = new Date();
    setInvDate(d.toISOString().split('T')[0]);
    setInvType('cash_investment');
    setAmountStr('');
    setCurrency('USD');
    setDesc('');
    setNotes('');
    setRefNum('');
    setCreateOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    const amount = parseFloat(amountStr.replace(',', '.'));
    const investmentDateIso = parseDateInputToIso(invDate);
    if (!invDate || !desc.trim() || Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Investments', 'Date, description, and valid amount are required.');
      return;
    }
    if (!investmentDateIso) {
      Alert.alert('Investments', 'Use valid date format YYYY-MM-DD.');
      return;
    }
    try {
      setBusy(true);
      await createInvestment({
        investment_date: investmentDateIso,
        investment_type: invType,
        amount,
        currency,
        description: desc.trim(),
        notes: notes.trim() || undefined,
        reference_number: refNum.trim() || undefined,
      });
      setCreateOpen(false);
      await load();
    } catch (e) {
      Alert.alert('Investments', extractErrorMessage(e, 'Create failed'));
    } finally {
      setBusy(false);
    }
  }, [invDate, invType, amountStr, currency, desc, notes, refNum, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.description.toLowerCase().includes(q) ||
        r.investment_number.toLowerCase().includes(q) ||
        (r.reference_number ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Investments
        </Text>
        {canManageLedger() ? (
          <Pressable className="px-2 py-1" onPress={openCreate}>
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      {stats ? (
        <ScrollView
          horizontal
          className="max-h-[100px] border-b border-slate-200 bg-white py-2"
          showsHorizontalScrollIndicator={false}
        >
          <View className="flex-row gap-2 px-2">
            <MiniStat label="Total" value={String(stats.total_investments)} />
            <MiniStat
              label="Amount"
              value={formatMoney(stats.total_amount)}
            />
            <MiniStat label="Pending" value={String(stats.pending_investments)} />
            <MiniStat
              label="Completed"
              value={String(stats.completed_investments)}
            />
          </View>
        </ScrollView>
      ) : null}

      <View className="gap-2 border-b border-slate-200 bg-white px-2 py-2">
        <TextInput
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
        />
        <Pressable
          className="flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
          onPress={() => setStatusOpen(true)}
        >
          <Text className="text-sm text-slate-900">
            {STATUSES.find((s) => s.value === statusFilter)?.label}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#64748b" />
        </Pressable>
      </View>

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
              <Text className="font-semibold text-slate-900">{item.description}</Text>
              <Text className="text-xs text-slate-500">
                {item.investment_number} · {item.investment_type.replace(/_/g, ' ')} ·{' '}
                {item.status}
              </Text>
              <Text className="mt-1 text-base font-bold text-slate-900">
                {formatMoney(item.amount, item.currency || 'USD')}
              </Text>
              {canManageLedger() ? (
                <View className="mt-2 flex-row flex-wrap gap-3">
                  {item.status === 'pending' ? (
                    <Pressable
                      onPress={() => {
                        void (async () => {
                          try {
                            await approveInvestment(item.id);
                            await load();
                          } catch (e) {
                            Alert.alert(
                              'Investments',
                              extractErrorMessage(e, 'Approve failed'),
                            );
                          }
                        })();
                      }}
                    >
                      <Text className="font-medium text-blue-600">Approve</Text>
                    </Pressable>
                  ) : null}
                  {item.status === 'pending' ? (
                    <Pressable
                      onPress={() => {
                        void (async () => {
                          try {
                            await updateInvestment(item.id, {
                              status: 'cancelled',
                            });
                            await load();
                          } catch (e) {
                            Alert.alert(
                              'Investments',
                              extractErrorMessage(e, 'Update failed'),
                            );
                          }
                        })();
                      }}
                    >
                      <Text className="font-medium text-amber-700">Cancel</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => {
                      Alert.alert('Delete', item.investment_number, [
                        { text: 'No', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            void (async () => {
                              try {
                                await deleteInvestment(item.id);
                                await load();
                              } catch (e) {
                                Alert.alert(
                                  'Investments',
                                  extractErrorMessage(e, 'Delete failed'),
                                );
                              }
                            })();
                          },
                        },
                      ]);
                    }}
                  >
                    <Text className="font-medium text-red-600">Delete</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No investments</Text>
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
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">
              New investment
            </Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              <Text className="mb-1 text-xs text-slate-500">Date</Text>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={invDate}
                onChangeText={setInvDate}
                placeholder="YYYY-MM-DD"
              />
              <Text className="mb-1 text-xs text-slate-500">Type</Text>
              <Pressable
                className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                onPress={() => setTypeOpen(true)}
              >
                <Text>{TYPES.find((t) => t.value === invType)?.label}</Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </Pressable>
              <Text className="mb-1 text-xs text-slate-500">Amount</Text>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                keyboardType="decimal-pad"
                value={amountStr}
                onChangeText={setAmountStr}
              />
              <Text className="mb-1 text-xs text-slate-500">Currency</Text>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={currency}
                onChangeText={setCurrency}
              />
              <Text className="mb-1 text-xs text-slate-500">Description</Text>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={desc}
                onChangeText={setDesc}
              />
              <Text className="mb-1 text-xs text-slate-500">Reference</Text>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={refNum}
                onChangeText={setRefNum}
              />
              <Text className="mb-1 text-xs text-slate-500">Notes</Text>
              <TextInput
                className="mb-2 min-h-[64px] rounded-lg border border-slate-200 px-3 py-2"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
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

      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={STATUSES}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />
      <OptionSheet
        visible={typeOpen}
        title="Type"
        options={TYPES}
        onSelect={(v) => {
          setInvType(v);
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[120px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className="text-sm font-semibold text-slate-900">{value}</Text>
    </View>
  );
}
