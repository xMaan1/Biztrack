import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Image, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MenuHeaderButton } from '../../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../../contexts/SidebarDrawerContext';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  LabeledContactFieldsMobile,
  defaultEmailRowsFromEntity,
  defaultPhoneRowsFromEntity,
} from '../../../../components/crm/LabeledContactFieldsMobile';
import { OptionSheet } from '../../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../../utils/errorUtils';
import {
  uploadDocumentFromUri,
  deleteUploadedFileByKey,
  extractS3KeyFromUrl,
} from '../../../../utils/fileUploadMobile';
import type {
  Customer,
  CustomerAttachment,
  CustomerCreate,
  CustomerStats,
  CustomerUpdate,
  Guarantor,
  GuarantorCreate,
  LabeledEmailItem,
  LabeledPhoneItem,
} from '../../../../models/crm/customers';
import { AppModal } from '../../../../components/layout/AppModal';
import {
  getCustomers,
  getCustomerStats,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  uploadCustomerPhoto,
  deleteCustomerPhoto,
  importCustomersFromFile,
  getGuarantors,
  createGuarantor,
  updateGuarantor,
  deleteGuarantor,
} from '../../../../services/crm/CrmMobileService';

const ITEMS_PER_PAGE = 10;

const emptyGuarantor: GuarantorCreate = {
  name: '',
  mobile: '',
  cnic: '',
  residential_address: '',
  official_address: '',
  occupation: '',
  relation: '',
};

function guarantorTextField(
  form: GuarantorCreate,
  key: keyof GuarantorCreate,
): string {
  const v = form[key];
  return typeof v === 'string' ? v : '';
}

function buildEmptyForm(): CustomerCreate & { tagsText: string } {
  return {
    firstName: '',
    lastName: '',
    emails: [{ value: '', label: 'personal' }] as LabeledEmailItem[],
    phones: [{ value: '', label: 'work' }] as LabeledPhoneItem[],
    cnic: '',
    address: '',
    city: '',
    state: '',
    country: 'Pakistan',
    postalCode: '',
    customerType: 'individual',
    customerStatus: 'active',
    creditLimit: 0,
    currentBalance: 0,
    paymentTerms: 'Cash',
    tags: [],
    tagsText: '',
    description: '',
    attachments: [] as CustomerAttachment[],
  };
}

