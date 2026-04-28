import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getEmployees, deleteEmployee, createEmployee, updateEmployee } from '../../../services/hrm/hrmMobileApi';
import type { Employee, EmployeeCreate, EmployeeUpdate } from '../../../models/hrm';
import { Department, EmployeeType, EmploymentStatus } from '../../../models/hrm';
import { AppModal } from '../../../components/layout/AppModal';

const DEPARTMENTS = Object.values(Department);
const EMPLOYEE_TYPES = Object.values(EmployeeType);
const EMPLOYMENT_STATUSES = Object.values(EmploymentStatus);

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

function buildEmptyForm() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hireDate: todayIsoDate(),
    employeeId: '',
    department: Department.GENERAL,
    position: '',
    employeeType: EmployeeType.FULL_TIME,
    employmentStatus: EmploymentStatus.ACTIVE,
    salary: '',
    notes: '',
  };
}

export function MobileHrmEmployeesScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Employee | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(buildEmptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getEmployees(1, 100, q.trim() ? { search: q.trim() } : undefined);
      setRows(res.employees ?? []);
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm/employees',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    const t = setTimeout(() => void load(), q.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const remove = (e: Employee) => {
    Alert.alert('Delete employee', `${e.firstName} ${e.lastName}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteEmployee(e.id);
              setDetail(null);
              await load();
            } catch (err) {
              Alert.alert('HRM', extractErrorMessage(err, 'Failed to delete'));
            }
          })(),
      },
    ]);
  };

  const openCreate = () => {
    setForm(buildEmptyForm());
    setCreateOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setSelected(employee);
    setForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      hireDate: employee.hireDate || todayIsoDate(),
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position,
      employeeType: employee.employeeType,
      employmentStatus: employee.employmentStatus,
      salary: employee.salary != null ? String(employee.salary) : '',
      notes: employee.notes || '',
    });
    setEditOpen(true);
  };

  const validateForm = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      Alert.alert('HRM', 'First name, last name, and email are required.');
      return false;
    }
    if (!form.employeeId.trim() || !form.position.trim() || !form.hireDate.trim()) {
      Alert.alert('HRM', 'Employee ID, position, and hire date are required.');
      return false;
    }
    return true;
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const salaryValue = parseFloat(form.salary);
      const payload: EmployeeCreate = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        hireDate: form.hireDate.trim(),
        employeeId: form.employeeId.trim(),
        department: form.department,
        position: form.position.trim(),
        employeeType: form.employeeType,
        employmentStatus: form.employmentStatus,
        salary: Number.isFinite(salaryValue) ? salaryValue : undefined,
        notes: form.notes.trim() || undefined,
      };
      await createEmployee(payload);
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
      const salaryValue = parseFloat(form.salary);
      const payload: EmployeeUpdate = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        hireDate: form.hireDate.trim(),
        employeeId: form.employeeId.trim(),
        department: form.department,
        position: form.position.trim(),
        employeeType: form.employeeType,
        employmentStatus: form.employmentStatus,
        salary: Number.isFinite(salaryValue) ? salaryValue : undefined,
        notes: form.notes.trim() || undefined,
      };
      await updateEmployee(selected.id, payload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const cycleOption = <T extends string>(list: readonly T[], current: T): T => {
    const index = list.indexOf(current);
    if (index < 0) return list[0] as T;
    return list[(index + 1) % list.length] as T;
  };

  const renderForm = () => (
    <ScrollView keyboardShouldPersistTaps="handled" className="mt-3 max-h-[75%]">
      <View className="gap-3">
        <TextInput value={form.firstName} onChangeText={(v) => setForm((p) => ({ ...p, firstName: v }))} placeholder="First name" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
        <TextInput value={form.lastName} onChangeText={(v) => setForm((p) => ({ ...p, lastName: v }))} placeholder="Last name" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
        <TextInput value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} placeholder="Email" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" keyboardType="email-address" autoCapitalize="none" />
        <TextInput value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} placeholder="Phone" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
        <TextInput value={form.employeeId} onChangeText={(v) => setForm((p) => ({ ...p, employeeId: v }))} placeholder="Employee ID" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
        <TextInput value={form.position} onChangeText={(v) => setForm((p) => ({ ...p, position: v }))} placeholder="Position" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
        <TextInput value={form.hireDate} onChangeText={(v) => setForm((p) => ({ ...p, hireDate: v }))} placeholder="Hire date (YYYY-MM-DD)" placeholderTextColor="#475569" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
        <TextInput value={form.salary} onChangeText={(v) => setForm((p) => ({ ...p, salary: v }))} placeholder="Salary" placeholderTextColor="#475569" keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900" />
        <Pressable onPress={() => setForm((p) => ({ ...p, department: cycleOption(DEPARTMENTS, p.department) }))} className="rounded-lg border border-slate-200 px-3 py-2">
          <Text className="text-slate-900">Department: {form.department}</Text>
        </Pressable>
        <Pressable onPress={() => setForm((p) => ({ ...p, employeeType: cycleOption(EMPLOYEE_TYPES, p.employeeType) }))} className="rounded-lg border border-slate-200 px-3 py-2">
          <Text className="text-slate-900">Type: {form.employeeType}</Text>
        </Pressable>
        <Pressable onPress={() => setForm((p) => ({ ...p, employmentStatus: cycleOption(EMPLOYMENT_STATUSES, p.employmentStatus) }))} className="rounded-lg border border-slate-200 px-3 py-2">
          <Text className="text-slate-900">Status: {form.employmentStatus}</Text>
        </Pressable>
        <TextInput value={form.notes} onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))} placeholder="Notes" placeholderTextColor="#475569" multiline className="min-h-[86px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900" textAlignVertical="top" />
      </View>
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Employees
        </Text>
        {canManageHRM() ? (
          <Pressable onPress={openCreate} className="px-2 py-1">
            <Text className="font-semibold text-blue-600">New</Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>
      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search name, email, position…"
          placeholderTextColor="#475569"
          className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
        />
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
            <Text className="py-8 text-center text-slate-500">No employees</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">
                {item.firstName} {item.lastName}
              </Text>
              <Text className="text-sm text-slate-600">{item.email}</Text>
              <Text className="mt-1 text-xs text-slate-500">
                {String(item.department)} · {item.position}
              </Text>
            </Pressable>
          )}
        />
      )}

      <AppModal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[88%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Employee</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-bold text-slate-900">
                  {detail.firstName} {detail.lastName}
                </Text>
                <Text className="mt-1 text-slate-600">{detail.email}</Text>
                <Text className="mt-2 text-slate-800">
                  {detail.employeeId} · {String(detail.department)}
                </Text>
                <Text className="mt-1 text-slate-700">{detail.position}</Text>
                <Text className="mt-2 text-slate-600">
                  Status {String(detail.employmentStatus)} ·{' '}
                  {String(detail.employeeType)}
                </Text>
                {detail.salary != null ? (
                  <Text className="mt-2 text-slate-800">
                    Salary {formatUsd(detail.salary)}
                  </Text>
                ) : null}
                {detail.hireDate ? (
                  <Text className="mt-2 text-slate-600">Hired {detail.hireDate}</Text>
                ) : null}
                {detail.notes ? (
                  <Text className="mt-3 text-slate-700">{detail.notes}</Text>
                ) : null}
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row gap-2">
              {detail && canManageHRM() ? (
                <Pressable onPress={() => openEdit(detail)} className="flex-1 items-center rounded-lg bg-blue-600 py-3">
                  <Text className="font-semibold text-white">Edit</Text>
                </Pressable>
              ) : null}
              {detail && canManageHRM() ? (
                <Pressable
                  onPress={() => remove(detail)}
                  className="flex-1 items-center rounded-lg bg-red-600 py-3"
                >
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
            <Text className="text-lg font-semibold text-slate-900">New employee</Text>
            {renderForm()}
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
            <Text className="text-lg font-semibold text-slate-900">Edit employee</Text>
            {renderForm()}
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
