import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert, Linking, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { apiService } from '../../../services/ApiService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { usePermissions } from '../../../hooks/usePermissions';
import { AppModal } from '../../../components/layout/AppModal';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location?: string;
  isOnline: boolean;
  googleMeetLink?: string;
  participants: string[];
  status: string;
  projectId?: string;
}

const STATUS_OPTS = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const TYPE_OPTS = [
  { value: 'all', label: 'All types' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'other', label: 'Other' },
] as const;

function label(s: string): string {
  return s.replace(/_/g, ' ');
}

export function MobileEventsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageEvents } = usePermissions();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusOpen, setStatusOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const [googleOk, setGoogleOk] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [participants, setParticipants] = useState('');
  const [typePickOpen, setTypePickOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);

  const checkGoogle = useCallback(async () => {
    try {
      const res = await apiService.getGoogleAuthStatus();
      setGoogleOk(Boolean((res as { authorized?: boolean }).authorized));
    } catch {
      setGoogleOk(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getEvents({ limit: 200 });
      const list = (res as { events?: CalendarEvent[] }).events ?? [];
      setEvents(list);
    } catch (e) {
      Alert.alert('Events', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/events',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadEvents();
    void checkGoogle();
  }, [loadEvents, checkGoogle]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void checkGoogle();
    });
    return () => sub.remove();
  }, [checkGoogle]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadEvents(), checkGoogle()]);
    setRefreshing(false);
  }, [loadEvents, checkGoogle]);

  const connectGoogle = useCallback(async () => {
    try {
      setAuthBusy(true);
      const res = await apiService.getGoogleAuthUrl();
      const url = (res as { authorization_url?: string }).authorization_url;
      if (!url) {
        Alert.alert('Events', 'No authorization URL returned.');
        return;
      }
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Events', 'Cannot open browser for Google Calendar.');
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Events', extractErrorMessage(e, 'Connect failed'));
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const filtered = useMemo(() => {
    return events.filter((ev) => {
      const q = search.toLowerCase();
      const matchSearch =
        ev.title.toLowerCase().includes(q) ||
        (ev.description?.toLowerCase().includes(q) ?? false);
      const matchStatus =
        statusFilter === 'all' || ev.status === statusFilter;
      const matchType = typeFilter === 'all' || ev.eventType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [events, search, statusFilter, typeFilter]);

  const submitCreate = useCallback(async () => {
    if (!title.trim() || !startDate || !endDate) {
      Alert.alert('Events', 'Title, start date, and end date are required.');
      return;
    }
    try {
      setCreateBusy(true);
      const start = new Date(`${startDate}T${startTime || '09:00'}`);
      const end = new Date(`${endDate}T${endTime || '10:00'}`);
      await apiService.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        eventType,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: location.trim() || undefined,
        isOnline,
        participants: participants
          ? participants.split(',').map((p) => p.trim()).filter(Boolean)
          : [],
        discussionPoints: [],
        reminderMinutes: 15,
        recurrenceType: undefined,
      });
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      await loadEvents();
    } catch (e) {
      Alert.alert('Events', extractErrorMessage(e, 'Create failed'));
    } finally {
      setCreateBusy(false);
    }
  }, [
    title,
    description,
    eventType,
    startDate,
    startTime,
    endDate,
    endTime,
    location,
    isOnline,
    participants,
    loadEvents,
  ]);

  const onJoin = useCallback(
    async (ev: CalendarEvent) => {
      try {
        if (ev.googleMeetLink) {
          await Linking.openURL(ev.googleMeetLink);
          return;
        }
        const res = await apiService.joinEvent(ev.id);
        const link = (res as { meet_link?: string }).meet_link;
        if (link) await Linking.openURL(link);
        await loadEvents();
      } catch (e) {
        Alert.alert('Events', extractErrorMessage(e, 'Join failed'));
      }
    },
    [loadEvents],
  );

  const onLeave = useCallback(
    async (id: string) => {
      try {
        await apiService.leaveEvent(id);
        await loadEvents();
      } catch (e) {
        Alert.alert('Events', extractErrorMessage(e, 'Leave failed'));
      }
    },
    [loadEvents],
  );

  const onDelete = useCallback(
    (ev: CalendarEvent) => {
      Alert.alert('Delete event', `Remove "${ev.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await apiService.deleteEvent(ev.id);
                await loadEvents();
              } catch (e) {
                Alert.alert('Events', extractErrorMessage(e, 'Delete failed'));
              }
            })();
          },
        },
      ]);
    },
    [loadEvents],
  );

  const typeFormOptions = TYPE_OPTS.filter((o) => o.value !== 'all');

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Events
        </Text>
        {canManageEvents() ? (
          <Pressable
            className="px-2 py-1"
            onPress={() => {
              setTitle('');
              setDescription('');
              setEventType('meeting');
              setStartDate('');
              setEndDate('');
              setStartTime('09:00');
              setEndTime('10:00');
              setLocation('');
              setIsOnline(true);
              setParticipants('');
              setCreateOpen(true);
            }}
          >
            <Ionicons name="add-circle" size={28} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
      </View>

      {!googleOk ? (
        <View className="border-b border-amber-200 bg-amber-50 px-3 py-2">
          <Text className="text-sm text-amber-900">
            Connect Google Calendar for Meet links and sync.
          </Text>
          <Pressable
            className="mt-2 items-center rounded-lg border border-amber-300 bg-white py-2"
            disabled={authBusy}
            onPress={() => void connectGoogle()}
          >
            <Text className="font-semibold text-amber-900">
              {authBusy ? 'Opening…' : 'Connect Google Calendar'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View className="border-b border-slate-200 bg-white px-3 py-2">
        <View className="mb-2 flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-2">
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            className="flex-1 py-2 pl-2 text-slate-900"
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
            onPress={() => setStatusOpen(true)}
          >
            <Text className="text-sm text-slate-900" numberOfLines={1}>
              {STATUS_OPTS.find((o) => o.value === statusFilter)?.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 py-2"
            onPress={() => setTypeOpen(true)}
          >
            <Text className="text-sm text-slate-900" numberOfLines={1}>
              {TYPE_OPTS.find((o) => o.value === typeFilter)?.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {loading && events.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View className="border-b border-slate-100 bg-white px-4 py-3">
              <Text className="text-base font-semibold text-slate-900">
                {item.title}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                {label(item.status)} · {label(item.eventType)}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                {item.startDate ? new Date(item.startDate).toLocaleString() : ''}
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Pressable
                  className="rounded-lg bg-blue-50 px-3 py-1.5"
                  onPress={() => void onJoin(item)}
                >
                  <Text className="text-sm font-medium text-blue-800">Join</Text>
                </Pressable>
                <Pressable
                  className="rounded-lg bg-slate-100 px-3 py-1.5"
                  onPress={() => void onLeave(item.id)}
                >
                  <Text className="text-sm font-medium text-slate-800">Leave</Text>
                </Pressable>
                {canManageEvents() ? (
                  <Pressable
                    className="rounded-lg bg-red-50 px-3 py-1.5"
                    onPress={() => onDelete(item)}
                  >
                    <Text className="text-sm font-medium text-red-700">Delete</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">No events</Text>
          }
        />
      )}

      <AppModal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">New event</Text>
            <ScrollView className="mt-3" keyboardShouldPersistTaps="handled">
              <Text className="mb-1 text-xs font-medium text-slate-500">Title</Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={title}
                onChangeText={setTitle}
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">Description</Text>
              <TextInput
                className="mb-3 min-h-[64px] rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">Type</Text>
              <Pressable
                className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                onPress={() => setTypePickOpen(true)}
              >
                <Text className="text-slate-900">{label(eventType)}</Text>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </Pressable>
              <Text className="mb-1 text-xs font-medium text-slate-500">Start date</Text>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="YYYY-MM-DD"
                value={startDate}
                onChangeText={setStartDate}
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">Start time</Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="HH:MM"
                value={startTime}
                onChangeText={setStartTime}
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">End date</Text>
              <TextInput
                className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="YYYY-MM-DD"
                value={endDate}
                onChangeText={setEndDate}
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">End time</Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="HH:MM"
                value={endTime}
                onChangeText={setEndTime}
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">Location</Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={location}
                onChangeText={setLocation}
              />
              <Text className="mb-1 text-xs font-medium text-slate-500">Participants (emails, comma)</Text>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
                value={participants}
                onChangeText={setParticipants}
              />
              <Pressable
                className="mb-4 flex-row items-center"
                onPress={() => setIsOnline((v) => !v)}
              >
                <Ionicons
                  name={isOnline ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={isOnline ? '#2563eb' : '#94a3b8'}
                />
                <Text className="ml-2 text-slate-800">Online meeting</Text>
              </Pressable>
            </ScrollView>
            <Pressable
              className="items-center rounded-lg bg-blue-600 py-3"
              disabled={createBusy}
              onPress={() => void submitCreate()}
            >
              <Text className="font-semibold text-white">
                {createBusy ? 'Creating…' : 'Create'}
              </Text>
            </Pressable>
            <Pressable className="mt-2 py-2" onPress={() => setCreateOpen(false)}>
              <Text className="text-center text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={[...STATUS_OPTS]}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />
      <OptionSheet
        visible={typeOpen}
        title="Type"
        options={[...TYPE_OPTS]}
        onSelect={(v) => {
          setTypeFilter(v);
          setTypeOpen(false);
        }}
        onClose={() => setTypeOpen(false)}
      />
      <OptionSheet
        visible={typePickOpen}
        title="Event type"
        options={typeFormOptions.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
        onSelect={(v) => {
          setEventType(v);
          setTypePickOpen(false);
        }}
        onClose={() => setTypePickOpen(false)}
      />
    </View>
  );
}
