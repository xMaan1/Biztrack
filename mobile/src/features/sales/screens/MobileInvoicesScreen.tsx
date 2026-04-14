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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import {
  InvoiceStatus,
  PaymentMethod,
  type Invoice,
  type InvoiceCreate,
  type InvoiceItemCreate,
  type InvoiceDashboard,
  type InvoiceFilters,
  type InvoiceCustomerOption,
} from '../../../models/sales';
import {
  fetchInvoicesPaged,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceDashboard,
  searchInvoiceCustomers,
  markInvoicePaid,
  sendInvoiceEmail,
  sendInvoiceWhatsApp,
} from '../../../services/sales/invoiceMobileApi';
import { sharePdfFromAuthenticatedPath } from '../../../utils/salesPdfShare';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { usePermissions } from '../../../hooks/usePermissions';

const PAGE_SIZE = 15;
const STATUS_OPTS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  ...Object.values(InvoiceStatus).map((s) => ({
    value: s,
    label: s.replace(/_/g, ' '),
  })),
];

function customerLabel(c: InvoiceCustomerOption): string {
  const n = [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
  return n || c.customerId || c.id;
}

function buildItemsPayload(rows: InvoiceItemCreate[]): InvoiceItemCreate[] {
  return rows
    .filter((r) => r.description.trim().length > 0)
    .map((r) => ({
      description: r.description.trim(),
      quantity: Math.max(1, r.quantity || 1),
      unitPrice: Number(r.unitPrice) || 0,
      discount: Number(r.discount) || 0,
      taxRate: Number(r.taxRate) || 0,
    }));
}

const getStatusBadge = (status: string) => {
  const s = String(status).toLowerCase();
  switch (s) {
    case 'paid':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', color: '#059669', label: 'Paid', icon: 'checkmark-circle' };
    case 'overdue':
      return { bg: 'bg-rose-100', text: 'text-rose-700', color: '#e11d48', label: 'Overdue', icon: 'warning' };
    case 'sent':
      return { bg: 'bg-blue-100', text: 'text-blue-700', color: '#2563eb', label: 'Sent', icon: 'paper-plane' };
    case 'partially_paid':
      return { bg: 'bg-amber-100', text: 'text-amber-700', color: '#d97706', label: 'Partial', icon: 'pie-chart' };
    case 'draft':
      return { bg: 'bg-slate-100', text: 'text-slate-600', color: '#475569', label: 'Draft', icon: 'document' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-600', color: '#475569', label: status, icon: 'help-circle' };
  }
};

export function MobileInvoicesScreen() {
  const { workspacePath, setSidebarActivePath, setWorkspacePath } = useSidebarDrawer();
  const { canManageSales, canManageInvoices } = usePermissions();

  const [tab, setTab] = useState<'list' | 'dashboard'>('list');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dashboard, setDashboard] = useState<InvoiceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusOpen, setStatusOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [custQuery, setCustQuery] = useState('');
  const [custHits, setCustHits] = useState<InvoiceCustomerOption[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [lineRows, setLineRows] = useState<InvoiceItemCreate[]>([
    { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 },
  ]);

  const filters: InvoiceFilters = useMemo(() => {
    const f: InvoiceFilters = {};
    if (search.trim()) f.search = search.trim();
    if (statusFilter !== 'all') f.status = statusFilter;
    return f;
  }, [search, statusFilter]);

  const loadList = useCallback(async () => {
    const res = await fetchInvoicesPaged(filters, page, PAGE_SIZE);
    setInvoices(res.invoices ?? []);
    const pag = res.pagination as { pages?: number } | undefined;
    setTotalPages(Math.max(1, pag?.pages ?? 1));
  }, [filters, page]);

  const loadDashboard = useCallback(async () => {
    const d = await getInvoiceDashboard();
    setDashboard(d);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadList(), loadDashboard()]);
    } catch (e) {
      Alert.alert('Invoices', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [loadList, loadDashboard]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/invoices',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (custQuery.trim().length < 2) {
        setCustHits([]);
        return;
      }
      void (async () => {
        try {
          const rows = await searchInvoiceCustomers(custQuery.trim(), 25);
          setCustHits(rows ?? []);
        } catch {
          setCustHits([]);
        }
      })();
    }, 400);
    return () => clearTimeout(t);
  }, [custQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const resetCreate = () => {
    setCustQuery('');
    setCustHits([]);
    setCustomerId('');
    setCustomerName('');
    setCustomerEmail('');
    const today = new Date().toISOString().slice(0, 10);
    const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setIssueDate(today);
    setDueDate(due);
    setPaymentTerms('Net 30');
    setCurrency('USD');
    setTaxRate('0');
    setDiscount('0');
    setNotes('');
    setTerms('');
    setLineRows([
      { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 },
    ]);
  };

  const submitCreate = async () => {
    const items = buildItemsPayload(lineRows);
    if (!customerId || !customerName.trim() || !customerEmail.trim()) {
      Alert.alert('Invoices', 'Select a customer with name and email.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Invoices', 'Add at least one line item.');
      return;
    }
    const tr = parseFloat(taxRate) || 0;
    const disc = parseFloat(discount) || 0;
    const payload: InvoiceCreate = {
      customerId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      billingAddress: '',
      shippingAddress: '',
      issueDate: new Date(`${issueDate}T12:00:00`).toISOString(),
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      orderNumber: '',
      orderTime: new Date().toISOString().slice(0, 16),
      paymentTerms,
      currency,
      taxRate: tr,
      discount: disc,
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
      items,
    };
    try {
      await createInvoice(payload);
      setCreateOpen(false);
      resetCreate();
      await loadAll();
    } catch (e) {
      Alert.alert('Invoices', extractErrorMessage(e, 'Failed to create'));
    }
  };

  const openDetail = async (inv: Invoice) => {
    try {
      const full = await getInvoice(inv.id);
      setSelected(full);
      setDetailOpen(true);
    } catch (e) {
      Alert.alert('Invoices', extractErrorMessage(e, 'Failed to open'));
    }
  };

  const handleMarkPaid = async () => {
    if (!selected) return;
    try {
      await markInvoicePaid(selected.id);
      const full = await getInvoice(selected.id);
      setSelected(full);
      await loadAll();
    } catch (e) {
      Alert.alert('Invoices', extractErrorMessage(e, 'Failed'));
    }
  };

  const handleSendEmail = async () => {
    if (!selected) return;
    try {
      await sendInvoiceEmail(
        selected.id,
        emailTo.trim() || undefined,
        emailBody.trim() || undefined,
      );
      setEmailOpen(false);
      Alert.alert('Invoices', 'Email sent.');
    } catch (e) {
      Alert.alert('Invoices', extractErrorMessage(e, 'Failed to send'));
    }
  };

  const handleWhatsApp = async () => {
    if (!selected) return;
    try {
      const res = await sendInvoiceWhatsApp(selected.id);
      if (res.whatsapp_url) {
        await Linking.openURL(res.whatsapp_url);
      }
    } catch (e) {
      Alert.alert('Invoices', extractErrorMessage(e, 'Failed'));
    }
  };

  const handlePdf = async () => {
    if (!selected) return;
    try {
      await sharePdfFromAuthenticatedPath(
        `/invoices/${selected.id}/download`,
        `invoice-${selected.invoiceNumber}.pdf`,
      );
    } catch (e) {
      Alert.alert('Invoices', extractErrorMessage(e, 'Could not share PDF'));
    }
  };

  const handleDelete = (inv: Invoice) => {
    Alert.alert('Delete invoice', inv.invoiceNumber, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void doDelete(inv.id),
      },
    ]);
  };

  const doDelete = async (id: string) => {
    try {
      await deleteInvoice(id);
      setDetailOpen(false);
      setSelected(null);
      await loadAll();
    } catch (e) {
      Alert.alert('Invoices', extractErrorMessage(e, 'Failed to delete'));
    }
  };

  const canEdit = canManageInvoices() || canManageSales();

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Invoices
        </Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setWorkspacePath('/settings/invoice')}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
          >
            <Ionicons name="settings-outline" size={22} color="#475569" />
          </Pressable>
          {canEdit ? (
            <Pressable
              onPress={() => {
                resetCreate();
                setCreateOpen(true);
              }}
              className="rounded-xl bg-blue-600 px-4 py-2 active:bg-blue-700 shadow-sm shadow-blue-200"
            >
              <Text className="font-bold text-white">New</Text>
            </Pressable>
          ) : (
            <View className="w-4" />
          )}
        </View>
      </View>

      <View className="flex-row bg-white p-2">
        <Pressable
          onPress={() => setTab('list')}
          className={`mr-2 flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
            tab === 'list' ? 'bg-blue-600 shadow-sm shadow-blue-200' : 'bg-slate-50'
          }`}
        >
          <Ionicons
            name="list"
            size={18}
            color={tab === 'list' ? 'white' : '#64748b'}
            style={{ marginRight: 6 }}
          />
          <Text
            className={`text-sm font-bold ${
              tab === 'list' ? 'text-white' : 'text-slate-500'
            }`}
          >
            Invoices
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('dashboard')}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
            tab === 'dashboard' ? 'bg-blue-600 shadow-sm shadow-blue-200' : 'bg-slate-50'
          }`}
        >
          <Ionicons
            name="stats-chart"
            size={18}
            color={tab === 'dashboard' ? 'white' : '#64748b'}
            style={{ marginRight: 6 }}
          />
          <Text
            className={`text-sm font-bold ${
              tab === 'dashboard' ? 'text-white' : 'text-slate-500'
            }`}
          >
            Dashboard
          </Text>
        </Pressable>
      </View>

      {tab === 'list' ? (
        <>
          <View className="border-b border-slate-200 bg-white px-3 py-2">
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search invoices…"
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Pressable
              onPress={() => setStatusOpen(true)}
              className="flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <Text className="text-slate-700">
                {STATUS_OPTS.find((x) => x.value === statusFilter)?.label}
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
              data={invoices}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
              ListEmptyComponent={
                <Text className="py-8 text-center text-slate-500">
                  No invoices
                </Text>
              }
              renderItem={({ item }) => {
                const badge = getStatusBadge(item.status);
                return (
                  <View className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Pressable
                      onPress={() => void openDetail(item)}
                      android_ripple={{ color: '#f8fafc' }}
                      className="p-4"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 flex-row items-center">
                          <View
                            className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${badge.bg}`}
                          >
                            <Ionicons name={badge.icon as any} size={20} color={badge.color} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              {item.invoiceNumber}
                            </Text>
                            <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
                              {item.customerName}
                            </Text>
                          </View>
                        </View>
                        <View className={`rounded-full px-2.5 py-1 ${badge.bg}`}>
                          <Text className={`text-[10px] font-black uppercase tracking-wider ${badge.text}`}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      <View className="mt-4 flex-row items-center justify-between border-t border-slate-50 pt-3">
                        <View>
                          <Text className="text-[10px] uppercase tracking-tighter text-slate-400">Amount Due</Text>
                          <Text className="text-lg font-black text-slate-900">
                            {formatUsd(item.total)}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => void openDetail(item)}
                          className="flex-row items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 active:bg-black"
                        >
                          <Text className="text-xs font-bold text-white">Details</Text>
                          <Ionicons name="chevron-forward" size={14} color="white" />
                        </Pressable>
                      </View>
                    </Pressable>
                  </View>
                );
              }}
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
        </>
      ) : (
        <ScrollView
          className="flex-1 px-3 py-3"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {dashboard ? (
            <View>
              <View className="flex-row flex-wrap justify-between gap-3">
                <View className="w-[47%] rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Ionicons name="receipt" size={16} color="#2563eb" />
                  </View>
                  <Text className="mt-2 text-2xl font-black text-slate-900">
                    {dashboard.metrics.totalInvoices}
                  </Text>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invoices</Text>
                </View>

                <View className="w-[47%] rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <Ionicons name="checkmark-done" size={16} color="#059669" />
                  </View>
                  <Text className="mt-2 text-2xl font-black text-slate-900">
                    {dashboard.metrics.paidInvoices}
                  </Text>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid</Text>
                </View>

                <View className="w-[47%] rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-rose-100">
                    <Ionicons name="time" size={16} color="#e11d48" />
                  </View>
                  <Text className="mt-2 text-2xl font-black text-rose-600">
                    {dashboard.metrics.overdueInvoices}
                  </Text>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue</Text>
                </View>

                <View className="w-[47%] rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                    <Ionicons name="cash" size={16} color="#4f46e5" />
                  </View>
                  <Text className="mt-2 text-xl font-black text-slate-900">
                    {formatUsd(dashboard.metrics.totalRevenue)}
                  </Text>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revenue</Text>
                </View>

                <View className="w-full rounded-2xl bg-slate-900 p-4 shadow-md">
                   <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Outstanding</Text>
                   <Text className="mt-1 text-3xl font-black text-white">
                     {formatUsd(dashboard.metrics.outstandingAmount)}
                   </Text>
                </View>
              </View>

              <View className="mt-6 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm">
                <Text className="text-lg font-black text-slate-900 mb-4">Recent Activity</Text>
                {(dashboard.recentInvoices ?? []).slice(0, 5).map((inv) => {
                  const badge = getStatusBadge(inv.status);
                  return (
                    <Pressable
                      key={inv.id}
                      onPress={() => void openDetail(inv)}
                      className="flex-row items-center border-b border-slate-50 py-4 active:bg-slate-50"
                    >
                      <View className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${badge.bg}`}>
                        <Ionicons name={badge.icon as any} size={18} color={badge.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-slate-900">{inv.invoiceNumber}</Text>
                        <Text className="text-xs text-slate-500">{inv.customerName}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-black text-slate-900">{formatUsd(inv.total)}</Text>
                        <Text className={`text-[9px] font-bold uppercase ${badge.text}`}>{badge.label}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : (
            <Text className="py-6 text-center text-slate-500">No data</Text>
          )}
        </ScrollView>
      )}

      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={STATUS_OPTS}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
          setPage(1);
        }}
        onClose={() => setStatusOpen(false)}
      />

      <Modal visible={createOpen} animationType="slide">
        <View className="flex-1 bg-slate-50">
          <View className="flex-row items-center justify-between bg-white border-b border-slate-200 px-4 py-4">
            <Pressable onPress={() => setCreateOpen(false)} className="px-2 py-1">
              <Text className="font-bold text-slate-500">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-black text-slate-900">New Invoice</Text>
            <Pressable onPress={() => void submitCreate()} className="rounded-xl bg-blue-600 px-5 py-2 active:bg-blue-700 shadow-sm shadow-blue-200">
              <Text className="font-bold text-white">Save</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-6" keyboardShouldPersistTaps="handled">
            <Text className="mb-1 text-sm font-medium text-slate-700">
              Find customer
            </Text>
            <TextInput
              value={custQuery}
              onChangeText={setCustQuery}
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Type name, email, phone…"
            />
            {custHits.length > 0 ? (
              <View className="mb-3 max-h-40 rounded-lg border border-slate-200">
                <FlatList
                  data={custHits}
                  keyExtractor={(c) => c.id}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setCustomerId(String(item.customerId ?? item.id));
                        setCustomerName(customerLabel(item));
                        setCustomerEmail(String(item.email ?? ''));
                        setCustHits([]);
                        setCustQuery('');
                      }}
                      className="border-b border-slate-100 px-3 py-2"
                    >
                      <Text className="font-medium text-slate-900">
                        {customerLabel(item)}
                      </Text>
                      {item.email ? (
                        <Text className="text-sm text-slate-600">{item.email}</Text>
                      ) : null}
                    </Pressable>
                  )}
                />
              </View>
            ) : null}
            <Text className="mb-1 text-sm font-medium text-slate-700">Customer name</Text>
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
            <TextInput
              value={customerEmail}
              onChangeText={setCustomerEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-1 text-sm font-medium text-slate-700">Issue / due</Text>
            <View className="mb-2 flex-row gap-2">
              <TextInput
                value={issueDate}
                onChangeText={setIssueDate}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="YYYY-MM-DD"
              />
            </View>
            <Text className="mb-1 text-sm font-medium text-slate-700">Currency</Text>
            <TextInput
              value={currency}
              onChangeText={setCurrency}
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <View className="mb-2 flex-row gap-2">
              <View className="flex-1">
                <Text className="mb-1 text-sm font-medium text-slate-700">Tax %</Text>
                <TextInput
                  value={taxRate}
                  onChangeText={setTaxRate}
                  keyboardType="decimal-pad"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-sm font-medium text-slate-700">Discount %</Text>
                <TextInput
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="decimal-pad"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                />
              </View>
            </View>
            <Text className="mb-1 text-sm font-medium text-slate-700">Payment terms</Text>
            <TextInput
              value={paymentTerms}
              onChangeText={setPaymentTerms}
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <Text className="mb-2 font-semibold text-slate-900">Line items</Text>
            {lineRows.map((row, idx) => (
              <View key={idx} className="mb-3 rounded-lg border border-slate-200 p-2">
                <TextInput
                  value={row.description}
                  onChangeText={(t) => {
                    const next = [...lineRows];
                    next[idx] = { ...row, description: t };
                    setLineRows(next);
                  }}
                  placeholder="Description"
                  className="mb-2 rounded border border-slate-100 px-2 py-1 text-slate-900"
                />
                <View className="flex-row gap-2">
                  <TextInput
                    value={String(row.quantity)}
                    onChangeText={(t) => {
                      const next = [...lineRows];
                      next[idx] = { ...row, quantity: parseInt(t, 10) || 1 };
                      setLineRows(next);
                    }}
                    keyboardType="number-pad"
                    className="w-16 rounded border border-slate-100 px-2 py-1 text-slate-900"
                  />
                  <TextInput
                    value={String(row.unitPrice)}
                    onChangeText={(t) => {
                      const next = [...lineRows];
                      next[idx] = { ...row, unitPrice: parseFloat(t) || 0 };
                      setLineRows(next);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="Price"
                    className="flex-1 rounded border border-slate-100 px-2 py-1 text-slate-900"
                  />
                </View>
              </View>
            ))}
            <Pressable
              onPress={() =>
                setLineRows((r) => [
                  ...r,
                  { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 },
                ])
              }
              className="mb-4 items-center rounded-lg bg-slate-100 py-2"
            >
              <Text className="font-medium text-slate-800">Add line</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={detailOpen} animationType="slide">
        <View className="flex-1 bg-slate-50">
          <View className="flex-row items-center justify-between bg-white border-b border-slate-200 px-4 py-4">
            <Pressable onPress={() => setDetailOpen(false)} className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Ionicons name="close" size={24} color="#1e293b" />
            </Pressable>
            <Text className="text-lg font-black text-slate-900">Invoice Details</Text>
            <View className="w-10" />
          </View>
          
          <ScrollView className="flex-1">
            {selected ? (
              <View className="p-4">
                <View className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Invoice Number</Text>
                      <Text className="text-2xl font-black text-slate-900">{selected.invoiceNumber}</Text>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${getStatusBadge(selected.status).bg}`}>
                      <Text className={`text-xs font-black uppercase tracking-wider ${getStatusBadge(selected.status).text}`}>
                        {getStatusBadge(selected.status).label}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-4 border-t border-slate-50 pt-4">
                    <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Customer</Text>
                    <Text className="text-lg font-bold text-slate-900">{selected.customerName}</Text>
                    <Text className="text-slate-600">{selected.customerEmail}</Text>
                  </View>

                  <View className="flex-row justify-between mb-4 border-t border-slate-50 pt-4">
                    <View>
                      <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Issue Date</Text>
                      <Text className="font-bold text-slate-900">{new Date(selected.issueDate).toLocaleDateString()}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Due Date</Text>
                      <Text className="font-bold text-rose-600">{new Date(selected.dueDate).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <View className="mt-2 rounded-2xl bg-slate-900 p-5">
                    <Text className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Balance</Text>
                    <Text className="mt-1 text-3xl font-black text-white">{formatUsd(selected.total)}</Text>
                  </View>
                </View>

                <View className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
                  <Text className="text-lg font-black text-slate-900 mb-4">Line Items</Text>
                  {(selected.items ?? []).map((item, idx) => (
                    <View key={idx} className="mb-4 flex-row justify-between border-b border-slate-50 pb-4">
                      <View className="flex-1 pr-4">
                        <Text className="font-bold text-slate-900">{item.description}</Text>
                        <Text className="text-xs text-slate-500">Qty: {item.quantity} × {formatUsd(item.unitPrice)}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-black text-slate-900">{formatUsd(item.total)}</Text>
                      </View>
                    </View>
                  ))}
                  
                  <View className="mt-2 space-y-2">
                    <View className="flex-row justify-between">
                      <Text className="text-slate-500">Subtotal</Text>
                      <Text className="font-bold text-slate-900">{formatUsd(selected.subtotal)}</Text>
                    </View>
                    {selected.taxAmount > 0 && (
                      <View className="flex-row justify-between">
                        <Text className="text-slate-500">Tax ({selected.taxRate}%)</Text>
                        <Text className="font-bold text-slate-900">{formatUsd(selected.taxAmount)}</Text>
                      </View>
                    )}
                    {selected.discount > 0 && (
                      <View className="flex-row justify-between">
                        <Text className="text-rose-500">Discount</Text>
                        <Text className="font-bold text-rose-500">-{formatUsd(selected.discount)}</Text>
                      </View>
                    )}
                    <View className="mt-3 flex-row justify-between border-t border-slate-100 pt-3">
                      <Text className="text-lg font-black text-slate-900">Total</Text>
                      <Text className="text-lg font-black text-blue-600">{formatUsd(selected.total)}</Text>
                    </View>
                  </View>
                </View>

                <View className="mt-6 mb-8">
                  <Text className="text-lg font-black text-slate-900 mb-4 px-2">Actions</Text>
                  <View className="flex-row flex-wrap gap-3 p-2">
                    {canEdit ? (
                      <>
                        <Pressable
                          onPress={handleMarkPaid}
                          className="flex-1 min-w-[140px] flex-row items-center justify-center rounded-2xl bg-emerald-600 py-4 shadow-sm active:bg-emerald-700"
                        >
                          <Ionicons name="checkmark-circle" size={20} color="white" />
                          <Text className="ml-2 font-black text-white">Mark Paid</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            setEmailTo(selected.customerEmail);
                            setEmailBody('');
                            setEmailOpen(true);
                          }}
                          className="flex-1 min-w-[140px] flex-row items-center justify-center rounded-2xl bg-slate-900 py-4 shadow-sm active:bg-black"
                        >
                          <Ionicons name="mail" size={20} color="white" />
                          <Text className="ml-2 font-black text-white">Email</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => void handleWhatsApp()}
                          className="flex-1 min-w-[140px] flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-sm active:bg-emerald-600"
                        >
                          <Ionicons name="logo-whatsapp" size={20} color="white" />
                          <Text className="ml-2 font-black text-white">WhatsApp</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => void handlePdf()}
                          className="flex-1 min-w-[140px] flex-row items-center justify-center rounded-2xl bg-indigo-600 py-4 shadow-sm active:bg-indigo-700"
                        >
                          <Ionicons name="document" size={20} color="white" />
                          <Text className="ml-2 font-black text-white">PDF</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(selected)}
                          className="w-full flex-row items-center justify-center rounded-2xl bg-rose-50 py-4 active:bg-rose-100 border border-rose-100"
                        >
                          <Ionicons name="trash" size={20} color="#e11d48" />
                          <Text className="ml-2 font-black text-rose-600">Delete Invoice</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Text className="text-slate-500 italic px-2">View-only permissions</Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator color="#2563eb" />
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={emailOpen} animationType="fade" transparent>
        <View className="flex-1 justify-center bg-black/40 px-4">
          <View className="rounded-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Send email</Text>
            <TextInput
              value={emailTo}
              onChangeText={setEmailTo}
              placeholder="To"
              className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <TextInput
              value={emailBody}
              onChangeText={setEmailBody}
              placeholder="Message"
              multiline
              className="mt-2 min-h-[80px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable onPress={() => setEmailOpen(false)} className="px-3 py-2">
                <Text className="text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleSendEmail()}
                className="rounded-lg bg-blue-600 px-4 py-2"
              >
                <Text className="font-semibold text-white">Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
