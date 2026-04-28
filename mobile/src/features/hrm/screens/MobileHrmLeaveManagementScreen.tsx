import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, TextInput, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getEmployees,
} from '../../../services/hrm/hrmMobileApi';
import type { LeaveRequest, Employee } from '../../../models/hrm';
import { LeaveType, LeaveStatus } from '../../../models/hrm';
import { AppModal } from '../../../components/layout/AppModal';

const LEAVE_TYPES = Object.values(LeaveType);

export function MobileHrmLeaveManagementScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [empId, setEmpId] = useState('');
  const [leaveType, setLeaveType] = useState(LeaveType.ANNUAL);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalDays, setTotalDays] = useState('1');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<LeaveRequest | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lr, em] = await Promise.all([
        getLeaveRequests(1, 100),
        getEmployees(1, 100),
      ]);
      setRows(lr.leaveRequests ?? []);
      const list = em.employees ?? [];
      setEmployees(list);
      setEmpId((prev) => prev || list[0]?.id || '');
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/hrm/leave-management',
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

  const submit = async () => {
    if (!empId || !startDate.trim() || !endDate.trim() || !reason.trim()) {
      Alert.alert('HRM', 'Employee, dates, and reason are required.');
      return;
    }
    const td = parseFloat(totalDays);
    if (!Number.isFinite(td) || td <= 0) {
      Alert.alert('HRM', 'Enter valid total days.');
      return;
    }
    setSaving(true);
    try {
      await createLeaveRequest({
        employeeId: empId,
        leaveType,
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        totalDays: td,
        reason: reason.trim(),
        status: LeaveStatus.PENDING,
      });
      setOpen(false);
      setReason('');
      setTotalDays('1');
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to submit'));
    } finally {
      setSaving(false);
    }
  };

  const approve = async (r: LeaveRequest) => {
    try {
      await updateLeaveRequest(r.id, { status: LeaveStatus.APPROVED });
      setDetail(null);
      await load();
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to update'));
    }
  };

  const remove = (r: LeaveRequest) => {
    Alert.alert('Delete leave request', r.id, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await deleteLeaveRequest(r.id);
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
          Leave
        </Text>
        {canManageHRM() ? (
          <Pressable onPress={() => setOpen(true)} className="px-2 py-1">
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
            <Text className="py-8 text-center text-slate-500">No leave requests</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setDetail(item)}
              className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <Text className="font-semibold text-slate-900">
                {String(item.leaveType)} · {String(item.status)}
              </Text>
              <Text className="text-sm text-slate-600">
                {item.startDate} → {item.endDate} ({item.totalDays}d)
              </Text>
            </Pressable>
          )}
        />
      )}

      <AppModal visible={open} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-6 pt-3">
            <Text className="mb-3 text-lg font-semibold text-slate-900">
              New leave request
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text className="mb-1 text-sm text-slate-600">Employee</Text>
              <ScrollView horizontal className="mb-3">
                {employees.map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => setEmpId(e.id)}
                    className={`mr-2 rounded-lg border px-3 py-2 ${empId === e.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                  >
                    <Text className="text-xs text-slate-800" numberOfLines={1}>
                      {e.firstName} {e.lastName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text className="mb-1 text-sm text-slate-600">Leave type</Text>
              <ScrollView horizontal className="mb-3">
                {LEAVE_TYPES.map((lt) => (
                  <Pressable
                    key={lt}
                    onPress={() => setLeaveType(lt)}
                    className={`mr-2 rounded-lg border px-2 py-1 ${leaveType === lt ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}
                  >
                    <Text className="text-xs text-slate-800">{lt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text className="mb-1 text-sm text-slate-600">Start (YYYY-MM-DD)</Text>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">End (YYYY-MM-DD)</Text>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">Total days</Text>
              <TextInput
                value={totalDays}
                onChangeText={setTotalDays}
                keyboardType="decimal-pad"
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <Text className="mb-1 text-sm text-slate-600">Reason</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                multiline
                className="mb-4 min-h-[80px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setOpen(false)}
                  className="flex-1 items-center rounded-lg border border-slate-200 py-3"
                >
                  <Text className="font-medium text-slate-800">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void submit()}
                  disabled={saving}
                  className="flex-1 items-center rounded-lg bg-blue-600 py-3"
                >
                  <Text className="font-semibold text-white">
                    {saving ? '…' : 'Submit'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </AppModal>

      <AppModal visible={detail != null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[88%] rounded-t-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Leave request</Text>
            {detail ? (
              <ScrollView className="mt-3">
                <Text className="text-slate-800">
                  {String(detail.leaveType)} · {String(detail.status)}
                </Text>
                <Text className="mt-2 text-slate-700">{detail.reason}</Text>
                <Text className="mt-2 text-sm text-slate-600">
                  {detail.startDate} → {detail.endDate}
                </Text>
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row flex-wrap gap-2">
              {detail &&
              detail.status === LeaveStatus.PENDING &&
              canManageHRM() ? (
                <Pressable
                  onPress={() => void approve(detail)}
                  className="flex-1 min-w-[40%] items-center rounded-lg bg-green-600 py-3"
                >
                  <Text className="font-semibold text-white">Approve</Text>
                </Pressable>
              ) : null}
              {detail && canManageHRM() ? (
                <Pressable
                  onPress={() => remove(detail)}
                  className="flex-1 min-w-[40%] items-center rounded-lg bg-red-600 py-3"
                >
                  <Text className="font-semibold text-white">Delete</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setDetail(null)}
                className="flex-1 min-w-[40%] items-center rounded-lg bg-slate-100 py-3"
              >
                <Text className="font-semibold text-slate-800">Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>
    </View>
  );
}
