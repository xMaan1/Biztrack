import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet, type OptionItem } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  getInvoiceCustomization,
  updateInvoiceCustomization,
} from '../../../services/settings/invoiceCustomizationMobileApi';

const CURRENCIES: OptionItem<string>[] = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
];

export function MobileGeneralSettingsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const c = await getInvoiceCustomization();
      setCurrency(c.default_currency || 'USD');
      setDirty(false);
    } catch (e) {
      Alert.alert('Settings', extractErrorMessage(e, 'Could not load settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/settings',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    try {
      setSaving(true);
      await updateInvoiceCustomization({ default_currency: currency });
      setDirty(false);
      Alert.alert('Settings', 'Saved.');
    } catch (e) {
      Alert.alert('Settings', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  }, [currency]);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Settings
        </Text>
        <View className="w-9" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-3 py-4">
          <Text className="mb-2 text-base font-semibold text-slate-900">
            Currency
          </Text>
          <Text className="mb-2 text-sm text-slate-600">
            Default currency for invoices and financial displays.
          </Text>
          <Pressable
            className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
            onPress={() => setSheetOpen(true)}
          >
            <Text className="text-slate-900">
              {CURRENCIES.find((c) => c.value === currency)?.label ?? currency}
            </Text>
            <Text className="text-blue-600">Change</Text>
          </Pressable>

          <Pressable
            className={`mt-6 items-center rounded-xl py-3 ${
              dirty ? 'bg-blue-600' : 'bg-slate-300'
            }`}
            disabled={!dirty || saving}
            onPress={() => void save()}
          >
            <Text className="font-semibold text-white">
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <OptionSheet
        visible={sheetOpen}
        title="Default currency"
        options={CURRENCIES}
        onSelect={(v) => {
          setCurrency(v);
          setDirty(true);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}
