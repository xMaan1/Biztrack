import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { fetchOpportunitiesPaged } from '../../../services/crm/opportunitiesApi';
import type { Opportunity } from '../../../models/crm';
import {
  QuoteStatus,
  type Quote,
  type QuoteCreatePayload,
} from '../../../models/sales';
import {
  fetchQuotesPaged,
  createQuoteApi,
  updateQuoteApi,
  deleteQuoteApi,
} from '../../../services/sales/salesApi';
import { usePermissions } from '../../../hooks/usePermissions';
import { AppModal } from '../../../components/layout/AppModal';
import {
  FormInput,
  FormSection,
  FormSelect,
  MobileFormSheet,
} from '../../../components/layout/MobileForm';

const PAGE_SIZE = 15;
const STATUS_FILTER: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  ...Object.values(QuoteStatus).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' '),
  })),
];

function quoteTotal(q: Quote): number {
  if (typeof q.total === 'number') return q.total;
  if (typeof q.amount === 'number') return q.amount;
  return 0;
}

export function MobileQuotesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageSales } = usePermissions();

  const [quotes, setQuotes] = useState<Quote[]>([]);
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
  const [editing, setEditing] = useState<Quote | null>(null);
  const [viewing, setViewing] = useState<Quote | null>(null);

  const [oppPickerOpen, setOppPickerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opportunityId, setOpportunityId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;

  const loadOpportunities = useCallback(async () => {
    try {
      const res = await fetchOpportunitiesPaged({}, 1, 200);
      setOpportunities(res.opportunities ?? []);
    } catch {
      setOpportunities([]);
    }
  }, []);

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchQuotesPaged(page, PAGE_SIZE, statusParam);
      setQuotes(res.quotes ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
    } catch (e) {
      Alert.alert('Quotes', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [page, statusParam]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/quotes',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadOpportunities(), loadQuotes()]);
    setRefreshing(false);
  }, [loadOpportunities, loadQuotes]);

  const oppLabel = useMemo(() => {
    const o = opportunities.find((x) => x.id === opportunityId);
    return o?.title ?? 'Select opportunity';
  }, [opportunities, opportunityId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOpportunityId('');
    setValidUntil('');
    setAmountStr('');
    setTerms('');
    setNotes('');
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const amt = parseFloat(amountStr);
    if (!title.trim() || !opportunityId || !validUntil.trim() || Number.isNaN(amt)) {
      Alert.alert('Quotes', 'Title, opportunity, valid until, and amount are required.');
      return;
    }
    const payload: QuoteCreatePayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      opportunityId,
      validUntil: new Date(validUntil).toISOString(),
      terms: terms.trim() || undefined,
      notes: notes.trim() || undefined,
      items: [
        {
          description: title.trim(),
          quantity: 1,
          unitPrice: amt,
          discount: 0,
          total: amt,
        },
      ],
      subtotal: amt,
      taxRate: 0,
      taxAmount: 0,
      total: amt,
    };
    try {
      await createQuoteApi(payload);
      setCreateOpen(false);
      resetForm();
      await loadQuotes();
    } catch (e) {
      Alert.alert('Quotes', extractErrorMessage(e, 'Failed to create'));
    }
  };

  const openEdit = (q: Quote) => {
    setEditing(q);
    setTitle(q.title);
    setDescription(q.description ?? '');
    setOpportunityId(q.opportunityId ?? '');
    setValidUntil(q.validUntil ? q.validUntil.slice(0, 10) : '');
    setAmountStr(String(quoteTotal(q)));
    setTerms(q.terms ?? '');
    setNotes(q.notes ?? '');
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing) return;
    const amt = parseFloat(amountStr);
    if (!title.trim() || !validUntil.trim() || Number.isNaN(amt)) {
      Alert.alert('Quotes', 'Title, valid until, and amount are required.');
      return;
    }
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      validUntil: new Date(validUntil).toISOString(),
      terms: terms.trim() || undefined,
      notes: notes.trim() || undefined,
      subtotal: amt,
      taxRate: 0,
      taxAmount: 0,
      total: amt,
      items: [
        {
          description: title.trim(),
          quantity: 1,
          unitPrice: amt,
          discount: 0,
          total: amt,
        },
      ],
    };
    try {
      await updateQuoteApi(editing.id, payload);
      setEditOpen(false);
      setEditing(null);
      await loadQuotes();
    } catch (e) {
      Alert.alert('Quotes', extractErrorMessage(e, 'Failed to update'));
    }
  };

  const confirmDelete = (q: Quote) => {
    Alert.alert('Delete quote', `Remove ${q.quoteNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void handleDelete(q.id),
      },
    ]);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuoteApi(id);
      await loadQuotes();
    } catch (e) {
      Alert.alert('Quotes', extractErrorMessage(e, 'Failed to delete'));
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
          Quotes
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
          data={quotes}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No quotes</Text>
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
                    {item.quoteNumber}
                  </Text>
                  <Text className="mt-1 text-base text-slate-800">{item.title}</Text>
                  <Text className="mt-1 text-sm text-slate-500">
                    {opportunityName(item.opportunityId)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="font-semibold text-slate-900">
                    {formatUsd(quoteTotal(item))}
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

      <AppModal visible={oppPickerOpen} animationType="slide" transparent>
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
      </AppModal>

      <MobileFormSheet
        visible={createOpen}
        title="New Quote"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
        saveLabel="Create"
      >
            <FormSection title="General Information">
              <FormInput
                label="Quote Title"
                icon="document-text-outline"
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Software Development Services"
              />
              <FormSelect
                label="Related Opportunity"
                icon="briefcase-outline"
                value={opportunityId ? opportunities.find(o => o.id === opportunityId)?.title || '' : ''}
                onPress={() => setOppPickerOpen(true)}
                last
              />
            </FormSection>

            <FormSection title="Pricing & Timeline">
              <FormInput
                label="Amount"
                icon="cash-outline"
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              <FormInput
                label="Valid Until"
                icon="calendar-outline"
                value={validUntil}
                onChangeText={setValidUntil}
                placeholder="YYYY-MM-DD"
                last
              />
            </FormSection>

            <FormSection title="Details & Terms">
              <FormInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Detailed scope of work..."
              />
              <FormInput
                label="Terms"
                value={terms}
                onChangeText={setTerms}
                multiline
                placeholder="Payment terms, conditions..."
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
        title="Edit Quote"
        onCancel={() => setEditOpen(false)}
        onSave={() => void submitEdit()}
      >
            <FormSection title="General Information">
              <FormInput
                label="Quote Title"
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

            <FormSection title="Pricing & Timeline">
              <FormInput
                label="Amount"
                icon="cash-outline"
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="decimal-pad"
              />
              <FormInput
                label="Valid Until"
                icon="calendar-outline"
                value={validUntil}
                onChangeText={setValidUntil}
                last
              />
            </FormSection>

            <FormSection title="Details & Terms">
              <FormInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <FormInput
                label="Terms"
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

      <AppModal visible={viewOpen} animationType="fade" transparent>
        <View className="flex-1 justify-center bg-black/40 px-4">
          <View className="max-h-[80%] rounded-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Quote</Text>
            {viewing ? (
              <ScrollView className="mt-3">
                <Text className="text-slate-600">{viewing.quoteNumber}</Text>
                <Text className="mt-2 text-xl font-semibold text-slate-900">
                  {viewing.title}
                </Text>
                <Text className="mt-2 text-slate-700">
                  {formatUsd(quoteTotal(viewing))} · {String(viewing.status)}
                </Text>
                <Text className="mt-2 text-slate-600">
                  Opportunity: {opportunityName(viewing.opportunityId)}
                </Text>
                {viewing.description ? (
                  <Text className="mt-3 text-slate-800">{viewing.description}</Text>
                ) : null}
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
      </AppModal>
    </View>
  );
}
