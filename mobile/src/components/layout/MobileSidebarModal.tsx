import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  useSidebarFilteredMenu,
  evalSidebarPathPermission,
} from '../../hooks/useSidebarFilteredMenu';
import { usePermissions } from '../../hooks/usePermissions';
import type { SubMenuItemDef } from '../../navigation/sidebarMenuData';

function subRolesAllowed(
  sub: SubMenuItemDef,
  userRole: string | undefined,
  isOwner: () => boolean,
): boolean {
  if (isOwner()) return true;
  if (!sub.roles?.length || sub.roles.includes('*')) return true;
  if (!userRole) return false;
  return sub.roles.includes(userRole);
}

function getPlanDisplayName(
  isSuperAdmin: boolean,
  planInfo: { planType: string; planName: string } | null,
): string {
  if (isSuperAdmin) return 'Super Admin';
  if (!planInfo) return 'Loading…';
  switch (planInfo.planType) {
    case 'workshop':
      return 'Workshop Master';
    case 'commerce':
      return 'Commerce Pro';
    case 'healthcare':
      return 'Healthcare Suite';
    default:
      return planInfo.planName;
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
  activePath: string;
  onNavigatePath: (path: string) => void | Promise<void>;
};

export function MobileSidebarModal({
  visible,
  onClose,
  activePath,
  onNavigatePath,
}: Props) {
  const { user, logout } = useAuth();
  const { hasPermission, isOwner } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const { filteredItems, isSuperAdminNoTenant, menuBootLoading, planInfo } =
    useSidebarFilteredMenu(searchQuery);

  const toggleExpanded = useCallback((itemText: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemText)) next.delete(itemText);
      else next.add(itemText);
      return next;
    });
  }, []);

  const isActive = useCallback(
    (path: string) => {
      if (path === '/') return activePath === '/';
      return activePath.startsWith(path);
    },
    [activePath],
  );

  const onNavigate = useCallback(
    (path: string) => {
      void onNavigatePath(path);
    },
    [onNavigatePath],
  );

  useEffect(() => {
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    setExpandedItems((prev) => {
      const newExpanded = new Set(prev);
      filteredItems.forEach((item) => {
        if (
          item.subItems &&
          item.subItems.some((subItem) => {
            if (isSuperAdminNoTenant) {
              return subItem.text.toLowerCase().includes(query);
            }
            const subItemAvailable =
              subItem.planTypes.includes('*') ||
              (planInfo && subItem.planTypes.includes(planInfo.planType));
            return (
              subItemAvailable && subItem.text.toLowerCase().includes(query)
            );
          })
        ) {
          newExpanded.add(item.text);
        }
      });
      return newExpanded;
    });
  }, [searchQuery, filteredItems, planInfo, user, isSuperAdminNoTenant]);

  const planLabel = getPlanDisplayName(isSuperAdminNoTenant, planInfo);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row bg-black/50">
        <SafeAreaView
          edges={['top', 'bottom', 'left']}
          className="h-full w-[300px] max-w-[88%] border-r border-slate-200 bg-white"
        >
          <View className="border-b border-slate-200 px-4 pb-3 pt-2">
            <Text className="text-center text-xl font-bold text-blue-600">
              BizTrack
            </Text>
            {planInfo || isSuperAdminNoTenant ? (
              <View className="mt-2">
                <Text className="text-center text-xs text-slate-500">
                  Current plan
                </Text>
                <Text className="text-center text-sm font-semibold text-slate-700">
                  {planLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="border-b border-slate-200 px-3 py-3">
            <View className="relative justify-center">
              <View className="absolute left-3 z-10">
                <Ionicons name="search-outline" size={18} color="#94a3b8" />
              </View>
              <TextInput
                className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900"
                placeholder="Search modules…"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <Pressable
                  className="absolute right-2 top-2 z-10 p-1"
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            className="flex-1 px-3 py-3"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {menuBootLoading ? (
              <View className="gap-3 py-2">
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <View
                    key={k}
                    className="flex-row items-center gap-3 rounded-xl px-3 py-3"
                  >
                    <View className="h-10 w-10 rounded-lg bg-slate-200" />
                    <View className="h-4 flex-1 rounded bg-slate-200" />
                  </View>
                ))}
              </View>
            ) : (
              filteredItems.map((item) => {
                const isExpanded = expandedItems.has(item.text);
                const hasSubItems = !!(
                  item.subItems && item.subItems.length > 0
                );
                const isMainItemActive = !!(
                  item.path && isActive(item.path)
                );
                const hasActiveSubItem =
                  hasSubItems &&
                  item.subItems!.some((s) => isActive(s.path));

                return (
                  <View key={item.text} className="mb-2">
                    {item.path ? (
                      <Pressable
                        onPress={() => void onNavigate(item.path!)}
                        className={`flex-row items-center gap-3 rounded-xl px-3 py-3 ${
                          isMainItemActive
                            ? 'border border-blue-200 bg-blue-50'
                            : 'bg-slate-50 active:bg-slate-100'
                        }`}
                      >
                        <View
                          className={`rounded-lg p-2 ${
                            isMainItemActive ? 'bg-blue-100' : 'bg-white'
                          }`}
                        >
                          <Ionicons
                            name={item.icon as never}
                            size={22}
                            color={isMainItemActive ? '#2563eb' : '#475569'}
                          />
                        </View>
                        <Text
                          className={`flex-1 font-semibold ${
                            isMainItemActive ? 'text-blue-950' : 'text-slate-800'
                          }`}
                        >
                          {item.text}
                        </Text>
                        {isMainItemActive ? (
                          <View className="h-2 w-2 rounded-full bg-blue-500" />
                        ) : null}
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => toggleExpanded(item.text)}
                        className={`flex-row items-center justify-between rounded-xl px-3 py-3 ${
                          hasActiveSubItem
                            ? 'border border-blue-200 bg-blue-50'
                            : 'bg-slate-50 active:bg-slate-100'
                        }`}
                      >
                        <View className="flex-row items-center gap-3">
                          <View
                            className={`rounded-lg p-2 ${
                              hasActiveSubItem ? 'bg-blue-100' : 'bg-white'
                            }`}
                          >
                            <Ionicons
                              name={item.icon as never}
                              size={22}
                              color={
                                hasActiveSubItem ? '#2563eb' : '#475569'
                              }
                            />
                          </View>
                          <Text
                            className={`font-semibold ${
                              hasActiveSubItem
                                ? 'text-blue-950'
                                : 'text-slate-800'
                            }`}
                          >
                            {item.text}
                          </Text>
                        </View>
                        {hasSubItems ? (
                          <Ionicons
                            name="chevron-down-outline"
                            size={20}
                            color={hasActiveSubItem ? '#2563eb' : '#64748b'}
                            style={{
                              transform: [
                                { rotate: isExpanded ? '180deg' : '0deg' },
                              ],
                            }}
                          />
                        ) : null}
                      </Pressable>
                    )}

                    {hasSubItems && isExpanded ? (
                      <View className="ml-3 mt-1 border-l-2 border-slate-200 pl-3">
                        {item.subItems!.map((subItem) => {
                          const subItemAvailable =
                            subItem.planTypes.includes('*') ||
                            (planInfo &&
                              subItem.planTypes.includes(planInfo.planType));

                          if (!subItemAvailable) return null;

                          if (
                            !evalSidebarPathPermission(
                              subItem.path,
                              isOwner,
                              hasPermission,
                            )
                          ) {
                            return null;
                          }

                          if (
                            !subRolesAllowed(
                              subItem,
                              user?.userRole,
                              isOwner,
                            )
                          ) {
                            return null;
                          }

                          const subActive = isActive(subItem.path);

                          return (
                            <Pressable
                              key={subItem.text}
                              onPress={() => void onNavigate(subItem.path)}
                              className={`mb-1 flex-row items-center gap-2 rounded-lg px-2 py-2.5 ${
                                subActive
                                  ? 'border-l-2 border-blue-500 bg-blue-50'
                                  : 'active:bg-slate-50'
                              }`}
                            >
                              <View
                                className={`rounded-md p-1.5 ${
                                  subActive ? 'bg-blue-100' : 'bg-slate-100'
                                }`}
                              >
                                <Ionicons
                                  name={subItem.icon as never}
                                  size={18}
                                  color={subActive ? '#2563eb' : '#64748b'}
                                />
                              </View>
                              <Text
                                className={`flex-1 text-sm font-medium ${
                                  subActive
                                    ? 'text-blue-800'
                                    : 'text-slate-600'
                                }`}
                              >
                                {subItem.text}
                              </Text>
                              {subActive ? (
                                <View className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}

            {!menuBootLoading &&
            filteredItems.length === 0 &&
            searchQuery.trim() ? (
              <View className="items-center py-10">
                <Ionicons name="search-outline" size={40} color="#cbd5e1" />
                <Text className="mt-2 text-center font-medium text-slate-600">
                  No matches
                </Text>
                <Text className="mt-1 px-4 text-center text-xs text-slate-500">
                  Try another search term
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            {user?.email ? (
              <Text
                className="mb-2 text-center text-xs text-slate-500"
                numberOfLines={1}
              >
                {user.email}
              </Text>
            ) : null}
            <Pressable
              className="flex-row items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 active:bg-slate-300"
              onPress={() => {
                onClose();
                void logout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#334155" />
              <Text className="font-semibold text-slate-800">Sign out</Text>
            </Pressable>
            <Text className="mt-2 text-center text-xs text-slate-400">
              BizTrack
            </Text>
          </View>
        </SafeAreaView>

        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" />
      </View>
    </Modal>
  );
}
