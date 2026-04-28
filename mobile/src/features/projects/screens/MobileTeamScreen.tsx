import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type { ProjectTeamMemberRef } from '../../../models/project';
import { fetchProjectTeamMembers } from '../../../services/projects/projectMobileApi';

function roleLabel(role?: string): string {
  if (!role) return '';
  return role.replace(/_/g, ' ');
}

export function MobileTeamScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [members, setMembers] = useState<ProjectTeamMemberRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProjectTeamMembers();
      setMembers(res.teamMembers ?? []);
    } catch (e) {
      Alert.alert('Team', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/team',
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

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Team members
        </Text>
        <View className="w-9" />
      </View>

      {loading && members.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View className="border-b border-slate-100 bg-white px-4 py-3">
              <Text className="text-base font-semibold text-slate-900">
                {item.name}
              </Text>
              <Text className="mt-1 text-sm text-slate-600">{item.email}</Text>
              {item.role ? (
                <Text className="mt-1 text-xs uppercase text-slate-500">
                  {roleLabel(item.role)}
                </Text>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <Text className="py-8 text-center text-slate-500">
              No project managers or team members found
            </Text>
          }
        />
      )}
    </View>
  );
}
