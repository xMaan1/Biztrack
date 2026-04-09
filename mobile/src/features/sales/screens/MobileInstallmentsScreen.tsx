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
import { formatUsd } from '../../../services/crm/CrmMobileService';
import type { Installment, InstallmentPlan } from '../../../models/sales';
import { PaymentMethod } from '../../../models/sales';
import {
  getAllInstallmentPlans,
  getInstallmentPlan,
  createPayment,
  applyPaymentToInstallment,
} from '../../../services/sales/invoiceMobileApi';
import { sharePdfFromAuthenticatedPath } from '../../../utils/salesPdfShare';
import { usePermissions } from '../../../hooks/usePermissions';

export function MobileInstallmentsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageSales } = usePermissions();

  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<InstallmentPlan | null>(null);

  const [payOpen, setPayOpen] = useState(false);
  const [payInst, setPayInst] = useState<Installment | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<string>(PaymentMethod.CASH);
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllInstallmentPlans(0, 200);
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Installments', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/installments',
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

  const openDetail = async (p: InstallmentPlan) => {
    try {
      const full = await getInstallmentPlan(p.id);
      setSelected(full);
      setDetailOpen(true);
    } catch (e) {
      Alert.alert('Installments', extractErrorMessage(e, 'Failed to open'));
    }
  };

  const openPay = (inst: Installment) => {
    setPayInst(inst);
    const remaining = inst.amount - (inst.paid_amount || 0);
    setPayAmount(remaining > 0 ? String(remaining) : '');
    setPayMethod(PaymentMethod.CASH);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayOpen(true);
  };

  const submitPay = async () => {
    if (!selected || !payInst) return;
    const amount = parseFloat(payAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      Alert.alert('Installments', 'Enter a valid amount');
      return;
    }
    try {
      const payment = await createPayment(selected.invoice_id, {
        invoiceId: selected.invoice_id,
        amount,
        paymentMethod: payMethod as PaymentMethod,
        paymentDate: payDate + 'T12:00:00.000Z',
      });
      await applyPaymentToInstallment(selected.id, payInst.id, {
        amount,
        payment_id: payment.id,
      });
      setPayOpen(false);
      setPayInst(null);
      const updated = await getInstallmentPlan(selected.id);
      setSelected(updated);
      await load();
    } catch (e) {
      Alert.alert('Installments', extractErrorMessage(e, 'Payment failed'));
    }
  };

  const pdfPlan = async () => {
    if (!selected) return;
    try {
      await sharePdfFromAuthenticatedPath(
        `/installments/installment-plans/${selected.id}/customer-info-pdf`,
        `installment-${selected.id}.pdf`,
      );
    } catch (e) {
      Alert.alert('Installments', extractErrorMessage(e, 'PDF failed'));
    }
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Installments
        </Text>
        <View className="w-10" />
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No plans</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => void openDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <Text className="font-semibold text-slate-900">
                Plan · {item.number_of_installments} × {item.frequency}
              </Text>
              <Text className="mt-1 text-slate-600">
                Invoice {item.invoice_id.slice(0, 8)}…
              </Text>
              <Text className="mt-2 font-medium text-slate-900">
                {formatUsd(item.total_amount)} {item.currency}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">{item.status}</Text>
            </Pressable>
          )}
        />
      )}

      <Modal visible={detailOpen} animationType="slide">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-slate-200 px-3 py-3">
            <Pressable onPress={() => setDetailOpen(false)}>
              <Text className="text-blue-600">Close</Text>
            </Pressable>
            <Text className="text-lg font-semibold">Plan</Text>
            <Pressable onPress={() => void pdfPlan()}>
              <Text className="font-semibold text-indigo-600">PDF</Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-4 py-3">
            {selected ? (
              <>
                <Text className="text-slate-800">
                  {formatUsd(selected.total_amount)} · {selected.currency}
                </Text>
                <Text className="mt-1 text-slate-600">
                  {selected.number_of_installments} payments · {selected.frequency}
                </Text>
                <Text className="mt-3 font-semibold text-slate-900">Schedule</Text>
                {(selected.installments ?? []).map((inst) => (
                  <View
                    key={inst.id}
                    className="border-b border-slate-100 py-3"
                  >
                    <Text className="font-medium text-slate-900">
                      #{inst.sequence_number} · {fmtDate(inst.due_date)}
                    </Text>
                    <Text className="text-slate-700">
                      {formatUsd(inst.amount)} · {inst.status}
                      {inst.paid_amount ? ` · paid ${formatUsd(inst.paid_amount)}` : ''}
                    </Text>
                    {canManageSales() && inst.status !== 'paid' ? (
                      <Pressable
                        onPress={() => openPay(inst)}
                        className="mt-2 self-start rounded-lg bg-blue-600 px-3 py-1.5"
                      >
                        <Text className="font-semibold text-white">Pay</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={payOpen} animationType="fade" transparent>
        <View className="flex-1 justify-center bg-black/40 px-4">
          <View className="rounded-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Record payment</Text>
            <TextInput
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="decimal-pad"
              placeholder="Amount"
              className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <TextInput
              value={payMethod}
              onChangeText={setPayMethod}
              placeholder="cash, bank_transfer…"
              className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <TextInput
              value={payDate}
              onChangeText={setPayDate}
              placeholder="YYYY-MM-DD"
              className="mt-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
            />
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable onPress={() => setPayOpen(false)} className="px-3 py-2">
                <Text className="text-slate-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void submitPay()}
                className="rounded-lg bg-blue-600 px-4 py-2"
              >
                <Text className="font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
