import { useCallback, useEffect, useState } from 'react';
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
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { type DeliveryNote } from '../../../models/sales';
import {
  fetchInvoicesPaged,
  getDeliveryNotes,
  createDeliveryNote,
} from '../../../services/sales/invoiceMobileApi';
import type { Invoice } from '../../../models/sales';
import { sharePdfFromAuthenticatedPath } from '../../../utils/salesPdfShare';
import { usePermissions } from '../../../hooks/usePermissions';

export function MobileDeliveryNotesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageSales } = usePermissions();

  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [invoiceHits, setInvoiceHits] = useState<Invoice[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceLabel, setInvoiceLabel] = useState('');
  const [noteText, setNoteText] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDeliveryNotes(undefined, 0, 200);
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Delivery notes', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/delivery-notes',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      void (async () => {
        if (invoiceQuery.trim().length < 2) {
          setInvoiceHits([]);
          return;
        }
        try {
          const res = await fetchInvoicesPaged(
            { search: invoiceQuery.trim() },
            1,
            25,
          );
          setInvoiceHits(res.invoices ?? []);
        } catch {
          setInvoiceHits([]);
        }
      })();
    }, 400);
    return () => clearTimeout(t);
  }, [invoiceQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const submitCreate = async () => {
    if (!invoiceId) {
      Alert.alert('Delivery notes', 'Select an invoice');
      return;
    }
    try {
      await createDeliveryNote({
        invoice_id: invoiceId,
        note: noteText.trim() || null,
      });
      setCreateOpen(false);
      setInvoiceId('');
      setInvoiceLabel('');
      setNoteText('');
      setInvoiceQuery('');
      await load();
    } catch (e) {
      Alert.alert('Delivery notes', extractErrorMessage(e, 'Failed to create'));
    }
  };

  const pdf = async (n: DeliveryNote) => {
    try {
      await sharePdfFromAuthenticatedPath(
        `/delivery-notes/${n.id}/download`,
        `delivery-note-${n.id}.pdf`,
      );
    } catch (e) {
      Alert.alert('Delivery notes', extractErrorMessage(e, 'PDF failed'));
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Delivery notes
        </Text>
        {canManageSales() ? (
          <Pressable
            onPress={() => {
              setInvoiceId('');
              setInvoiceLabel('');
              setNoteText('');
              setInvoiceQuery('');
              setCreateOpen(true);
            }}
            className="rounded-lg bg-blue-600 px-3 py-2 active:bg-blue-700"
          >
            <Text className="font-semibold text-white">New</Text>
          </Pressable>
        ) : (
          <View className="w-14" />
        )}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No delivery notes</Text>
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="font-semibold text-slate-900">
                {item.invoice_number ?? item.invoice_id.slice(0, 8)}
              </Text>
              {item.customer_name ? (
                <Text className="mt-1 text-slate-700">{item.customer_name}</Text>
              ) : null}
              {item.note ? (
                <Text className="mt-2 text-slate-800">{item.note}</Text>
              ) : null}
              <Pressable
                onPress={() => void pdf(item)}
                className="mt-3 self-start rounded-lg bg-indigo-600 px-3 py-1.5"
              >
                <Text className="font-semibold text-white">PDF</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Modal visible={createOpen} animationType="slide">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-3 py-3">
            <Pressable onPress={() => setCreateOpen(false)}>
              <Text className="text-blue-600">Cancel</Text>
            </Pressable>
            <Text className="text-lg font-semibold">New delivery note</Text>
            <Pressable onPress={() => void submitCreate()}>
              <Text className="font-semibold text-blue-600">Save</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-3" keyboardShouldPersistTaps="handled">
            <Text className="mb-1 text-sm font-medium text-slate-700">Invoice</Text>
            <TextInput
              value={invoiceQuery}
              onChangeText={setInvoiceQuery}
              placeholder="Search invoice # or customer…"
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            {invoiceLabel ? (
              <Text className="mb-2 text-slate-800">Selected: {invoiceLabel}</Text>
            ) : null}
            {invoiceHits.length > 0 ? (
              <FlatList
                data={invoiceHits}
                keyExtractor={(i) => i.id}
                keyboardShouldPersistTaps="handled"
                className="mb-3 max-h-48 rounded-lg border border-slate-200"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setInvoiceId(item.id);
                      setInvoiceLabel(`${item.invoiceNumber} · ${item.customerName}`);
                      setInvoiceHits([]);
                      setInvoiceQuery('');
                    }}
                    className="border-b border-slate-100 px-3 py-2"
                  >
                    <Text className="font-medium text-slate-900">{item.invoiceNumber}</Text>
                    <Text className="text-sm text-slate-600">{item.customerName}</Text>
                  </Pressable>
                )}
              />
            ) : null}
            <Text className="mb-1 text-sm font-medium text-slate-700">Note</Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              multiline
              className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Optional note"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
