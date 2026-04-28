import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getPayrollRecords, createPayrollRecord, updatePayrollRecord, deletePayrollRecord, getEmployees } from '../../../services/hrm/hrmMobileApi';
import type { Payroll, Employee, PayrollCreate, PayrollUpdate } from '../../../models/hrm';
import { PayrollStatus } from '../../../models/hrm';
import { AppModal } from '../../../components/layout/AppModal';

const PAYROLL_STATUSES = Object.values(PayrollStatus);

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

export function MobileHrmPayrollScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<Payroll | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Payroll | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    payPeriod: '',
    startDate: todayIsoDate(),
    endDate: todayIsoDate(),
    basicSalary: '',
    allowances: '',
    deductions: '',
    overtimePay: '',
    bonus: '',
    netPay: '',
    status: PayrollStatus.DRAFT,
    paymentDate: todayIsoDate(),
    notes: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [res, emp] = await Promise.all([getPayrollRecords(1, 100), getEmployees(1, 100)]);
      setRows(res.payroll ?? []);
      const list = emp.employees ?? [];
      setEmployees(list);
      setForm((prev) => ({ ...prev, employeeId: prev.employeeId || list[0]?.id || '' }));
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/payroll',
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

  const employeeName = (id: string) => {
    const employee = employees.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Select employee';
  };

  const cycleStatus = () => {
    setForm((prev) => {
      const index = PAYROLL_STATUSES.indexOf(prev.status);
      return { ...prev, status: PAYROLL_STATUSES[(index + 1) % PAYROLL_STATUSES.length] as PayrollStatus };
    });
  };

  const cycleEmployee = () => {
    if (!employees.length) return;
    setForm((prev) => {
      const ids = employees.map((e) => e.id);
      const idx = ids.indexOf(prev.employeeId);
      return { ...prev, employeeId: ids[(idx + 1) % ids.length] || ids[0] };
    });
  };

  const openCreate = () => {
    const employeeId = employees[0]?.id || '';
    setForm({
      employeeId,
      payPeriod: '',
      startDate: todayIsoDate(),
      endDate: todayIsoDate(),
      basicSalary: '',
      allowances: '',
      deductions: '',
      overtimePay: '',
      bonus: '',
      netPay: '',
      status: PayrollStatus.DRAFT,
      paymentDate: todayIsoDate(),
      notes: '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Payroll) => {
    setSelected(row);
    setForm({
      employeeId: row.employeeId,
      payPeriod: row.payPeriod,
      startDate: row.startDate ? row.startDate.split('T')[0] || row.startDate : todayIsoDate(),
      endDate: row.endDate ? row.endDate.split('T')[0] || row.endDate : todayIsoDate(),
      basicSalary: String(row.basicSalary),
      allowances: String(row.allowances || 0),
      deductions: String(row.deductions || 0),
      overtimePay: String(row.overtimePay || 0),
      bonus: String(row.bonus || 0),
      netPay: String(row.netPay),
      status: row.status,
      paymentDate: row.paymentDate ? row.paymentDate.split('T')[0] || row.paymentDate : todayIsoDate(),
      notes: row.notes || '',
    });
    setEditOpen(true);
  };

  const parseNumber = (value: string) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const validateForm = () => {
    if (!form.employeeId || !form.payPeriod.trim() || !form.startDate.trim() || !form.endDate.trim()) {
      Alert.alert('HRM', 'Employee, pay period, start date, and end date are required.');
      return false;
    }
    if (parseNumber(form.basicSalary) <= 0) {
      Alert.alert('HRM', 'Basic salary must be greater than zero.');
      return false;
    }
    return true;
  };

  const buildPayload = (): PayrollCreate => {
    const basicSalary = parseNumber(form.basicSalary);
    const allowances = parseNumber(form.allowances);
    const deductions = parseNumber(form.deductions);
    const overtimePay = parseNumber(form.overtimePay);
    const bonus = parseNumber(form.bonus);
    const calculatedNet = basicSalary + allowances + overtimePay + bonus - deductions;
    const netPay = form.netPay.trim() ? parseNumber(form.netPay) : calculatedNet;
    return {
      employeeId: form.employeeId,
      payPeriod: form.payPeriod.trim(),
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim(),
      basicSalary,
      allowances,
      deductions,
      overtimePay,
      bonus,
      netPay,
      status: form.status,
      paymentDate: form.paymentDate.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await createPayrollRecord(buildPayload());
      setCreateOpen(false);
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!selected || !validateForm()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      const updatePayload: PayrollUpdate = {
        payPeriod: payload.payPeriod,
        startDate: payload.startDate,
        endDate: payload.endDate,
        basicSalary: payload.basicSalary,
        allowances: payload.allowances,
        deductions: payload.deductions,
        overtimePay: payload.overtimePay,
        bonus: payload.bonus,
        netPay: payload.netPay,
        status: payload.status,
        paymentDate: payload.paymentDate,
        notes: payload.notes,
      };
      await updatePayrollRecord(selected.id, updatePayload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (row: Payroll) => {
    Alert.alert('Delete payroll record', row.payPeriod, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deletePayrollRecord(row.id);
              setDetail(null);
              await load();
            } catch (err) {
              Alert.alert('HRM', extractErrorMessage(err, 'Failed to delete'));
            }
          })(),
      },
    ]);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Payroll
        </Text>
        {canManageHRM() ? (
          <Pressable onPress={openCreate} className="px-2 py-1">
            <Text className="font-semibold text-blue-600">New</Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No payroll records</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">{item.payPeriod}</Text>
              <Text className="text-xs text-slate-500">{String(item.status)}</Text>
              <Text className="mt-1 text-sm text-slate-800">
                Net {formatUsd(item.netPay)}
              </Text>
            </Pressable>
          )}
        />
      )}

      <AppModal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[88%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Payroll</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-slate-800">{detail.payPeriod}</Text>
                <Text className="mt-2 text-slate-700">
                  Basic {formatUsd(detail.basicSalary)} · Net {formatUsd(detail.netPay)}
                </Text>
                <Text className="mt-2 text-sm text-slate-600">
                  {detail.startDate} → {detail.endDate}
                </Text>
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row gap-2">
              {detail && canManageHRM() ? (
                <Pressable onPress={() => openEdit(detail)} className="flex-1 items-center rounded-lg bg-blue-600 py-3">
                  <Text className="font-semibold text-white">Edit</Text>
                </Pressable>
              ) : null}
              {detail && canManageHRM() ? (
                <Pressable onPress={() => remove(detail)} className="flex-1 items-center rounded-lg bg-red-600 py-3">
                  <Text className="font-semibold text-white">Delete</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setDetail(null)}
                className="flex-1 items-center rounded-lg bg-slate-100 py-3"
              >
                <Text className="font-semibold text-slate-800">Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      <AppModal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-2 pt-4">
            <Text className="text-lg font-semibold text-slate-900">New payroll record</Text>
            <ScrollView keyboardShouldPersistTaps="handled" className="mt-3 max-h-[76%]">
              <View className="gap-3">
                <Pressable onPress={cycleEmployee} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Employee: {employeeName(form.employeeId)}</Text>
                </Pressable>
                <TextInput value={form.payPeriod} onChangeText={(v) => setForm((p) => ({ ...p, payPeriod: v }))} placeholder="Pay period" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.startDate} onChangeText={(v) => setForm((p) => ({ ...p, startDate: v }))} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.endDate} onChangeText={(v) => setForm((p) => ({ ...p, endDate: v }))} placeholder="End date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.basicSalary} onChangeText={(v) => setForm((p) => ({ ...p, basicSalary: v }))} placeholder="Basic salary" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.allowances} onChangeText={(v) => setForm((p) => ({ ...p, allowances: v }))} placeholder="Allowances" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.deductions} onChangeText={(v) => setForm((p) => ({ ...p, deductions: v }))} placeholder="Deductions" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.overtimePay} onChangeText={(v) => setForm((p) => ({ ...p, overtimePay: v }))} placeholder="Overtime pay" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.bonus} onChangeText={(v) => setForm((p) => ({ ...p, bonus: v }))} placeholder="Bonus" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.netPay} onChangeText={(v) => setForm((p) => ({ ...p, netPay: v }))} placeholder="Net pay (optional)" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <Pressable onPress={cycleStatus} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Status: {form.status}</Text>
                </Pressable>
                <TextInput value={form.paymentDate} onChangeText={(v) => setForm((p) => ({ ...p, paymentDate: v }))} placeholder="Payment date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.notes} onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))} placeholder="Notes" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
              </View>
            </ScrollView>
            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => setCreateOpen(false)} className="flex-1 items-center rounded-lg border border-slate-300 py-3">
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void submitCreate()} disabled={saving} className="flex-1 items-center rounded-lg bg-blue-600 py-3">
                <Text className="font-semibold text-white">{saving ? 'Saving...' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      <AppModal visible={editOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-2 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Edit payroll record</Text>
            <ScrollView keyboardShouldPersistTaps="handled" className="mt-3 max-h-[76%]">
              <View className="gap-3">
                <Pressable onPress={cycleEmployee} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Employee: {employeeName(form.employeeId)}</Text>
                </Pressable>
                <TextInput value={form.payPeriod} onChangeText={(v) => setForm((p) => ({ ...p, payPeriod: v }))} placeholder="Pay period" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.startDate} onChangeText={(v) => setForm((p) => ({ ...p, startDate: v }))} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.endDate} onChangeText={(v) => setForm((p) => ({ ...p, endDate: v }))} placeholder="End date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.basicSalary} onChangeText={(v) => setForm((p) => ({ ...p, basicSalary: v }))} placeholder="Basic salary" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.allowances} onChangeText={(v) => setForm((p) => ({ ...p, allowances: v }))} placeholder="Allowances" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.deductions} onChangeText={(v) => setForm((p) => ({ ...p, deductions: v }))} placeholder="Deductions" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.overtimePay} onChangeText={(v) => setForm((p) => ({ ...p, overtimePay: v }))} placeholder="Overtime pay" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.bonus} onChangeText={(v) => setForm((p) => ({ ...p, bonus: v }))} placeholder="Bonus" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.netPay} onChangeText={(v) => setForm((p) => ({ ...p, netPay: v }))} placeholder="Net pay (optional)" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <Pressable onPress={cycleStatus} className="rounded-lg border border-slate-200 px-3 py-2">
                  <Text className="text-slate-900">Status: {form.status}</Text>
                </Pressable>
                <TextInput value={form.paymentDate} onChangeText={(v) => setForm((p) => ({ ...p, paymentDate: v }))} placeholder="Payment date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
                <TextInput value={form.notes} onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))} placeholder="Notes" placeholderTextColor="#475569" multiline className="min-h-[88px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
              </View>
            </ScrollView>
            <View className="mt-4 flex-row gap-2">
              <Pressable onPress={() => { setEditOpen(false); setSelected(null); }} className="flex-1 items-center rounded-lg border border-slate-300 py-3">
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => void submitEdit()} disabled={saving} className="flex-1 items-center rounded-lg bg-blue-600 py-3">
                <Text className="font-semibold text-white">{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>
    </View>
  );
}
