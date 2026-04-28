import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type { Vehicle, VehicleCreate, VehicleUpdate } from '../../../models/workshop/Vehicle';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../../../services/workshop/workshopMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { AppModal } from '../../../components/layout/AppModal';
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopFieldLabel,
  WorkshopPrimaryButton,
} from '../components/WorkshopChrome';

export function MobileWorkshopVehiclesScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [list, setList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    make: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    registration_number: '',
    mileage: '',
    customer_id: '',
    notes: '',
  });

  useEffect(() => {
    setSidebarActivePath('/workshop-management/vehicles');
  }, [setSidebarActivePath]);

  const load = useCallback(async () => {
    const data = await getVehicles();
    setList(data);
  }, []);

  const run = useCallback(
    async (ref: boolean) => {
      try {
        if (ref) setRefreshing(true);
        else setLoading(true);
        await load();
      } catch (e) {
        Alert.alert('Vehicles', extractErrorMessage(e, 'Failed to load'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [load],
  );

  useEffect(() => {
    void run(false);
  }, [run]);

  const filtered = list.filter((v) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (v.make || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.registration_number || '').toLowerCase().includes(q) ||
      (v.vin || '').toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      make: '',
      model: '',
      year: '',
      color: '',
      vin: '',
      registration_number: '',
      mileage: '',
      customer_id: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      make: v.make || '',
      model: v.model || '',
      year: v.year || '',
      color: v.color || '',
      vin: v.vin || '',
      registration_number: v.registration_number || '',
      mileage: v.mileage || '',
      customer_id: v.customer_id || '',
      notes: v.notes || '',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const payload: VehicleCreate | VehicleUpdate = {
      make: form.make || undefined,
      model: form.model || undefined,
      year: form.year || undefined,
      color: form.color || undefined,
      vin: form.vin || undefined,
      registration_number: form.registration_number || undefined,
      mileage: form.mileage || undefined,
      customer_id: form.customer_id || undefined,
      notes: form.notes || undefined,
    };
    try {
      setSaving(true);
      if (editing) {
        await updateVehicle(editing.id, payload as VehicleUpdate);
      } else {
        await createVehicle(payload as VehicleCreate);
      }
      setModalOpen(false);
      await run(false);
    } catch (e) {
      Alert.alert('Vehicle', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (v: Vehicle) => {
    Alert.alert('Delete', v.registration_number || v.vin || v.id, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicle(v.id);
            await run(false);
          } catch (e) {
            Alert.alert('Vehicle', extractErrorMessage(e, 'Delete failed'));
          }
        },
      },
    ]);
  };

  return (
    <WorkshopChrome
      title="Vehicles"
      subtitle="Fleet & customer vehicles"
      right={
        <Pressable onPress={openCreate} className="p-2">
          <Ionicons name="add-circle" size={26} color="#4f46e5" />
        </Pressable>
      }
      scroll={false}
    >
      <TextInput
        className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2"
        placeholder="Search reg, VIN, make…"
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />
      {loading && !refreshing ? (
        <View className="py-12 items-center">
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={filtered}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void run(true)}
              tintColor="#4f46e5"
            />
          }
          renderItem={({ item: v }) => (
            <WorkshopCard>
              <Text className="font-semibold text-slate-900">
                {[v.make, v.model].filter(Boolean).join(' ') || 'Vehicle'}
              </Text>
              <Text className="text-xs text-slate-500">
                {v.registration_number || '—'} · {v.vin || '—'}
              </Text>
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  onPress={() => openEdit(v)}
                  className="rounded-lg bg-indigo-100 px-2 py-1"
                >
                  <Text className="text-xs font-medium text-indigo-900">Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => remove(v)}
                  className="rounded-lg bg-red-50 px-2 py-1"
                >
                  <Text className="text-xs text-red-700">Delete</Text>
                </Pressable>
              </View>
            </WorkshopCard>
          )}
        />
      )}

      <AppModal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold">
              {editing ? 'Edit vehicle' : 'New vehicle'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <WorkshopFieldLabel>Registration</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.registration_number}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, registration_number: v }))
                }
              />
              <WorkshopFieldLabel>VIN</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.vin}
                onChangeText={(v) => setForm((f) => ({ ...f, vin: v }))}
              />
              <View className="mb-2 flex-row gap-2">
                <View className="flex-1">
                  <WorkshopFieldLabel>Make</WorkshopFieldLabel>
                  <TextInput
                    className="rounded-lg border border-slate-200 px-2 py-2"
                    value={form.make}
                    onChangeText={(v) => setForm((f) => ({ ...f, make: v }))}
                  />
                </View>
                <View className="flex-1">
                  <WorkshopFieldLabel>Model</WorkshopFieldLabel>
                  <TextInput
                    className="rounded-lg border border-slate-200 px-2 py-2"
                    value={form.model}
                    onChangeText={(v) => setForm((f) => ({ ...f, model: v }))}
                  />
                </View>
              </View>
              <View className="mb-2 flex-row gap-2">
                <View className="w-24">
                  <WorkshopFieldLabel>Year</WorkshopFieldLabel>
                  <TextInput
                    className="rounded-lg border border-slate-200 px-2 py-2"
                    value={form.year}
                    onChangeText={(v) => setForm((f) => ({ ...f, year: v }))}
                  />
                </View>
                <View className="flex-1">
                  <WorkshopFieldLabel>Color</WorkshopFieldLabel>
                  <TextInput
                    className="rounded-lg border border-slate-200 px-2 py-2"
                    value={form.color}
                    onChangeText={(v) => setForm((f) => ({ ...f, color: v }))}
                  />
                </View>
              </View>
              <WorkshopFieldLabel>Mileage</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.mileage}
                onChangeText={(v) => setForm((f) => ({ ...f, mileage: v }))}
              />
              <WorkshopFieldLabel>Customer ID (optional)</WorkshopFieldLabel>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2"
                value={form.customer_id}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, customer_id: v }))
                }
                autoCapitalize="none"
              />
              <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
              <TextInput
                className="mb-4 rounded-lg border border-slate-200 px-3 py-2"
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
              />
            </ScrollView>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save'}
              onPress={() => void submit()}
              disabled={saving}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setModalOpen(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>
    </WorkshopChrome>
  );
}
