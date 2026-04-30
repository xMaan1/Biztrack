import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, TextInput, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { apiService } from '../../../services/ApiService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatMoney } from '../../ledger/ledgerFormat';
import { AppModal } from '../../../components/layout/AppModal';

export function MobileSubscriptionManageScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const tenantId = apiService.getTenantId();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [sub, setSub] = useState<Record<string, unknown> | null>(null);
  const [billing, setBilling] = useState<Record<string, unknown> | null>(null);
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const [s, b, u] = await Promise.all([
        apiService.get('/tenants/current/subscription').catch(() => null),
        apiService.getSubscriptionBilling(tenantId).catch(() => null),
        apiService.getSubscriptionUsage(tenantId).catch(() => null),
      ]);
      let subscription: Record<string, unknown> | null = null;
      if (s && typeof s === 'object') {
        const o = s as {
          success?: boolean;
          subscription?: Record<string, unknown>;
        };
        if (o.subscription && typeof o.subscription === 'object') {
          subscription = o.subscription;
        }
      }
      setSub(subscription);
      setBilling(
        b && typeof b === 'object' ? (b as Record<string, unknown>) : null,
      );
      setUsage(u && typeof u === 'object' ? (u as Record<string, unknown>) : null);
    } catch (e) {
      Alert.alert('Subscription', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/subscription/manage',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const sync = useCallback(async () => {
    if (!tenantId) return;
    try {
      setSyncing(true);
      await apiService.syncSubscriptionStatus(tenantId);
      await load();
      Alert.alert('Subscription', 'Synced.');
    } catch (e) {
      Alert.alert('Subscription', extractErrorMessage(e, 'Sync failed'));
    } finally {
      setSyncing(false);
    }
  }, [tenantId, load]);

  const doCancel = useCallback(async () => {
    if (!tenantId || !cancelReason.trim()) {
      Alert.alert('Subscription', 'Enter a cancellation reason.');
      return;
    }
    try {
      setCancelling(true);
      await apiService.cancelSubscription(tenantId, cancelReason.trim());
      setCancelOpen(false);
      setCancelReason('');
      await load();
      Alert.alert('Subscription', 'Cancellation requested.');
    } catch (e) {
      Alert.alert('Subscription', extractErrorMessage(e, 'Cancel failed'));
    } finally {
      setCancelling(false);
    }
  }, [tenantId, cancelReason, load]);

  const plan = sub?.plan as Record<string, unknown> | undefined;

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Subscription
        </Text>
        <View className="w-9" />
      </View>

      {!tenantId ? (
        <View className="flex-1 justify-center px-6">
          <Text className="text-center text-slate-600">
            Select a workspace to manage subscription.
          </Text>
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-3 py-4">
          {plan ? (
            <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-lg font-bold text-slate-900">
                {String(plan.name ?? 'Plan')}
              </Text>
              <Text className="text-sm text-slate-600">
                {String(plan.planType ?? '')}
              </Text>
              {typeof plan.price === 'number' ? (
                <Text className="mt-2 text-base text-slate-800">
                  {formatMoney(plan.price)} / {String(plan.billingCycle ?? '')}
                </Text>
              ) : null}
            </View>
          ) : null}

          {billing ? (
            <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="mb-2 font-semibold text-slate-900">Billing</Text>
              <Kv k="Status" v={String(billing.status ?? '—')} />
              <Kv k="Plan" v={String(billing.plan_name ?? '—')} />
              {typeof billing.monthly_price === 'number' ? (
                <Kv
                  k="Price"
                  v={formatMoney(billing.monthly_price as number)}
                />
              ) : null}
              <Kv k="Next billing" v={String(billing.next_billing_date ?? '—')} />
            </View>
          ) : null}

          {usage ? (
            <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <Text className="mb-2 font-semibold text-slate-900">Usage</Text>
              <UsageBlock label="Projects" u={usage.projects as Record<string, number> | undefined} />
              <UsageBlock label="Users" u={usage.users as Record<string, number> | undefined} />
            </View>
          ) : null}

          <Pressable
            className="mb-3 items-center rounded-xl border border-slate-300 bg-white py-3"
            disabled={syncing}
            onPress={() => void sync()}
          >
            <Text className="font-semibold text-slate-900">
              {syncing ? 'Syncing…' : 'Sync status'}
            </Text>
          </Pressable>

          <Pressable
            className="items-center rounded-xl bg-red-600 py-3"
            onPress={() => setCancelOpen(true)}
          >
            <Text className="font-semibold text-white">Cancel subscription</Text>
          </Pressable>
        </ScrollView>
      )}

      <AppModal
        visible={cancelOpen}
        animationType="slide"
        transparent
        onClose={() => setCancelOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">
              Cancel subscription
            </Text>
            <TextInput
              className="mt-3 min-h-[100px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Reason"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <Pressable
              className="mt-4 items-center rounded-lg bg-red-600 py-3"
              disabled={cancelling}
              onPress={() => void doCancel()}
            >
              <Text className="font-semibold text-white">Submit</Text>
            </Pressable>
            <Pressable
              className="mt-2 py-2"
              onPress={() => {
                setCancelOpen(false);
                setCancelReason('');
              }}
            >
              <Text className="text-center text-slate-600">Close</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>
    </View>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <View className="mb-1 flex-row justify-between">
      <Text className="text-slate-600">{k}</Text>
      <Text className="max-w-[60%] text-right text-slate-900">{v}</Text>
    </View>
  );
}

function UsageBlock({
  label,
  u,
}: {
  label: string;
  u?: Record<string, number>;
}) {
  if (!u) return null;
  const cur = u.current ?? 0;
  const lim = u.limit ?? 0;
  return (
    <Text className="mb-1 text-sm text-slate-700">
      {label}: {cur} / {lim}
    </Text>
  );
}
