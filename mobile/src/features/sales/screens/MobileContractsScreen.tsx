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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { fetchOpportunitiesPaged } from '../../../services/crm/opportunitiesApi';
import type { Opportunity } from '../../../models/crm';
import {
  ContractStatus,
  type Contract,
  type ContractCreatePayload,
} from '../../../models/sales';
import {
  fetchContractsPaged,
  createContractApi,
  updateContractApi,
  deleteContractApi,
} from '../../../services/sales/salesApi';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  FormInput,
  FormSection,
  FormSelect,
  MobileFormSheet,
} from '../../../components/layout/MobileForm';

const PAGE_SIZE = 15;
const STATUS_FILTER: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  ...Object.values(ContractStatus).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' '),
  })),
];

export function MobileContractsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageSales } = usePermissions();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusOpen, setStatusOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [viewing, setViewing] = useState<Contract | null>(null);

  const [oppPickerOpen, setOppPickerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewalTerms, setRenewalTerms] = useState('');

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;

  const loadOpportunities = useCallback(async () => {
    try {
      const res = await fetchOpportunitiesPaged({}, 1, 200);
      setOpportunities(res.opportunities ?? []);
    } catch {
      setOpportunities([]);
    }
  }, []);

  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchContractsPaged(page, PAGE_SIZE, statusParam);
      setContracts(res.contracts ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
    } catch (e) {
      Alert.alert('Contracts', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [page, statusParam]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/contracts',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadOpportunities(), loadContracts()]);
    setRefreshing(false);
  }, [loadOpportunities, loadContracts]);

  const oppLabel = useMemo(() => {
    const o = opportunities.find((x) => x.id === opportunityId);
    return o?.title ?? 'Select opportunity';
  }, [opportunities, opportunityId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOpportunityId('');
    setStartDate('');
    setEndDate('');
    setValueStr('');
    setTerms('');
    setNotes('');
    setAutoRenew(false);
    setRenewalTerms('');
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const val = parseFloat(valueStr);
    if (!title.trim() || !opportunityId || !startDate || !endDate || Number.isNaN(val)) {
      Alert.alert('Contracts', 'Title, opportunity, dates, and value are required.');
      return;
    }
    const payload: ContractCreatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      opportunityId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      value: val,
      terms: terms.trim() || undefined,
      notes: notes.trim() || undefined,
      autoRenew,
      renewalTerms: renewalTerms.trim() || undefined,
    };
    try {
      await createContractApi(payload);
      setCreateOpen(false);
      resetForm();
      await loadContracts();
    } catch (e) {
      Alert.alert('Contracts', extractErrorMessage(e, 'Failed to create'));
    }
  };

  const openEdit = (c: Contract) => {
    setEditing(c);
    setTitle(c.title);
    setDescription(c.description ?? '');
    setStartDate(c.startDate ? c.startDate.slice(0, 10) : '');
    setEndDate(c.endDate ? c.endDate.slice(0, 10) : '');
    setValueStr(String(c.value));
    setTerms(c.terms ?? '');
    setNotes(c.notes ?? '');
    setAutoRenew(Boolean(c.autoRenew));
    setRenewalTerms(c.renewalTerms ?? '');
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const val = parseFloat(valueStr);
    if (!title.trim() || !startDate || !endDate || Number.isNaN(val)) {
      Alert.alert('Contracts', 'Title, dates, and value are required.');
      return;
    }
    try {
      await updateContractApi(editing.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        value: val,
        terms: terms.trim() || undefined,
        notes: notes.trim() || undefined,
        autoRenew,
        renewalTerms: renewalTerms.trim() || undefined,
      });
      setEditOpen(false);
      setEditing(null);
      await loadContracts();
    } catch (e) {
      Alert.alert('Contracts', extractErrorMessage(e, 'Failed to update'));
    }
  };

  const confirmDelete = (c: Contract) => {
    Alert.alert('Delete contract', `Remove ${c.contractNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void handleDelete(c.id),
      },
    ]);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContractApi(id);
      await loadContracts();
    } catch (e) {
      Alert.alert('Contracts', extractErrorMessage(e, 'Failed to delete'));
    }
  };

  const opportunityName = (id?: string) => {
    if (!id) return '—';
    return opportunities.find((o) => o.id === id)?.title ?? id.slice(0, 8);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Contracts
        </Text>
        {canManageSales() ? (
          <Pressable
            onPress={openCreate}
            className="rounded-lg bg-blue-600 px-3 py-2 active:bg-blue-700"
          >
            <Text className="font-semibold text-white">New</Text>
          </Pressable>
        ) : (
          <View className="w-14" />
        )}
      </View>

      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <Pressable
          onPress={() => setStatusOpen(true)}
          className="flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <Text className="text-slate-700">
            {STATUS_FILTER.find((x) => x.value === statusFilter)?.label}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#64748b" />
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No contracts</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setViewing(item);
                setViewOpen(true);
              }}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-4 active:bg-slate-50"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-2">
                  <Text className="font-semibold text-slate-900">
                    {item.contractNumber}
                  </Text>
                  <Text className="mt-1 text-base text-slate-800">{item.title}</Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {opportunityName(item.opportunityId)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-semibold text-slate-900">
                    {formatUsd(item.value)}
                  </Text>
                  <Text className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {String(item.status)}
                  </Text>
                </View>
              </View>
              <View className="mt-3 flex-row flex-wrap gap-2 border-t border-slate-100 pt-3">
                {canManageSales() ? (
                  <>
                    <Pressable
                      onPress={() => openEdit(item)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5"
                    >
                      <Text className="text-sm font-medium text-slate-800">Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDelete(item)}
                      className="rounded-lg bg-red-50 px-3 py-1.5"
                    >
                      <Text className="text-sm font-medium text-red-700">Delete</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}

      <View className="flex-row items-center justify-center border-t border-slate-200 bg-white py-2">
        <Pressable
          disabled={page <= 1}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 opacity-100 disabled:opacity-40"
        >
          <Text className="font-medium text-blue-600">Prev</Text>
        </Pressable>
        <Text className="text-slate-600">
          {page} / {totalPages}
        </Text>
        <Pressable
          disabled={page >= totalPages}
          onPress={() => setPage((p) => p + 1)}
          className="px-4 py-2 opacity-100 disabled:opacity-40"
        >
          <Text className="font-medium text-blue-600">Next</Text>
        </Pressable>
      </View>

      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={STATUS_FILTER}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
          setPage(1);
        }}
        onClose={() => setStatusOpen(false)}
      />

      <Modal visible={oppPickerOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[70%] rounded-t-2xl bg-white p-4">
            <Text className="mb-3 text-lg font-semibold text-slate-900">
              Opportunity
            </Text>
            <FlatList
              data={opportunities}
              keyExtractor={(o) => o.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setOpportunityId(item.id);
                    setOppPickerOpen(false);
                  }}
                  className="border-b border-slate-100 py-3"
                >
                  <Text className="font-medium text-slate-900">{item.title}</Text>
                </Pressable>
              )}
            />
            <Pressable
              onPress={() => setOppPickerOpen(false)}
              className="mt-2 items-center py-3"
            >
              <Text className="font-medium text-blue-600">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <MobileFormSheet
        visible={createOpen}
        title="New Contract"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
        saveLabel="Create"
      >
            <FormSection title="General Information">
              <FormInput
                label="Contract Title"
                icon="document-text-outline"
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Annual Maintenance Contract"
              />
              <FormSelect
                label="Related Opportunity"
                icon="briefcase-outline"
                value={opportunityId ? opportunities.find(o => o.id === opportunityId)?.title || '' : ''}
                onPress={() => setOppPickerOpen(true)}
                last
              />
            </FormSection>

            <FormSection title="Financials & Dates">
              <FormInput
                label="Contract Value"
                icon="cash-outline"
                value={valueStr}
                onChangeText={setValueStr}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              <FormInput
                label="Start Date"
                icon="calendar-outline"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
              <FormInput
                label="End Date"
                icon="calendar-outline"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                last
              />
            </FormSection>

            <FormSection title="Renewal Policy">
              <View className="px-4 py-3 flex-row items-center justify-between border-b border-slate-50">
                <View className="flex-row items-center">
                  <Ionicons name="refresh-outline" size={14} color="#94a3b8" className="mr-1" />
                  <Text className="text-[11px] font-semibold text-slate-500 uppercase">Auto Renew</Text>
                </View>
                <Switch 
                  value={autoRenew} 
                  onValueChange={setAutoRenew}
                  trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
                  thumbColor={autoRenew ? '#2563eb' : '#f8fafc'}
                />
              </View>
              {autoRenew && (
                <FormInput
                  label="Renewal Terms"
                  value={renewalTerms}
                  onChangeText={setRenewalTerms}
                  multiline
                  placeholder="Terms for automatic renewal..."
                  last
                />
              )}
            </FormSection>

            <FormSection title="Details & Notes">
              <FormInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Detailed contract description..."
              />
              <FormInput
                label="Terms & Conditions"
                value={terms}
                onChangeText={setTerms}
                multiline
                placeholder="Standard terms..."
              />
              <FormInput
                label="Internal Notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Private notes for team..."
                last
              />
            </FormSection>
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit Contract"
        onCancel={() => setEditOpen(false)}
        onSave={() => void submitEdit()}
      >
            <FormSection title="General Information">
              <FormInput
                label="Contract Title"
                icon="document-text-outline"
                value={title}
                onChangeText={setTitle}
              />
              <FormSelect
                label="Opportunity"
                icon="briefcase-outline"
                value={opportunityId ? opportunities.find(o => o.id === opportunityId)?.title || '' : ''}
                onPress={() => setOppPickerOpen(true)}
                last
              />
            </FormSection>

            <FormSection title="Financials & Dates">
              <FormInput
                label="Contract Value"
                icon="cash-outline"
                value={valueStr}
                onChangeText={setValueStr}
                keyboardType="decimal-pad"
              />
              <FormInput
                label="Start Date"
                icon="calendar-outline"
                value={startDate}
                onChangeText={setStartDate}
              />
              <FormInput
                label="End Date"
                icon="calendar-outline"
                value={endDate}
                onChangeText={setEndDate}
                last
              />
            </FormSection>

            <FormSection title="Renewal Policy">
              <View className="px-4 py-3 flex-row items-center justify-between border-b border-slate-50">
                <View className="flex-row items-center">
                  <Ionicons name="refresh-outline" size={14} color="#94a3b8" className="mr-1" />
                  <Text className="text-[11px] font-semibold text-slate-500 uppercase">Auto Renew</Text>
                </View>
                <Switch 
                  value={autoRenew} 
                  onValueChange={setAutoRenew}
                  trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
                  thumbColor={autoRenew ? '#2563eb' : '#f8fafc'}
                />
              </View>
              {autoRenew && (
                <FormInput
                  label="Renewal Terms"
                  value={renewalTerms}
                  onChangeText={setRenewalTerms}
                  multiline
                  last
                />
              )}
            </FormSection>

            <FormSection title="Details & Notes">
              <FormInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <FormInput
                label="Terms & Conditions"
                value={terms}
                onChangeText={setTerms}
                multiline
              />
              <FormInput
                label="Internal Notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                last
              />
            </FormSection>
      </MobileFormSheet>

      <Modal visible={viewOpen} animationType="fade" transparent>
        <View className="flex-1 justify-center bg-black/40 px-4">
          <View className="max-h-[80%] rounded-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Contract</Text>
            {viewing ? (
              <ScrollView className="mt-3">
                <Text className="text-slate-600">{viewing.contractNumber}</Text>
                <Text className="mt-2 text-xl font-semibold text-slate-900">
                  {viewing.title}
                </Text>
                <Text className="mt-2 text-slate-700">
                  {formatUsd(viewing.value)} · {String(viewing.status)}
                </Text>
                <Text className="mt-2 text-slate-600">
                  Opportunity: {opportunityName(viewing.opportunityId)}
                </Text>
              </ScrollView>
            ) : null}
            <Pressable
              onPress={() => setViewOpen(false)}
              className="mt-4 items-center rounded-lg bg-slate-100 py-3"
            >
              <Text className="font-semibold text-slate-800">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
