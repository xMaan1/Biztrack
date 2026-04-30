import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, RefreshControl, Alert, Linking } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { AppModal } from '../../../components/layout/AppModal';
import {
  deleteSavedReport,
  exportReportsDashboard,
  fetchReportsDashboard,
  listSavedReports,
  renameSavedReport,
  uploadSavedReport,
  type SavedReportItem,
} from '../../../services/reports/reportsMobileApi';

function num(n: unknown): string {
  if (typeof n === 'number' && !Number.isNaN(n)) {
    return new Intl.NumberFormat('en-US').format(Math.round(n * 100) / 100);
  }
  return '0';
}

function MetricCard(props: {
  title: string;
  value: string;
  hint?: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-slate-600">{props.title}</Text>
        <Ionicons name={props.icon} size={18} color="#64748b" />
      </View>
      <Text className="mt-2 text-2xl font-bold text-slate-900">{props.value}</Text>
      {props.hint ? (
        <Text className="mt-1 text-xs text-slate-500">{props.hint}</Text>
      ) : null}
    </View>
  );
}

export function MobileReportsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canExportReports } = usePermissions();

  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [saved, setSaved] = useState<SavedReportItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [pickedUri, setPickedUri] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  const loadDash = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchReportsDashboard({
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
      });
      setDash(data);
    } catch (e) {
      setError(extractErrorMessage(e, 'Failed to load reports'));
      setDash(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const loadSaved = useCallback(async () => {
    try {
      setSavedLoading(true);
      const list = await listSavedReports();
      setSaved(list);
    } catch {
      setSaved([]);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/reports',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadDash();
  }, [loadDash]);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadDash(), loadSaved()]);
    setRefreshing(false);
  }, [loadDash, loadSaved]);

  const applyDateFilter = useCallback(() => {
    void loadDash();
  }, [loadDash]);

  const wo = (dash?.work_orders ?? {}) as Record<string, unknown>;
  const pr = (dash?.projects ?? {}) as Record<string, unknown>;
  const hrm = (dash?.hrm ?? {}) as Record<string, unknown>;
  const inv = (dash?.inventory ?? {}) as Record<string, unknown>;
  const fin = (dash?.financial ?? {}) as Record<string, unknown>;

  const handleExport = useCallback(async () => {
    if (!canExportReports()) {
      Alert.alert('Reports', 'You do not have permission to export.');
      return;
    }
    try {
      setExportBusy(true);
      const payload = await exportReportsDashboard({
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
      });
      const json = JSON.stringify(payload, null, 2);
      const fn = `reports-export-${Date.now()}.json`;
      const path = `${FileSystem.cacheDirectory ?? ''}${fn}`;
      await FileSystem.writeAsStringAsync(path, json);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'Export reports',
        });
      } else {
        Alert.alert('Export', 'Saved to app cache. Sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Export', extractErrorMessage(e, 'Export failed'));
    } finally {
      setExportBusy(false);
    }
  }, [canExportReports, startDate, endDate]);

  const pickFile = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const name = a.name || 'report.pdf';
      const lower = name.toLowerCase();
      const type =
        lower.endsWith('.csv') ? 'text/csv' : 'application/pdf';
      setPickedUri({
        uri: a.uri,
        name,
        type,
      });
    } catch (e) {
      Alert.alert('Reports', extractErrorMessage(e, 'Could not pick file'));
    }
  }, []);

  const submitUpload = useCallback(async () => {
    if (!newTitle.trim() || !pickedUri) {
      Alert.alert('Reports', 'Title and file are required.');
      return;
    }
    try {
      setSaveBusy(true);
      await uploadSavedReport(newTitle.trim(), pickedUri);
      setAddOpen(false);
      setNewTitle('');
      setPickedUri(null);
      await loadSaved();
    } catch (e) {
      Alert.alert('Reports', extractErrorMessage(e, 'Upload failed'));
    } finally {
      setSaveBusy(false);
    }
  }, [newTitle, pickedUri, loadSaved]);

  const submitRename = useCallback(async () => {
    if (!renameId || !renameTitle.trim()) return;
    try {
      setSaveBusy(true);
      await renameSavedReport(renameId, renameTitle.trim());
      setRenameOpen(false);
      setRenameId(null);
      await loadSaved();
    } catch (e) {
      Alert.alert('Reports', extractErrorMessage(e, 'Rename failed'));
    } finally {
      setSaveBusy(false);
    }
  }, [renameId, renameTitle, loadSaved]);

  const confirmDeleteSaved = useCallback(
    (id: string) => {
      Alert.alert('Delete report', 'Remove this stored file?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteSavedReport(id);
                await loadSaved();
              } catch (e) {
                Alert.alert('Reports', extractErrorMessage(e, 'Delete failed'));
              }
            })();
          },
        },
      ]);
    },
    [loadSaved],
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Reports
        </Text>
        <Pressable
          className="px-2 py-1"
          disabled={exportBusy || !canExportReports()}
          onPress={() => void handleExport()}
        >
          {exportBusy ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <Ionicons
              name="download-outline"
              size={26}
              color={canExportReports() ? '#2563eb' : '#cbd5e1'}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-3 pt-3"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text className="mb-2 text-base font-semibold text-slate-900">
          Date range
        </Text>
        <View className="mb-3 flex-row gap-2">
          <TextInput
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            placeholder="Start YYYY-MM-DD"
            value={startDate}
            onChangeText={setStartDate}
          />
          <TextInput
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            placeholder="End YYYY-MM-DD"
            value={endDate}
            onChangeText={setEndDate}
          />
        </View>
        <Pressable
          className="mb-4 items-center rounded-lg bg-slate-200 py-2"
          onPress={applyDateFilter}
        >
          <Text className="font-semibold text-slate-800">Apply</Text>
        </Pressable>

        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-slate-900">
            Stored reports
          </Text>
          <Pressable
            className="flex-row items-center rounded-lg bg-blue-600 px-3 py-1.5"
            onPress={() => {
              setNewTitle('');
              setPickedUri(null);
              setAddOpen(true);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text className="ml-1 font-semibold text-white">Add</Text>
          </Pressable>
        </View>

        {savedLoading ? (
          <ActivityIndicator className="py-4" color="#2563eb" />
        ) : saved.length === 0 ? (
          <Text className="mb-4 text-sm text-slate-500">
            No stored reports. Upload a PDF or CSV (max 10MB).
          </Text>
        ) : (
          saved.map((r) => (
            <View
              key={r.id}
              className="mb-2 rounded-lg border border-slate-200 bg-white p-3"
            >
              <Text className="font-medium text-slate-900">{r.title}</Text>
              <Text className="mt-1 text-xs text-slate-500">
                {r.file_type.toUpperCase()}
                {typeof r.file_size === 'number'
                  ? ` · ${(r.file_size / 1024).toFixed(1)} KB`
                  : ''}
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Pressable
                  className="rounded-lg bg-slate-100 px-3 py-1.5"
                  onPress={() => void Linking.openURL(r.file_url)}
                >
                  <Text className="text-sm font-medium text-slate-800">Open</Text>
                </Pressable>
                <Pressable
                  className="rounded-lg bg-slate-100 px-3 py-1.5"
                  onPress={() => {
                    setRenameId(r.id);
                    setRenameTitle(r.title);
                    setRenameOpen(true);
                  }}
                >
                  <Text className="text-sm font-medium text-slate-800">Rename</Text>
                </Pressable>
                <Pressable
                  className="rounded-lg bg-red-50 px-3 py-1.5"
                  onPress={() => confirmDeleteSaved(r.id)}
                >
                  <Text className="text-sm font-medium text-red-700">Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {error ? (
          <View className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <Text className="text-red-800">{error}</Text>
            <Pressable className="mt-2" onPress={() => void loadDash()}>
              <Text className="font-semibold text-red-900">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !dash ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : null}

        {!loading && dash ? (
          <>
            <Text className="mb-2 mt-4 text-lg font-semibold text-slate-900">
              Overview
            </Text>
            <MetricCard
              title="Work orders"
              value={num(wo.total_work_orders)}
              hint={`${num(wo.completed_work_orders)} completed · ${num(wo.completion_rate)}% rate`}
              icon="construct-outline"
            />
            <MetricCard
              title="Projects"
              value={num(pr.total_projects)}
              hint={`${num(pr.active_projects)} active`}
              icon="folder-outline"
            />
            <MetricCard
              title="Employees"
              value={num(hrm.total_employees)}
              hint={`${num(hrm.active_employees)} active`}
              icon="people-outline"
            />
            <MetricCard
              title="Inventory value"
              value={num(inv.total_stock_value)}
              hint={`${num(inv.low_stock_products)} low stock`}
              icon="cube-outline"
            />
            <MetricCard
              title="Net profit"
              value={num(fin.net_profit)}
              hint={`Revenue ${num(fin.total_revenue)} · Expenses ${num(fin.total_expenses)}`}
              icon="cash-outline"
            />
          </>
        ) : null}

        <View className="h-8" />
      </ScrollView>

      <AppModal
        visible={addOpen}
        animationType="slide"
        transparent
        onClose={() => setAddOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Upload report</Text>
            <Text className="mb-2 mt-1 text-sm text-slate-500">PDF or CSV</Text>
            <Text className="mb-1 text-xs font-medium text-slate-500">Title</Text>
            <TextInput
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Report title"
            />
            <Pressable
              className="mb-3 rounded-lg border border-slate-200 bg-slate-50 py-3"
              onPress={() => void pickFile()}
            >
              <Text className="text-center text-slate-800">
                {pickedUri ? pickedUri.name : 'Choose file'}
              </Text>
            </Pressable>
            <Pressable
              className="items-center rounded-lg bg-blue-600 py-3"
              disabled={saveBusy}
              onPress={() => void submitUpload()}
            >
              <Text className="font-semibold text-white">
                {saveBusy ? 'Uploading…' : 'Upload'}
              </Text>
            </Pressable>
            <Pressable className="mt-2 py-2" onPress={() => setAddOpen(false)}>
              <Text className="text-center text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <AppModal
        visible={renameOpen}
        animationType="fade"
        transparent
        onClose={() => setRenameOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/40 px-4">
          <View className="rounded-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Rename</Text>
            <TextInput
              className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              value={renameTitle}
              onChangeText={setRenameTitle}
            />
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable className="px-4 py-2" onPress={() => setRenameOpen(false)}>
                <Text>Cancel</Text>
              </Pressable>
              <Pressable
                className="rounded-lg bg-blue-600 px-4 py-2"
                disabled={saveBusy}
                onPress={() => void submitRename()}
              >
                <Text className="font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>
    </View>
  );
}