export function MobileCustomersScreen() {
  const { user, currentTenant, logout } = useAuth();
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'blocked'
  >('all');
  const [typeFilter, setTypeFilter] = useState<
    'all' | 'individual' | 'business'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [typeSheetOpen, setTypeSheetOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const [form, setForm] = useState(buildEmptyForm);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [attachmentBusy, setAttachmentBusy] = useState(false);

  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [createGuarantors, setCreateGuarantors] = useState<GuarantorCreate[]>(
    [],
  );
  const [guarantorOpen, setGuarantorOpen] = useState(false);
  const [guarantorForm, setGuarantorForm] = useState<GuarantorCreate>(
    emptyGuarantor,
  );
  const [guarantorSource, setGuarantorSource] = useState<'create' | 'edit'>(
    'edit',
  );
  const [editingGuarantorId, setEditingGuarantorId] = useState<string | null>(
    null,
  );
  const [editingCreateGuarantorIndex, setEditingCreateGuarantorIndex] =
    useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const res = await getCustomers(
        skip,
        ITEMS_PER_PAGE,
        searchTerm.trim() || undefined,
        statusFilter === 'all' ? undefined : statusFilter,
        typeFilter === 'all' ? undefined : typeFilter,
      );
      setCustomers(res.customers ?? []);
      setTotalCount(res.total ?? 0);
    } catch (e) {
      Alert.alert('Customers', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const s = await getCustomerStats();
      setStats(s);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/crm/customers',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCustomers(), loadStats()]);
    setRefreshing(false);
  }, [loadCustomers, loadStats]);

  const resetForm = useCallback(() => {
    setForm(buildEmptyForm());
    setSelectedCustomer(null);
    setPhotoPreview(null);
    setPhotoRemoved(false);
    setGuarantors([]);
    setCreateGuarantors([]);
    setEditingGuarantorId(null);
    setEditingCreateGuarantorIndex(null);
    setGuarantorForm(emptyGuarantor);
  }, []);

  const pickCustomerPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Permission is required to choose a photo.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    if (a.base64) {
      const mime = a.mimeType || 'image/jpeg';
      setPhotoPreview(`data:${mime};base64,${a.base64}`);
      setPhotoRemoved(false);
    }
  };

  const pickAttachment = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (r.canceled || !r.assets?.[0]) return;
      const a = r.assets[0];
      setAttachmentBusy(true);
      const up = await uploadDocumentFromUri({
        uri: a.uri,
        name: a.name || 'document',
        mimeType: a.mimeType || undefined,
      });
      setForm((prev) => ({
        ...prev,
        attachments: [
          ...(prev.attachments || []),
          {
            url: up.file_url,
            original_filename: up.original_filename,
            s3_key: up.s3_key,
          },
        ],
      }));
    } catch (e) {
      Alert.alert('Upload', extractErrorMessage(e, 'Upload failed'));
    } finally {
      setAttachmentBusy(false);
    }
  };

  const removeAttachmentAt = async (index: number) => {
    const list = form.attachments || [];
    const att = list[index];
    if (att) {
      const key = att.s3_key || extractS3KeyFromUrl(att.url);
      if (key) {
        try {
          await deleteUploadedFileByKey(key);
        } catch {
          Alert.alert(
            'Attachments',
            'Removed from list; storage delete may have failed.',
          );
        }
      }
    }
    setForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = async (c: Customer) => {
    setSelectedCustomer(c);
    setForm({
      firstName: c.firstName,
      lastName: c.lastName,
      emails: defaultEmailRowsFromEntity(c),
      phones: defaultPhoneRowsFromEntity(c),
      cnic: c.cnic || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      country: c.country || 'Pakistan',
      postalCode: c.postalCode || '',
      customerType: c.customerType,
      customerStatus: c.customerStatus,
      creditLimit: c.creditLimit,
      currentBalance: c.currentBalance,
      paymentTerms: c.paymentTerms,
      tags: c.tags,
      tagsText: c.tags?.join(', ') || '',
      description: c.description || '',
      attachments: c.attachments || [],
    });
    setPhotoPreview(null);
    setPhotoRemoved(false);
    setEditOpen(true);
    try {
      const g = await getGuarantors(c.id);
      setGuarantors(g || []);
    } catch {
      setGuarantors([]);
    }
  };

  const submitCreate = async () => {
    if (!form.firstName?.trim() || !form.lastName?.trim()) {
      Alert.alert('Customer', 'First name and last name are required.');
      return;
    }
    try {
      const payload: CustomerCreate = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        emails: (form.emails || []).filter((e) => e.value.trim()),
        phones: (form.phones || []).filter((p) => p.value.trim()),
        cnic: form.cnic || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        postalCode: form.postalCode || undefined,
        customerType: form.customerType,
        customerStatus: form.customerStatus,
        creditLimit: form.creditLimit,
        currentBalance: form.currentBalance,
        paymentTerms: form.paymentTerms,
        tags: form.tags,
        description: form.description || undefined,
        attachments: form.attachments,
      };
      const created = await createCustomer(payload);
      if (photoPreview) {
        try {
          await uploadCustomerPhoto(created.id, photoPreview);
        } catch (e) {
          Alert.alert(
            'Photo',
            extractErrorMessage(e, 'Customer created but photo upload failed'),
          );
        }
      }
      for (const g of createGuarantors) {
        try {
          await createGuarantor(created.id, g);
        } catch (e) {
          Alert.alert(
            'Guarantor',
            extractErrorMessage(
              e,
              'Customer created but a guarantor could not be added',
            ),
          );
        }
      }
      setCreateOpen(false);
      resetForm();
      await loadCustomers();
      await loadStats();
      Alert.alert('Customer', 'Created successfully.');
    } catch (e) {
      Alert.alert('Customer', extractErrorMessage(e, 'Failed to create'));
    }
  };

  const submitEdit = async () => {
    if (!selectedCustomer) return;
    try {
      if (photoRemoved && selectedCustomer.image_url) {
        try {
          await deleteCustomerPhoto(selectedCustomer.id);
        } catch (e) {
          Alert.alert('Photo', extractErrorMessage(e, 'Could not remove photo'));
        }
      }
      if (photoPreview) {
        try {
          await uploadCustomerPhoto(selectedCustomer.id, photoPreview);
        } catch (e) {
          Alert.alert('Photo', extractErrorMessage(e, 'Photo upload failed'));
        }
      }
      const updatePayload: CustomerUpdate = {
        firstName: form.firstName,
        lastName: form.lastName,
        emails: (form.emails || []).filter((e) => e.value.trim()),
        phones: (form.phones || []).filter((p) => p.value.trim()),
        cnic: form.cnic || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
        postalCode: form.postalCode || undefined,
        customerType: form.customerType,
        customerStatus: form.customerStatus,
        creditLimit: form.creditLimit,
        currentBalance: form.currentBalance,
        paymentTerms: form.paymentTerms,
        tags: form.tags,
        description: form.description || undefined,
        attachments: form.attachments,
      };
      await updateCustomer(selectedCustomer.id, updatePayload);
      setEditOpen(false);
      resetForm();
      await loadCustomers();
      await loadStats();
      Alert.alert('Customer', 'Updated successfully.');
    } catch (e) {
      Alert.alert('Customer', extractErrorMessage(e, 'Failed to update'));
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer(customerToDelete.id);
      setDeleteOpen(false);
      setCustomerToDelete(null);
      await loadCustomers();
      await loadStats();
      Alert.alert('Customer', 'Deleted.');
    } catch (e) {
      Alert.alert('Customer', extractErrorMessage(e, 'Failed to delete'));
    }
  };

  const runImport = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        copyToCacheDirectory: true,
      });
      if (r.canceled || !r.assets?.[0]) return;
      const a = r.assets[0];
      setImportBusy(true);
      const res = await importCustomersFromFile({
        uri: a.uri,
        name: a.name || 'import',
        mimeType: a.mimeType || undefined,
      });
      const ok = res.success !== false;
      const msg =
        res.message ||
        `Imported ${res.imported_count ?? 0}, failed ${res.failed_count ?? 0}`;
      if (ok) {
        Alert.alert('Import', msg);
        setImportOpen(false);
        await loadCustomers();
        await loadStats();
      } else {
        Alert.alert('Import', msg);
      }
      if (res.errors?.length) {
        Alert.alert('Import details', res.errors.slice(0, 8).join('\n'));
      }
    } catch (e) {
      Alert.alert('Import', extractErrorMessage(e, 'Import failed'));
    } finally {
      setImportBusy(false);
    }
  };

  const openGuarantorCreate = () => {
    setGuarantorSource('create');
    setEditingGuarantorId(null);
    setEditingCreateGuarantorIndex(null);
    setGuarantorForm(emptyGuarantor);
    setGuarantorOpen(true);
  };

  const openGuarantorEditCreate = (g: GuarantorCreate, idx: number) => {
    setGuarantorSource('create');
    setEditingCreateGuarantorIndex(idx);
    setEditingGuarantorId(null);
    setGuarantorForm({ ...g });
    setGuarantorOpen(true);
  };

  const openGuarantorAddExisting = () => {
    setGuarantorSource('edit');
    setEditingGuarantorId(null);
    setEditingCreateGuarantorIndex(null);
    setGuarantorForm(emptyGuarantor);
    setGuarantorOpen(true);
  };

  const openGuarantorEditExisting = (g: Guarantor) => {
    setGuarantorSource('edit');
    setEditingGuarantorId(g.id);
    setEditingCreateGuarantorIndex(null);
    setGuarantorForm({
      name: g.name,
      mobile: g.mobile || '',
      cnic: g.cnic || '',
      residential_address: g.residential_address || '',
      official_address: g.official_address || '',
      occupation: g.occupation || '',
      relation: g.relation || '',
    });
    setGuarantorOpen(true);
  };

  const submitGuarantorDialog = async () => {
    if (!guarantorForm.name.trim()) return;
    if (guarantorSource === 'create') {
      if (editingCreateGuarantorIndex != null && editingCreateGuarantorIndex >= 0) {
        setCreateGuarantors((prev) =>
          prev.map((x, i) => (i === editingCreateGuarantorIndex ? guarantorForm : x)),
        );
      } else {
        setCreateGuarantors((prev) => [...prev, guarantorForm]);
      }
      setGuarantorOpen(false);
      setGuarantorForm(emptyGuarantor);
      return;
    }
    if (!selectedCustomer) return;
    try {
      if (editingGuarantorId) {
        const u = await updateGuarantor(editingGuarantorId, guarantorForm);
        setGuarantors((prev) => prev.map((x) => (x.id === editingGuarantorId ? u : x)));
      } else {
        const g = await createGuarantor(selectedCustomer.id, guarantorForm);
        setGuarantors((prev) => [...prev, g]);
      }
      setGuarantorOpen(false);
      setGuarantorForm(emptyGuarantor);
      setEditingGuarantorId(null);
    } catch (e) {
      Alert.alert('Guarantor', extractErrorMessage(e, 'Failed to save'));
    }
  };

  const removeCreateGuarantor = (idx: number) => {
    setCreateGuarantors((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingGuarantor = async (id: string) => {
    try {
      await deleteGuarantor(id);
      setGuarantors((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      Alert.alert('Guarantor', extractErrorMessage(e, 'Failed to remove'));
    }
  };

  const paymentSheetOptions = (
    [
      { value: 'Credit' as const, label: 'Credit' },
      { value: 'Card' as const, label: 'Card' },
      { value: 'Cash' as const, label: 'Cash' },
      { value: 'Due Payments' as const, label: 'Due Payments' },
    ] as const
  ).map((x) => x);

  const userLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ? `${[user?.firstName, user?.lastName].filter(Boolean).join(' ')} · ${user?.email ?? ''}`
    : user?.email ?? '';

  const renderFormFields = (isEdit: boolean) => (
    <ScrollView
      className="max-h-[80%]"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center border-b border-slate-100 pb-4">
        <Pressable
          onPress={() => void pickCustomerPhoto()}
          className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50"
        >
          {photoPreview ? (
            <Image
              source={{ uri: photoPreview }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : isEdit &&
            !photoRemoved &&
            selectedCustomer?.image_url ? (
            <Image
              source={{ uri: selectedCustomer.image_url }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="camera-outline" size={36} color="#94a3b8" />
          )}
        </Pressable>
        <Text className="mt-2 text-xs text-slate-500">Tap to choose photo</Text>
        {isEdit &&
        (selectedCustomer?.image_url || photoPreview) &&
        !photoRemoved ? (
          <Pressable
            className="mt-2"
            onPress={() => {
              setPhotoPreview(null);
              setPhotoRemoved(true);
            }}
          >
            <Text className="text-sm font-medium text-red-600">Remove photo</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-4 gap-3">
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            First name *
          </Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.firstName}
            onChangeText={(t) => setForm((p) => ({ ...p, firstName: t }))}
            placeholder="First name"
          />
        </View>
        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            Last name *
          </Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.lastName}
            onChangeText={(t) => setForm((p) => ({ ...p, lastName: t }))}
            placeholder="Last name"
          />
        </View>

        <LabeledContactFieldsMobile
          emails={(form.emails || []) as LabeledEmailItem[]}
          phones={(form.phones || []) as LabeledPhoneItem[]}
          onEmailsChange={(emails) => setForm((p) => ({ ...p, emails }))}
          onPhonesChange={(phones) => setForm((p) => ({ ...p, phones }))}
        />

        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">CNIC</Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.cnic}
            onChangeText={(t) => setForm((p) => ({ ...p, cnic: t }))}
            placeholder="CNIC"
          />
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">Type</Text>
            <Pressable
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              onPress={() =>
                setForm((p) => ({
                  ...p,
                  customerType:
                    p.customerType === 'individual' ? 'business' : 'individual',
                }))
              }
            >
              <Text className="text-slate-900 capitalize">
                {form.customerType}
              </Text>
            </Pressable>
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">Status</Text>
            <Pressable
              className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              onPress={() =>
                setForm((p) => {
                  const order = ['active', 'inactive', 'blocked'] as const;
                  const i = order.indexOf(
                    p.customerStatus as (typeof order)[number],
                  );
                  const next = order[(i + 1) % order.length];
                  return { ...p, customerStatus: next };
                })
              }
            >
              <Text className="text-slate-900 capitalize">
                {form.customerStatus}
              </Text>
            </Pressable>
          </View>
        </View>

        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            Credit limit
          </Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={String(form.creditLimit ?? 0)}
            onChangeText={(t) =>
              setForm((p) => ({
                ...p,
                creditLimit: parseFloat(t.replace(/[^0-9.-]/g, '')) || 0,
              }))
            }
            keyboardType="decimal-pad"
          />
        </View>

        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            Payment terms
          </Text>
          <Pressable
            className="rounded-lg border border-slate-200 bg-white px-3 py-2"
            onPress={() => {
              const i = paymentSheetOptions.findIndex(
                (o) => o.value === form.paymentTerms,
              );
              const next =
                paymentSheetOptions[(i + 1) % paymentSheetOptions.length];
              setForm((p) => ({ ...p, paymentTerms: next.value }));
            }}
          >
            <Text className="text-slate-900">{form.paymentTerms}</Text>
          </Pressable>
        </View>

        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">Address</Text>
          <TextInput
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.address}
            onChangeText={(t) => setForm((p) => ({ ...p, address: t }))}
            placeholder="Street"
          />
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">City</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.city}
              onChangeText={(t) => setForm((p) => ({ ...p, city: t }))}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">State</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.state}
              onChangeText={(t) => setForm((p) => ({ ...p, state: t }))}
            />
          </View>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">
              Country
            </Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.country}
              onChangeText={(t) => setForm((p) => ({ ...p, country: t }))}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-xs font-medium text-slate-600">Postal</Text>
            <TextInput
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              value={form.postalCode}
              onChangeText={(t) => setForm((p) => ({ ...p, postalCode: t }))}
            />
          </View>
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
            placeholder="vip, regular"
          />
        </View>

        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            Description
          </Text>
          <TextInput
            className="min-h-[88px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
            value={form.description || ''}
            onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
            placeholder="Notes"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View>
          <Text className="mb-1 text-xs font-medium text-slate-600">
            Attachments
          </Text>
          <Pressable
            disabled={attachmentBusy}
            onPress={() => void pickAttachment()}
            className="flex-row items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Ionicons name="attach-outline" size={18} color="#475569" />
            <Text className="text-sm text-slate-700">
              {attachmentBusy ? 'Uploading…' : 'Add file (PDF, DOC, DOCX)'}
            </Text>
          </Pressable>
          {(form.attachments || []).map((att, idx) => (
            <View
              key={`${att.url}-${idx}`}
              className="mt-2 flex-row items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <Text className="mr-2 flex-1 text-sm text-slate-800" numberOfLines={1}>
                {att.original_filename || 'File'}
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => void Linking.openURL(att.url)}
                  hitSlop={8}
                >
                  <Ionicons name="open-outline" size={20} color="#2563eb" />
                </Pressable>
                <Pressable onPress={() => void removeAttachmentAt(idx)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color="#b91c1c" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View className="border-t border-slate-100 pt-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-800">
              Guarantors / friends
            </Text>
            <Pressable
              onPress={() =>
                isEdit ? openGuarantorAddExisting() : openGuarantorCreate()
              }
              className="rounded-lg border border-slate-200 px-2 py-1 active:bg-slate-50"
            >
              <Text className="text-xs font-semibold text-blue-600">Add</Text>
            </Pressable>
          </View>
          {!isEdit ? (
            createGuarantors.length === 0 ? (
              <Text className="text-sm text-slate-500">None added.</Text>
            ) : (
              createGuarantors.map((g, idx) => (
                <View
                  key={`cg-${idx}`}
                  className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2"
                >
                  <View className="min-w-0 flex-1">
                    <Text className="font-medium text-slate-900">{g.name}</Text>
                    <Text className="text-xs text-slate-500">
                      {[g.mobile, g.relation].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => openGuarantorEditCreate(g, idx)}
                    className="p-2"
                  >
                    <Ionicons name="pencil-outline" size={18} color="#475569" />
                  </Pressable>
                  <Pressable
                    onPress={() => removeCreateGuarantor(idx)}
                    className="p-2"
                  >
                    <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                  </Pressable>
                </View>
              ))
            )
          ) : guarantors.length === 0 ? (
            <Text className="text-sm text-slate-500">None added.</Text>
          ) : (
            guarantors.map((g) => (
              <View
                key={g.id}
                className="mb-2 flex-row items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2"
              >
                <View className="min-w-0 flex-1">
                  <Text className="font-medium text-slate-900">{g.name}</Text>
                  <Text className="text-xs text-slate-500">
                    {[g.mobile, g.relation].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Pressable
                  onPress={() => openGuarantorEditExisting(g)}
                  className="p-2"
                >
                  <Ionicons name="pencil-outline" size={18} color="#475569" />
                </Pressable>
                <Pressable
                  onPress={() => void removeExistingGuarantor(g.id)}
                  className="p-2"
                >
                  <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                </Pressable>
              </View>
            ))
          )}
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
              <Text className="text-2xl font-bold text-indigo-700">Customers</Text>
              <Text className="mt-1 text-sm text-slate-600">
                Manage customer records
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
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable
            className="rounded-lg border border-slate-300 px-3 py-2 active:bg-slate-50"
            onPress={() => setImportOpen(true)}
          >
            <Text className="text-sm font-semibold text-slate-800">Import</Text>
          </Pressable>
          <Pressable
            className="rounded-lg bg-indigo-600 px-3 py-2 active:bg-indigo-700"
            onPress={openCreate}
          >
            <Text className="text-sm font-semibold text-white">Add customer</Text>
          </Pressable>
        </View>
      </View>

      {stats ? (
        <View className="mt-3 flex-row flex-wrap gap-2 px-4">
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-xs text-slate-500">Total</Text>
            <Text className="text-xl font-bold text-slate-900">
              {stats.total_customers}
            </Text>
            <Text className="text-xs text-slate-500">
              {stats.active_customers} active
            </Text>
          </View>
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-xs text-slate-500">Individuals</Text>
            <Text className="text-xl font-bold text-blue-700">
              {stats.individual_customers}
            </Text>
            <Text className="text-xs text-slate-500">
              {stats.total_customers > 0
                ? `${((stats.individual_customers / stats.total_customers) * 100).toFixed(1)}%`
                : '—'}
            </Text>
          </View>
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-xs text-slate-500">Business</Text>
            <Text className="text-xl font-bold text-violet-700">
              {stats.business_customers}
            </Text>
            <Text className="text-xs text-slate-500">
              {stats.total_customers > 0
                ? `${((stats.business_customers / stats.total_customers) * 100).toFixed(1)}%`
                : '—'}
            </Text>
          </View>
          <View className="min-w-[45%] flex-1 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-xs text-slate-500">Active rate</Text>
            <Text className="text-xl font-bold text-emerald-700">
              {stats.total_customers > 0
                ? `${((stats.active_customers / stats.total_customers) * 100).toFixed(1)}%`
                : '—'}
            </Text>
          </View>
        </View>
      ) : null}

      <View className="mt-4 px-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          Search & filters
        </Text>
        <View className="rounded-xl border border-slate-200 bg-white p-3">
          <View className="flex-row items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Ionicons name="search-outline" size={18} color="#94a3b8" />
            <TextInput
              className="ml-2 flex-1 py-2 text-sm text-slate-900"
              placeholder="Name, email, phone, CNIC…"
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setStatusSheetOpen(true)}
            >
              <Text className="text-center text-xs font-semibold text-slate-700">
                Status: {statusFilter}
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2"
              onPress={() => setTypeSheetOpen(true)}
            >
              <Text className="text-center text-xs font-semibold text-slate-700">
                Type: {typeFilter}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className="mt-4 px-4">
        <Text className="text-base font-semibold text-slate-900">Customer list</Text>
        <Text className="text-sm text-slate-500">
          {totalCount > 0
            ? `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
            : 'No customers'}
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
        data={customers}
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
              No customers match your filters.
            </Text>
          )
        }
        renderItem={({ item: c }) => {
          const emailDisplay = (() => {
            const ev = (c.emails || []).filter((e) => e.value.trim());
            if (ev.length) return ev.map((e) => e.value).join(', ');
            return c.email || '—';
          })();
          const phoneRows = (() => {
            const pv = (c.phones || []).filter((p) => p.value.trim());
            if (pv.length) return pv;
            const rows: { value: string; label: string }[] = [];
            if (c.phone?.trim()) rows.push({ value: c.phone, label: 'work' });
            if (c.mobile?.trim())
              rows.push({ value: c.mobile, label: 'personal' });
            return rows;
          })();
          return (
            <View className="mx-4 mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1">
                  <Text className="font-mono text-xs text-slate-500">
                    {c.customerId}
                  </Text>
                  <Text className="text-lg font-semibold text-slate-900">
                    {c.firstName} {c.lastName}
                  </Text>
                  <Text className="text-sm text-slate-600">{emailDisplay}</Text>
                  {phoneRows.map((p, i) => (
                    <Text key={i} className="text-sm text-slate-600">
                      ({p.label}) {p.value}
                    </Text>
                  ))}
                  {c.cnic ? (
                    <Text className="text-xs text-slate-500">CNIC {c.cnic}</Text>
                  ) : null}
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        c.customerType === 'business'
                          ? 'bg-violet-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium capitalize ${
                          c.customerType === 'business'
                            ? 'text-violet-800'
                            : 'text-blue-800'
                        }`}
                      >
                        {c.customerType}
                      </Text>
                    </View>
                    <View
                      className={`rounded-full px-2 py-0.5 ${
                        c.customerStatus === 'active'
                          ? 'bg-emerald-100'
                          : c.customerStatus === 'blocked'
                            ? 'bg-red-100'
                            : 'bg-slate-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium capitalize ${
                          c.customerStatus === 'active'
                            ? 'text-emerald-800'
                            : c.customerStatus === 'blocked'
                              ? 'text-red-800'
                              : 'text-slate-700'
                        }`}
                      >
                        {c.customerStatus}
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-right font-semibold text-slate-900">
                    Rs. {c.creditLimit.toLocaleString()}
                  </Text>
                  <Text className="text-right text-xs text-slate-500">
                    Bal. Rs. {c.currentBalance.toLocaleString()}
                  </Text>
                  <View className="mt-2 flex-row gap-2">
                    <Pressable
                      onPress={() => void openEdit(c)}
                      className="rounded-lg bg-slate-100 p-2 active:bg-slate-200"
                    >
                      <Ionicons name="pencil-outline" size={18} color="#334155" />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setCustomerToDelete(c);
                        setDeleteOpen(true);
                      }}
                      className="rounded-lg bg-red-50 p-2 active:bg-red-100"
                    >
                      <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />

      <OptionSheet
        visible={statusSheetOpen}
        title="Status"
        options={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'blocked', label: 'Blocked' },
        ]}
        onSelect={(v) => setStatusFilter(v)}
        onClose={() => setStatusSheetOpen(false)}
      />
      <OptionSheet
        visible={typeSheetOpen}
        title="Type"
        options={[
          { value: 'all', label: 'All' },
          { value: 'individual', label: 'Individual' },
          { value: 'business', label: 'Business' },
        ]}
        onSelect={(v) => setTypeFilter(v)}
        onClose={() => setTypeSheetOpen(false)}
      />

      <AppModal visible={createOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-bold text-slate-900">New customer</Text>
            {renderFormFields(false)}
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
                onPress={() => void submitCreate()}
              >
                <Text className="font-semibold text-white">Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      <AppModal visible={editOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[92%] rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <Text className="text-lg font-bold text-slate-900">Edit customer</Text>
            {renderFormFields(true)}
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
                onPress={() => void submitEdit()}
              >
                <Text className="font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      <AppModal visible={deleteOpen} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-5">
            <Text className="text-lg font-bold text-slate-900">Delete customer</Text>
            <Text className="mt-2 text-slate-600">
              Delete {customerToDelete?.firstName} {customerToDelete?.lastName}?
              This cannot be undone.
            </Text>
            <View className="mt-4 flex-row justify-end gap-2">
              <Pressable
                className="rounded-lg border border-slate-300 px-4 py-2"
                onPress={() => {
                  setDeleteOpen(false);
                  setCustomerToDelete(null);
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
      </AppModal>

      <AppModal visible={importOpen} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-5">
            <Text className="text-lg font-bold text-slate-900">Import customers</Text>
            <Text className="mt-2 text-sm text-slate-600">
              Choose a CSV or Excel file. Same rules as the web app.
            </Text>
            <Pressable
              disabled={importBusy}
              className="mt-4 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
              onPress={() => void runImport()}
            >
              {importBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-semibold text-white">Choose file</Text>
              )}
            </Pressable>
            <Pressable
              className="mt-3 items-center py-2"
              onPress={() => setImportOpen(false)}
            >
              <Text className="font-semibold text-slate-600">Close</Text>
            </Pressable>
          </View>
        </View>
      </AppModal>

      <AppModal visible={guarantorOpen} transparent animationType="fade">
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="text-lg font-bold text-slate-900">
              {editingGuarantorId || editingCreateGuarantorIndex != null
                ? 'Edit guarantor'
                : 'Add guarantor'}
            </Text>
            <ScrollView className="mt-3 max-h-80" keyboardShouldPersistTaps="handled">
              {(
                [
                  ['name', 'Name *', 'Full name'],
                  ['mobile', 'Mobile', 'Phone'],
                  ['cnic', 'CNIC', 'CNIC'],
                  [
                    'residential_address',
                    'Residential address',
                    'Address',
                  ],
                  ['official_address', 'Official address', 'Office'],
                  ['occupation', 'Occupation', 'Job'],
                  ['relation', 'Relation', 'e.g. friend'],
                ] as const
              ).map(([key, label, ph]) => (
                <View key={key} className="mb-3">
                  <Text className="mb-1 text-xs font-medium text-slate-600">
                    {label}
                  </Text>
                  <TextInput
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
                    value={guarantorTextField(
                      guarantorForm,
                      key as keyof GuarantorCreate,
                    )}
                    onChangeText={(t) =>
                      setGuarantorForm((p) => ({
                        ...p,
                        [key]: t,
                      }))
                    }
                    placeholder={ph}
                  />
                </View>
              ))}
            </ScrollView>
            <View className="mt-2 flex-row gap-2">
              <Pressable
                className="flex-1 items-center rounded-lg border border-slate-300 py-3"
                onPress={() => setGuarantorOpen(false)}
              >
                <Text className="font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 items-center rounded-lg bg-indigo-600 py-3 active:bg-indigo-700"
                onPress={() => void submitGuarantorDialog()}
                disabled={!guarantorForm.name.trim()}
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
