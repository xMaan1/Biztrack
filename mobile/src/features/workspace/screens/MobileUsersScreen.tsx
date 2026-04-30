import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { useRBAC, type CreateUserData, type UserWithPermissions } from '../../../contexts/RBACContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { usePermissions } from '../../../hooks/usePermissions';
import { AppModal } from '../../../components/layout/AppModal';

function initials(u: UserWithPermissions): string {
  if (u.firstName && u.lastName) {
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }
  if (u.userName) return u.userName.substring(0, 2).toUpperCase();
  return 'U';
}

function roleLabel(name?: string): string {
  if (!name) return '';
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MobileUsersScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const {
    tenantUsers,
    roles,
    loading,
    fetchTenantUsers,
    fetchRoles,
    createUser,
    updateTenantUser,
    removeTenantUser,
    isOwner,
  } = useRBAC();
  const { canManageUsers } = usePermissions();

  const [refreshing, setRefreshing] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<UserWithPermissions | null>(null);

  const [form, setForm] = useState<CreateUserData>({
    userName: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [roleId, setRoleId] = useState('');
  const [roleOpen, setRoleOpen] = useState(false);
  const [editRoleId, setEditRoleId] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editRolePickOpen, setEditRolePickOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([fetchTenantUsers(), fetchRoles()]);
  }, [fetchTenantUsers, fetchRoles]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/users',
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

  const stats = useMemo(() => {
    const total = tenantUsers.length;
    const active = tenantUsers.filter((u) => u.isActive).length;
    const owners = tenantUsers.filter((u) => u.role?.name === 'owner').length;
    return { total, active, owners, roleCount: roles.length };
  }, [tenantUsers, roles]);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.display_name || r.name })),
    [roles],
  );

  const submitCreate = useCallback(async () => {
    if (!roleId) {
      Alert.alert('Users', 'Select a role.');
      return;
    }
    if (!form.email.trim() || !form.userName.trim() || !form.password) {
      Alert.alert('Users', 'Username, email, and password are required.');
      return;
    }
    try {
      setBusy(true);
      await createUser(
        {
          userName: form.userName.trim(),
          email: form.email.trim(),
          firstName: form.firstName?.trim() || undefined,
          lastName: form.lastName?.trim() || undefined,
          password: form.password,
        },
        roleId,
      );
      setCreateOpen(false);
      setForm({
        userName: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
      });
      setRoleId('');
      await load();
    } catch (e) {
      Alert.alert('Users', extractErrorMessage(e, 'Could not create user'));
    } finally {
      setBusy(false);
    }
  }, [form, roleId, createUser, load]);

  const openEdit = useCallback((u: UserWithPermissions) => {
    setSelected(u);
    setEditRoleId(u.role_id || u.role?.id || '');
    setEditActive(u.isActive);
    setEditOpen(true);
  }, []);

  const submitEdit = useCallback(async () => {
    if (!selected || !editRoleId) {
      Alert.alert('Users', 'Select a role.');
      return;
    }
    const tenantUserId =
      selected.tenant_user_id !== undefined && selected.tenant_user_id !== ''
        ? selected.tenant_user_id
        : selected.id;
    try {
      setBusy(true);
      await updateTenantUser(tenantUserId, {
        role_id: editRoleId,
        isActive: editActive,
      });
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('Users', extractErrorMessage(e, 'Could not update'));
    } finally {
      setBusy(false);
    }
  }, [selected, editRoleId, editActive, updateTenantUser, load]);

  const confirmRemove = useCallback(
    (u: UserWithPermissions) => {
      setSelected(u);
      setDeleteOpen(true);
    },
    [],
  );

  const doRemove = useCallback(async () => {
    if (!selected) return;
    try {
      setBusy(true);
      await removeTenantUser(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      Alert.alert('Users', extractErrorMessage(e, 'Could not remove'));
    } finally {
      setBusy(false);
    }
  }, [selected, removeTenantUser, load]);

  if (!isOwner()) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row border-b border-slate-200 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 justify-center px-6">
          <Text className="text-center text-lg font-semibold text-slate-900">
            User management
          </Text>
          <Text className="mt-2 text-center text-slate-600">
            Only the workspace owner can manage users. Use the web app for full
            role administration.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Users
        </Text>
        {canManageUsers() ? (
          <Pressable
            className="px-2 py-1"
            onPress={() => {
              setForm({
                userName: '',
                email: '',
                firstName: '',
                lastName: '',
                password: '',
              });
              setRoleId(roles[0]?.id ?? '');
              setCreateOpen(true);
            }}
          >
            <Ionicons name="person-add-outline" size={26} color="#2563eb" />
          </Pressable>
        ) : (
          <View className="w-8" />
        )}
      </View>

      <ScrollView
        className="flex-1 px-3 pt-3"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="mb-4 flex-row flex-wrap gap-2">
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-xs text-slate-500">Total</Text>
            <Text className="text-xl font-bold text-slate-900">{stats.total}</Text>
          </View>
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-xs text-slate-500">Active</Text>
            <Text className="text-xl font-bold text-slate-900">{stats.active}</Text>
          </View>
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-xs text-slate-500">Roles</Text>
            <Text className="text-xl font-bold text-slate-900">{stats.roleCount}</Text>
          </View>
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-xs text-slate-500">Owners</Text>
            <Text className="text-xl font-bold text-slate-900">{stats.owners}</Text>
          </View>
        </View>

        <Text className="mb-2 text-base font-semibold text-slate-900">Members</Text>

        {loading && tenantUsers.length === 0 ? (
          <ActivityIndicator className="py-8" color="#2563eb" />
        ) : (
          tenantUsers.map((u) => (
            <View
              key={u.id}
              className="mb-2 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
            >
              <View className="flex-row items-center flex-1">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                  <Text className="font-semibold text-slate-700">
                    {initials(u)}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-medium text-slate-900">
                    {u.firstName && u.lastName
                      ? `${u.firstName} ${u.lastName}`
                      : u.userName}
                  </Text>
                  <Text className="text-xs text-slate-500">{u.email}</Text>
                  <Text className="mt-1 text-xs text-slate-600">
                    {u.isActive ? 'Active' : 'Inactive'}
                    {u.role ? ` · ${roleLabel(u.role.name)}` : ''}
                  </Text>
                </View>
              </View>
              {canManageUsers() ? (
                <View className="flex-row gap-1">
                  <Pressable className="p-2" onPress={() => openEdit(u)}>
                    <Ionicons name="pencil" size={20} color="#2563eb" />
                  </Pressable>
                  <Pressable className="p-2" onPress={() => confirmRemove(u)}>
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))
        )}

        {!loading && tenantUsers.length === 0 ? (
          <Text className="py-6 text-center text-slate-500">No users</Text>
        ) : null}

        <Text className="mt-4 text-xs text-slate-500">
          Advanced role and permission editing is available on the web app.
        </Text>
        <View className="h-8" />
      </ScrollView>

      <AppModal
        visible={createOpen}
        animationType="slide"
        transparent
        onClose={() => setCreateOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Add user</Text>
            <Text className="mb-1 mt-3 text-xs font-medium text-slate-500">Username</Text>
            <TextInput
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              autoCapitalize="none"
              value={form.userName}
              onChangeText={(t) => setForm((f) => ({ ...f, userName: t }))}
            />
            <Text className="mb-1 text-xs font-medium text-slate-500">Email</Text>
            <TextInput
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(t) => setForm((f) => ({ ...f, email: t }))}
            />
            <Text className="mb-1 text-xs font-medium text-slate-500">First name</Text>
            <TextInput
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              value={form.firstName}
              onChangeText={(t) => setForm((f) => ({ ...f, firstName: t }))}
            />
            <Text className="mb-1 text-xs font-medium text-slate-500">Last name</Text>
            <TextInput
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              value={form.lastName}
              onChangeText={(t) => setForm((f) => ({ ...f, lastName: t }))}
            />
            <Text className="mb-1 text-xs font-medium text-slate-500">Password</Text>
            <TextInput
              className="mb-2 rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              secureTextEntry
              value={form.password}
              onChangeText={(t) => setForm((f) => ({ ...f, password: t }))}
            />
            <Text className="mb-1 text-xs font-medium text-slate-500">Role</Text>
            <Pressable
              className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
              onPress={() => setRoleOpen(true)}
            >
              <Text className="text-slate-900">
                {roles.find((r) => r.id === roleId)?.display_name ||
                  roles.find((r) => r.id === roleId)?.name ||
                  'Select'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748b" />
            </Pressable>
            <Pressable
              className="items-center rounded-lg bg-blue-600 py-3"
              disabled={busy}
              onPress={() => void submitCreate()}
            >
              <Text className="font-semibold text-white">Create</Text>
            </Pressable>
            <Pressable className="mt-2 py-2" onPress={() => setCreateOpen(false)}>
              <Text className="text-center text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <AppModal
        visible={editOpen}
        animationType="slide"
        transparent
        onClose={() => setEditOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-semibold text-slate-900">Edit user</Text>
            <Text className="mb-1 mt-3 text-xs font-medium text-slate-500">Role</Text>
            <Pressable
              className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
              onPress={() => setEditRolePickOpen(true)}
            >
              <Text className="text-slate-900">
                {roles.find((r) => r.id === editRoleId)?.display_name || '—'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748b" />
            </Pressable>
            <Pressable
              className="mb-4 flex-row items-center"
              onPress={() => setEditActive((v) => !v)}
            >
              <Ionicons
                name={editActive ? 'checkbox' : 'square-outline'}
                size={24}
                color={editActive ? '#2563eb' : '#94a3b8'}
              />
              <Text className="ml-2 text-slate-800">Active</Text>
            </Pressable>
            <Pressable
              className="items-center rounded-lg bg-blue-600 py-3"
              disabled={busy}
              onPress={() => void submitEdit()}
            >
              <Text className="font-semibold text-white">Save</Text>
            </Pressable>
            <Pressable
              className="mt-2 py-2"
              onPress={() => {
                setEditOpen(false);
                setSelected(null);
              }}
            >
              <Text className="text-center text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <AppModal
        visible={deleteOpen}
        animationType="fade"
        transparent
        onClose={() => setDeleteOpen(false)}
      >
        <View className="flex-1 justify-center bg-black/40 px-4">
          <View className="rounded-2xl bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">Remove user</Text>
            <Text className="mt-2 text-slate-600">
              Remove {selected?.userName ?? ''} from this workspace?
            </Text>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable className="px-4 py-2" onPress={() => setDeleteOpen(false)}>
                <Text>Cancel</Text>
              </Pressable>
              <Pressable
                className="rounded-lg bg-red-600 px-4 py-2"
                disabled={busy}
                onPress={() => void doRemove()}
              >
                <Text className="font-semibold text-white">Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      <OptionSheet
        visible={roleOpen}
        title="Role"
        options={roleOptions}
        onSelect={(v) => {
          setRoleId(v);
          setRoleOpen(false);
        }}
        onClose={() => setRoleOpen(false)}
      />
      <OptionSheet
        visible={editRolePickOpen}
        title="Role"
        options={roleOptions}
        onSelect={(v) => {
          setEditRoleId(v);
          setEditRolePickOpen(false);
        }}
        onClose={() => setEditRolePickOpen(false)}
      />
    </View>
  );
}
