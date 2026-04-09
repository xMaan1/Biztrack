import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../../contexts/SidebarDrawerContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { OptionSheet } from '../../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../../utils/errorUtils';
import {
  Company,
  CompanyCreate,
  CompanySize,
  CRMCompanyFilters,
  Industry,
} from '../../../../models/crm';
import {
  fetchCompaniesPaged,
  createCompanyApi,
  updateCompanyApi,
  deleteCompanyApi,
} from '../../../../services/crm/companiesApi';
import { formatCrmDate, formatUsd } from '../../../../services/crm/CrmMobileService';
import { industryLabel } from '../../contacts/utils/contactFormUtils';

const ITEMS_PER_PAGE = 10;
const FILTER_ANY = 'all';

type FormState = CompanyCreate & { tagsText: string };

function buildEmptyForm(): FormState {
  return {
    name: '',
    industry: undefined,
    size: undefined,
    website: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    description: '',
    notes: '',
    tags: [],
    tagsText: '',
    isActive: true,
    annualRevenue: undefined,
    employeeCount: undefined,
    foundedYear: undefined,
  };
}

function sizeLabel(s: CompanySize): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function MobileCompaniesScreen() {
  const { user, currentTenant, logout } = useAuth();
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<CRMCompanyFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [industrySheetOpen, setIndustrySheetOpen] = useState(false);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [formIndustryOpen, setFormIndustryOpen] = useState(false);
  const [formSizeOpen, setFormSizeOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  const [form, setForm] = useState<FormState>(() => buildEmptyForm());
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const appliedFilters = useMemo((): CRMCompanyFilters => {
    const t = searchTerm.trim();
    return { ...filters, search: t || undefined };
  }, [filters, searchTerm]);

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchCompaniesPaged(
        appliedFilters,
        currentPage,
        ITEMS_PER_PAGE,
      );
      setCompanies(res.companies ?? []);
      setTotalCount(res.pagination?.total ?? 0);
    } catch (e) {
      Alert.alert('Companies', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/crm/companies',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCompanies();
    setRefreshing(false);
  }, [loadCompanies]);

  const resetForm = useCallback(() => {
    setForm(buildEmptyForm());
    setEditingCompany(null);
  }, []);

  const industryFilterOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'All industries' },
      ...Object.values(Industry).map((ind) => ({
        value: ind,
        label: industryLabel(ind),
      })),
    ],
    [],
  );

  const sizeFilterOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'All sizes' },
      ...Object.values(CompanySize).map((s) => ({
        value: s,
        label: sizeLabel(s),
      })),
    ],
    [],
  );

  const formIndustryOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'Not set' },
      ...Object.values(Industry).map((ind) => ({
        value: ind,
        label: industryLabel(ind),
      })),
    ],
    [],
  );

  const formSizeOptions = useMemo(
    () => [
      { value: FILTER_ANY, label: 'Not set' },
      ...Object.values(CompanySize).map((s) => ({
        value: s,
        label: sizeLabel(s),
      })),
    ],
    [],
  );

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditingCompany(c);
    setForm({
      name: c.name,
      industry: c.industry,
      size: c.size,
      website: c.website || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      country: c.country || '',
      postalCode: c.postalCode || '',
      description: c.description || '',
      notes: c.notes || '',
      tags: c.tags || [],
      tagsText: c.tags?.join(', ') || '',
      isActive: c.isActive,
      annualRevenue: c.annualRevenue,
      employeeCount: c.employeeCount,
      foundedYear: c.foundedYear,
    });
    setEditOpen(true);
  };

  const submitSave = async () => {
    if (!form.name?.trim()) {
      Alert.alert('Company', 'Company name is required.');
      return;
    }
    const payload: CompanyCreate = {
      name: form.name.trim(),
      industry: form.industry,
      size: form.size,
      website: form.website || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      postalCode: form.postalCode || undefined,
      description: form.description || undefined,
      notes: form.notes || undefined,
      tags: form.tags,
      isActive: form.isActive,
      annualRevenue: form.annualRevenue,
      employeeCount: form.employeeCount,
      foundedYear: form.foundedYear,
    };
    try {
      if (editingCompany) {
        await updateCompanyApi(editingCompany.id, payload);
        setEditOpen(false);
      } else {
        await createCompanyApi(payload);
        setCreateOpen(false);
      }
      resetForm();
      await loadCompanies();
      Alert.alert('Company', editingCompany ? 'Updated.' : 'Created.');
    } catch (e) {
      Alert.alert('Company', extractErrorMessage(e, 'Save failed'));
    }
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    try {
      await deleteCompanyApi(companyToDelete.id);
      setDeleteOpen(false);
      setCompanyToDelete(null);
      await loadCompanies();
      Alert.alert('Company', 'Deleted.');
    } catch (e) {
      Alert.alert('Company', extractErrorMessage(e, 'Delete failed'));
    }
  };

  const userLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ? `${[user?.firstName, user?.lastName].filter(Boolean).join(' ')} · ${user?.email ?? ''}`
    : user?.email ?? '';

  const renderForm = () => (
    <ScrollView
      className="max-h-[80%]"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="mt-2 gap-3">
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            Company name *
          </Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.name}
            onChangeText={(t) => setForm((p) => ({ ...p, name: t }))}
            placeholder="Name"
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Industry</Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setFormIndustryOpen(true)}
          >
            <Text className="text-slate-900">
              {form.industry ? industryLabel(form.industry) : 'Not set'}
            </Text>
          </Pressable>
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Size</Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => setFormSizeOpen(true)}
          >
            <Text className="text-slate-900">
              {form.size ? sizeLabel(form.size) : 'Not set'}
            </Text>
          </Pressable>
        </View>
        {(
          [
            ['website', 'Website', 'https://'],
            ['phone', 'Phone', ''],
            ['address', 'Address', 'Street'],
          ] as const
        ).map(([k, label, ph]) => (
          <View key={k}>
            <Text className="mb-1 text-xs font-medium text-slate-600">{label}</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={String(form[k] ?? '')}
              onChangeText={(t) =>
                setForm((p) => ({ ...p, [k]: t } as FormState))
              }
              placeholder={ph}
              autoCapitalize={k === 'website' ? 'none' : 'sentences'}
            />
          </View>
        ))}
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">City</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.city || ''}
              onChangeText={(t) => setForm((p) => ({ ...p, city: t }))}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">State</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.state || ''}
              onChangeText={(t) => setForm((p) => ({ ...p, state: t }))}
            />
          </View>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">Country</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.country || ''}
              onChangeText={(t) => setForm((p) => ({ ...p, country: t }))}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">Postal</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.postalCode || ''}
              onChangeText={(t) => setForm((p) => ({ ...p, postalCode: t }))}
            />
          </View>
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Description</Text>
          <TextInput
            className="min-h-[72px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.description || ''}
            onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
            multiline
            textAlignVertical="top"
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Notes</Text>
          <TextInput
            className="min-h-[72px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.notes || ''}
            onChangeText={(t) => setForm((p) => ({ ...p, notes: t }))}
            multiline
            textAlignVertical="top"
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            Tags (comma separated)
          </Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.tagsText}
            onChangeText={(t) =>
              setForm((p) => ({
                ...p,
                tagsText: t,
                tags: t
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean),
              }))
            }
          />
        </View>
        <Pressable
          onPress={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
          className="flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3"
        >
          <Text className="text-sm font-medium text-slate-800">Active</Text>
          <View
            className={`h-7 w-12 rounded-full ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <View
              className={`mt-0.5 h-6 w-6 rounded-full bg-white ${form.isActive ? 'ml-5' : 'ml-0.5'}`}
            />
          </View>
        </Pressable>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            Annual revenue
          </Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={
              form.annualRevenue != null ? String(form.annualRevenue) : ''
            }
            onChangeText={(t) =>
              setForm((p) => ({
                ...p,
                annualRevenue: t.trim()
                  ? parseFloat(t.replace(/[^0-9.-]/g, ''))
                  : undefined,
              }))
            }
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">
              Employees
            </Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={
                form.employeeCount != null ? String(form.employeeCount) : ''
              }
              onChangeText={(t) =>
                setForm((p) => ({
                  ...p,
                  employeeCount: t.trim()
                    ? parseInt(t.replace(/[^0-9]/g, ''), 10)
                    : undefined,
                }))
              }
              keyboardType="number-pad"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">
              Founded year
            </Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.foundedYear != null ? String(form.foundedYear) : ''}
              onChangeText={(t) =>
                setForm((p) => ({
                  ...p,
                  foundedYear: t.trim()
                    ? parseInt(t.replace(/[^0-9]/g, ''), 10)
                    : undefined,
                }))
              }
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const listHeader = (
    <View className="pb-2">
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-start gap-2">
            <MenuHeaderButton />
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-bold text-indigo-700">Companies</Text>
              <Text className="mt-1 text-sm text-slate-600">
                Accounts and relationships
              </Text>
              {currentTenant ? (
                <Text className="mt-1 text-xs text-slate-500" numberOfLines={2}>
                  {currentTenant.name}
                  {userLabel ? ` · ${userLabel}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
          <Pressable
            className="rounded-lg border border-slate-200 px-3 py-2 active:bg-slate-100"
            onPress={() => void logout()}
          >
            <Text className="text-sm font-medium text-slate-700">Sign out</Text>
          </Pressable>
        </View>
        <Pressable
          className="mt-3 self-start rounded-lg bg-indigo-600 px-3 py-2 active:bg-indigo-700"
          onPress={openCreate}
        >
          <Text className="text-sm font-semibold text-white">New company</Text>
        </Pressable>
      </View>

      <View className="mt-4 px-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">Search</Text>
        <View className="rounded-xl border border-slate-200 bg-white p-3">
          <View className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              className="ml-2 flex-1 py-2 text-sm text-slate-900"
              placeholder="Search companies…"
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setIndustrySheetOpen(true)}
            >
              <Text className="text-center text-xs font-semibold text-slate-700">
                Industry:{' '}
                {filters.industry ? industryLabel(filters.industry) : 'all'}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setSizeSheetOpen(true)}
            >
              <Text className="text-center text-xs font-semibold text-slate-700">
                Size: {filters.size ? sizeLabel(filters.size) : 'all'}
              </Text>
            </Pressable>
          </View>
          <Pressable
            className="mt-3"
            onPress={() => {
              setFilters({});
              setSearchTerm('');
            }}
          >
            <Text className="text-center text-sm font-semibold text-slate-600">
              Reset filters
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 px-4">
        <Text className="text-base font-semibold text-slate-900">Company list</Text>
        <Text className="text-sm text-slate-500">
          {totalCount > 0
            ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
            : 'No companies'}
        </Text>
      </View>
    </View>
  );

  const listFooter = (
    <View className="px-4 pb-8 pt-4">
      {totalPages > 1 ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-slate-600">
            Page {currentPage} / {totalPages}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              disabled={currentPage <= 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`rounded-lg border px-4 py-2 ${
                currentPage <= 1 ? 'border-slate-100 opacity-50' : 'border-slate-300'
              }`}
            >
              <Text className="font-semibold text-slate-800">Previous</Text>
            </Pressable>
            <Pressable
              disabled={currentPage >= totalPages}
              onPress={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className={`rounded-lg border px-4 py-2 ${
                currentPage >= totalPages
                  ? 'border-slate-100 opacity-50'
                  : 'border-slate-300'
              }`}
            >
              <Text className="font-semibold text-slate-800">Next</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <FlatList
        data={companies}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <Text className="px-4 py-8 text-center text-slate-500">
              No companies match your filters.
            </Text>
          )
        }
        renderItem={({ item: c }) => (
          <View className="mx-4 mb-3 rounded-xl border border-slate-200 bg-white p-4">
            <View className="flex-row items-start justify-between gap-2">
              <Pressable
                className="min-w-0 flex-1"
                onPress={() => {
                  setViewingCompany(c);
                  setViewOpen(true);
                }}
              >
                <Text className="text-lg font-semibold text-slate-900">{c.name}</Text>
                <View className="mt-1 flex-row flex-wrap gap-2">
                  {c.industry ? (
                    <View className="rounded-full bg-violet-100 px-2 py-0.5">
                      <Text className="text-xs font-medium text-violet-800">
                        {industryLabel(c.industry)}
                      </Text>
                    </View>
                  ) : null}
                  {c.size ? (
                    <View className="rounded-full bg-slate-100 px-2 py-0.5">
                      <Text className="text-xs font-medium text-slate-700">
                        {sizeLabel(c.size)}
                      </Text>
                    </View>
                  ) : null}
                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      c.isActive ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        c.isActive ? 'text-emerald-800' : 'text-slate-700'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                {c.website ? (
                  <Text className="mt-1 text-sm text-blue-600" numberOfLines={1}>
                    {c.website}
                  </Text>
                ) : null}
                {c.phone ? (
                  <Text className="text-sm text-slate-600">{c.phone}</Text>
                ) : null}
                {c.city && c.state ? (
                  <Text className="text-xs text-slate-500">
                    {c.city}, {c.state}
                  </Text>
                ) : null}
                {c.annualRevenue != null && c.annualRevenue > 0 ? (
                  <Text className="mt-1 text-xs text-slate-600">
                    Revenue {formatUsd(c.annualRevenue)}
                  </Text>
                ) : null}
                <Text className="mt-1 text-xs text-slate-400">
                  Created {formatCrmDate(c.createdAt)}
                </Text>
              </Pressable>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setViewingCompany(c);
                    setViewOpen(true);
                  }}
                  className="rounded-lg bg-slate-100 p-2"
                >
                  <Ionicons name="eye-outline" size={18} color="#334155" />
                </Pressable>
                <Pressable
                  onPress={() => openEdit(c)}
                  className="rounded-lg bg-slate-100 p-2"
                >
                  <Ionicons name="pencil-outline" size={18} color="#334155" />
                </Pressable>
                <Pressable
                  onPress={() => {
                    setCompanyToDelete(c);
                    setDeleteOpen(true);
                  }}
                  className="rounded-lg bg-red-50 p-2"
                >
                  <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <OptionSheet
        visible={industrySheetOpen}
        title="Industry"
        options={industryFilterOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            industry: v === FILTER_ANY ? undefined : (v as Industry),
          }))
        }
        onClose={() => setIndustrySheetOpen(false)}
      />
      <OptionSheet
        visible={sizeSheetOpen}
        title="Size"
        options={sizeFilterOptions}
        onSelect={(v) =>
          setFilters((f) => ({
            ...f,
            size: v === FILTER_ANY ? undefined : (v as CompanySize),
          }))
        }
        onClose={() => setSizeSheetOpen(false)}
      />
      <OptionSheet
        visible={formIndustryOpen}
        title="Industry"
        options={formIndustryOptions}
        onSelect={(v) =>
          setForm((p) => ({
            ...p,
            industry: v === FILTER_ANY ? undefined : (v as Industry),
          }))
        }
        onClose={() => setFormIndustryOpen(false)}
      />
      <OptionSheet
        visible={formSizeOpen}
        title="Company size"
        options={formSizeOptions}
        onSelect={(v) =>
          setForm((p) => ({
            ...p,
            size: v === FILTER_ANY ? undefined : (v as CompanySize),
          }))
        }
        onClose={() => setFormSizeOpen(false)}
      />

      <Modal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-bold text-slate-900">New company</Text>
            {renderForm()}
            <View className="mt-4 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg border border-slate-300 py-3"
                onPress={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
              >
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
                onPress={() => void submitSave()}
              >
                <Text className="font-semibold text-white">Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-bold text-slate-900">Edit company</Text>
            {renderForm()}
            <View className="mt-4 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg border border-slate-300 py-3"
                onPress={() => {
                  setEditOpen(false);
                  resetForm();
                }}
              >
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
                onPress={() => void submitSave()}
              >
                <Text className="font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteOpen} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-5">
            <Text className="text-lg font-bold text-slate-900">Delete company</Text>
            <Text className="mt-2 text-slate-600">
              Delete {companyToDelete?.name}? This cannot be undone.
            </Text>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable
                className="rounded-lg border border-slate-300 px-4 py-2"
                onPress={() => {
                  setDeleteOpen(false);
                  setCompanyToDelete(null);
                }}
              >
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                className="rounded-lg bg-red-600 px-4 py-2 active:bg-red-700"
                onPress={() => void confirmDelete()}
              >
                <Text className="font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={viewOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[90%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-bold text-slate-900">Company</Text>
            {viewingCompany ? (
              <ScrollView className="mt-3">
                <Text className="text-xl font-semibold text-slate-900">
                  {viewingCompany.name}
                </Text>
                {viewingCompany.website?.trim() ? (
                  <Pressable
                    onPress={() =>
                      void Linking.openURL(
                        /^https?:\/\//i.test(viewingCompany.website!.trim())
                          ? viewingCompany.website!.trim()
                          : `https://${viewingCompany.website!.trim()}`,
                      )
                    }
                  >
                    <Text className="mt-1 text-sm text-blue-600">
                      {viewingCompany.website}
                    </Text>
                  </Pressable>
                ) : null}
                <Text className="mt-2 text-sm text-slate-700">
                  {viewingCompany.phone || '—'} · {viewingCompany.city || '—'},{' '}
                  {viewingCompany.state || '—'}
                </Text>
                {viewingCompany.description ? (
                  <Text className="mt-3 text-sm text-slate-800">
                    {viewingCompany.description}
                  </Text>
                ) : null}
              </ScrollView>
            ) : null}
            <View className="mt-4 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg border border-slate-300 py-3"
                onPress={() => {
                  setViewOpen(false);
                  setViewingCompany(null);
                }}
              >
                <Text className="font-semibold text-slate-700">Close</Text>
              </Pressable>
              {viewingCompany ? (
                <Pressable
                  className="flex-1 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
                  onPress={() => {
                    const x = viewingCompany;
                    setViewOpen(false);
                    setViewingCompany(null);
                    openEdit(x);
                  }}
                >
                  <Text className="font-semibold text-white">Edit</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
