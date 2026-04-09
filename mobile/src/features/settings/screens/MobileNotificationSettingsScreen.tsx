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
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  NotificationCategory,
  getCategoryDisplayName,
  type NotificationPreference,
} from '../../../models/notifications';
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from '../../../services/settings/notificationsPreferencesMobileApi';

const CATEGORIES: NotificationCategory[] = [
  NotificationCategory.SYSTEM,
  NotificationCategory.INVENTORY,
  NotificationCategory.CRM,
  NotificationCategory.HRM,
  NotificationCategory.MAINTENANCE,
  NotificationCategory.QUALITY,
  NotificationCategory.LEDGER,
];

function normalizePref(raw: Record<string, unknown>): NotificationPreference {
  const cat = String(raw.category ?? '');
  return {
    id: String(raw.id ?? ''),
    tenant_id: String(raw.tenant_id ?? ''),
    user_id: String(raw.user_id ?? ''),
    category: cat as NotificationCategory,
    email_enabled: Boolean(raw.email_enabled),
    push_enabled: Boolean(raw.push_enabled),
    in_app_enabled: Boolean(raw.in_app_enabled),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  };
}

export function MobileNotificationSettingsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getNotificationPreferences();
      const mapped = (list as unknown as Record<string, unknown>[]).map(
        (x) => normalizePref(x),
      );
      setPrefs(mapped);
    } catch (e) {
      Alert.alert('Notifications', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/notifications/settings',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const getPref = (cat: NotificationCategory) =>
    prefs.find((p) => p.category === cat);

  const patch = (
    cat: NotificationCategory,
    field: 'email_enabled' | 'push_enabled' | 'in_app_enabled',
    val: boolean,
  ) => {
    setPrefs((prev) => {
      const i = prev.findIndex((p) => p.category === cat);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], [field]: val };
        return next;
      }
      return [
        ...prev,
        {
          id: '',
          tenant_id: '',
          user_id: '',
          category: cat,
          email_enabled: field === 'email_enabled' ? val : true,
          push_enabled: field === 'push_enabled' ? val : true,
          in_app_enabled: field === 'in_app_enabled' ? val : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    });
  };

  const saveAll = useCallback(async () => {
    try {
      setSaving(true);
      for (const cat of CATEGORIES) {
        const p = prefs.find((x) => x.category === cat);
        await updateNotificationPreference({
          category: cat,
          email_enabled: p?.email_enabled ?? true,
          push_enabled: p?.push_enabled ?? true,
          in_app_enabled: p?.in_app_enabled ?? true,
        });
      }
      await load();
      Alert.alert('Notifications', 'Saved.');
    } catch (e) {
      Alert.alert('Notifications', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  }, [prefs, load]);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Notifications
        </Text>
        <View className="w-9" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-3 py-3">
          <Text className="mb-3 text-sm text-slate-600">
            Choose channels per category. Tap Save to apply.
          </Text>
          {CATEGORIES.map((cat) => {
            const p = getPref(cat);
            return (
              <View
                key={cat}
                className="mb-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <Text className="mb-2 font-semibold text-slate-900">
                  {getCategoryDisplayName(cat)}
                </Text>
                <ToggleRow
                  label="Email"
                  value={p?.email_enabled ?? true}
                  onToggle={(v) => patch(cat, 'email_enabled', v)}
                />
                <ToggleRow
                  label="Push"
                  value={p?.push_enabled ?? true}
                  onToggle={(v) => patch(cat, 'push_enabled', v)}
                />
                <ToggleRow
                  label="In-app"
                  value={p?.in_app_enabled ?? true}
                  onToggle={(v) => patch(cat, 'in_app_enabled', v)}
                />
              </View>
            );
          })}
          <Pressable
            className="mb-8 items-center rounded-xl bg-blue-600 py-3"
            disabled={saving}
            onPress={() => void saveAll()}
          >
            <Text className="font-semibold text-white">
              {saving ? 'Saving…' : 'Save preferences'}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function ToggleRow(props: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text className="text-slate-700">{props.label}</Text>
      <Pressable
        className={`rounded-full px-4 py-1 ${
          props.value ? 'bg-blue-600' : 'bg-slate-200'
        }`}
        onPress={() => props.onToggle(!props.value)}
      >
        <Text className={`text-sm font-medium ${props.value ? 'text-white' : 'text-slate-600'}`}>
          {props.value ? 'On' : 'Off'}
        </Text>
      </Pressable>
    </View>
  );
}
