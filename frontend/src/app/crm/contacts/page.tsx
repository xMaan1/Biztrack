'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleGuard } from '../../../components/guards/PermissionGuard';
import { DashboardLayout } from '../../../components/layout';
import { useCustomOptions } from '../../../hooks/useCustomOptions';
import { CustomOptionDialog } from '../../../components/common/CustomOptionDialog';
import CRMService from '@/src/services/CRMService';
import fileUploadService from '@/src/services/FileUploadService';
import {
  Contact,
  ContactType,
  CRMContactFilters,
  ContactCreate,
  ContactUpdate,
  ContactAttachment,
  Company,
} from '@/src/models/crm';
import {
  defaultEmailRowsFromEntity,
  defaultPhoneRowsFromEntity,
} from '@/src/components/crm/LabeledContactFields';
import {
  defaultSocialLinks,
  mergeSocialFromApi,
  birthdayInputFromApi,
  buildAddressesPayload,
} from '@/src/components/crm/contacts/contactUtils';
import { ContactsListCard } from '@/src/components/crm/contacts/ContactsListCard';
import { ContactFormDialog } from '@/src/components/crm/contacts/ContactFormDialog';
import { useAuth } from '@/src/contexts/AuthContext';
import { User } from '@/src/models';
import { apiService } from '@/src/services/ApiService';
import { toast } from 'sonner';
import { type UserSearchItem } from '@/src/components/ui/user-search';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import { Plus, Search, Bell, RotateCcw, HelpCircle, MessageSquare, Mail, ListFilter } from 'lucide-react';
import { useConfirm } from '@/src/contexts/ConfirmContext';

export default function CRMContactsPage() {
  return (
    <ModuleGuard
      module="crm"
      fallback={<div>You don't have access to CRM module</div>}
    >
      <CRMContactsContent />
    </ModuleGuard>
  );
}

const CONTACTS_PAGE_SIZE = 20;

const PINNED_FILTERS = [
  { key: 'active', label: 'Active', color: 'bg-emerald-500 text-white' },
  { key: 'inactive', label: 'Inactive', color: 'bg-gray-400 text-white' },
  { key: 'high_value', label: 'High Value', color: 'bg-blue-500 text-white' },
  { key: 'new', label: 'New', color: 'bg-purple-500 text-white' },
  { key: 'customer', label: 'Customers', color: 'bg-sky-400 text-white' },
  { key: 'partner', label: 'Partners', color: 'bg-orange-500 text-white' },
];

const FILTER_MAP: Record<string, CRMContactFilters> = {
  active: {},
  inactive: {},
  high_value: {},
  new: {},
  customer: { type: ContactType.CUSTOMER },
  partner: { type: ContactType.PARTNER },
};

function CRMContactsContent() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<CRMContactFilters>({});
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCustomContactTypeDialog, setShowCustomContactTypeDialog] = useState(false);
  const [openAdditional, setOpenAdditional] = useState(false);
  const [openAddresses, setOpenAddresses] = useState(false);
  const [openContactDetails, setOpenContactDetails] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activePinned, setActivePinned] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('updatedAt');

  const {
    customContactTypes,
    createCustomContactType,
    loading: customOptionsLoading,
  } = useCustomOptions();

  const [formData, setFormData] = useState<ContactCreate>({
    firstName: '',
    lastName: '',
    emails: [{ value: '', label: 'personal' }],
    phones: [{ value: '', label: 'work' }],
    jobTitle: '',
    department: '',
    companyId: '',
    contactType: ContactType.CUSTOMER,
    notes: '',
    description: '',
    tags: [],
    attachments: [] as ContactAttachment[],
    isActive: true,
    initials: '',
    fullName: '',
    birthday: '',
    businessTaxId: '',
    addresses: [],
    socialLinks: defaultSocialLinks(),
    assignedTo: '',
    website: '',
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const attachmentFileInputRef = React.useRef<HTMLInputElement>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const initialContactsLoad = React.useRef(true);
  const [pageSize, setPageSize] = useState(CONTACTS_PAGE_SIZE);

  const loadCompanies = useCallback(async () => {
    try {
      const response = await CRMService.getCompanies({}, 1, 100);
      setCompanies(response.companies || []);
    } catch (err) {
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      if (initialContactsLoad.current) {
        setLoading(true);
      } else {
        setListLoading(true);
      }
      const response = await CRMService.getContacts(filters, page, pageSize);
      setContacts(response.contacts);
      setTotalPages(Math.max(1, response.pagination.pages));
      setTotalCount(response.pagination.total);
    } catch (err) {
    } finally {
      setLoading(false);
      setListLoading(false);
      initialContactsLoad.current = false;
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const fetchUsers = useCallback(async () => {
    try {
      let tenantId: string | null = null;
      const selectedTenant = localStorage.getItem('selectedTenant');
      if (selectedTenant) {
        try {
          const parsed = JSON.parse(selectedTenant);
          tenantId = parsed.id || parsed.tenantId;
        } catch {
        }
      }
      if (!tenantId) {
        tenantId = localStorage.getItem('currentTenantId');
      }
      if (tenantId) {
        const response = await apiService.getTenantUsers(tenantId);
        const uniqueUsers = (response.users || []).reduce(
          (acc: User[], u: User) => {
            const existing = acc.find(
              (x) => x.userId === u.userId || x.id === u.userId,
            );
            if (!existing) acc.push(u);
            return acc;
          },
          [],
        );
        setUsers(uniqueUsers);
      } else {
        setUsers([]);
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const selectedAssignee = useMemo((): UserSearchItem | null => {
    if (!formData.assignedTo) return null;
    const found = users.find(
      (u) => (u.id || u.userId) === formData.assignedTo,
    );
    if (found) return found;
    return {
      id: formData.assignedTo,
      userId: formData.assignedTo,
      userName: formData.assignedTo,
    };
  }, [users, formData.assignedTo]);

  const handleSearch = () => {
    setFilters((prev: CRMContactFilters) => ({ ...prev, search }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({});
    setSearch('');
    setActivePinned(null);
    setPage(1);
  };

  const togglePinned = (key: string) => {
    if (activePinned === key) {
      setActivePinned(null);
      setFilters({});
    } else {
      setActivePinned(key);
      setFilters(FILTER_MAP[key] || {});
    }
    setPage(1);
  };

  const toggleSelectContact = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(contacts.map((c) => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleCreateCustomContactType = async (name: string, description: string) => {
    try {
      await createCustomContactType(name, description);
    } catch (error) {
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      emails: [{ value: '', label: 'personal' }],
      phones: [{ value: '', label: 'work' }],
      jobTitle: '',
      department: '',
      companyId: '',
      contactType: ContactType.CUSTOMER,
      notes: '',
      description: '',
      tags: [],
      attachments: [],
      isActive: true,
      initials: '',
      fullName: '',
      birthday: '',
      businessTaxId: '',
      addresses: [],
      socialLinks: defaultSocialLinks(),
      assignedTo: '',
      website: '',
    });
    setOpenAdditional(false);
    setOpenAddresses(false);
    setOpenContactDetails(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    setSubmitting(true);
    try {
      const addressesPayload = buildAddressesPayload(formData.addresses);
      const socialPayload = mergeSocialFromApi(formData.socialLinks);
      if (editingContact) {
        const payload: ContactUpdate = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          emails: (formData.emails || []).filter((e) => e.value.trim()),
          phones: (formData.phones || []).filter((p) => p.value.trim()),
          jobTitle: formData.jobTitle,
          department: formData.department,
          companyId: formData.companyId || undefined,
          contactType: formData.contactType,
          notes: formData.notes,
          description: formData.description,
          tags: formData.tags,
          attachments: formData.attachments,
          isActive: formData.isActive,
          initials: formData.initials?.trim() || null,
          fullName: formData.fullName?.trim() || null,
          businessTaxId: formData.businessTaxId?.trim() || null,
          addresses: addressesPayload,
          socialLinks: socialPayload,
          birthday: formData.birthday?.trim()
            ? `${formData.birthday.trim()}T00:00:00`
            : null,
          website: formData.website?.trim() || null,
          assignedTo: formData.assignedTo || undefined,
        };
        await CRMService.updateContact(editingContact.id, payload);
        toast.success('Contact updated successfully!');
        setShowCreateDialog(false);
        setEditingContact(null);
        resetForm();
        loadContacts();
      } else {
        await CRMService.createContact({
          ...formData,
          emails: (formData.emails || []).filter((e) => e.value.trim()),
          phones: (formData.phones || []).filter((p) => p.value.trim()),
          initials: formData.initials?.trim() || undefined,
          fullName: formData.fullName?.trim() || undefined,
          businessTaxId: formData.businessTaxId?.trim() || undefined,
          addresses: addressesPayload,
          socialLinks: socialPayload,
          ...(formData.birthday?.trim()
            ? { birthday: `${formData.birthday.trim()}T00:00:00` }
            : {}),
          website: formData.website?.trim() || undefined,
          assignedTo: formData.assignedTo || undefined,
        });
        toast.success('Contact created successfully!');
        setShowCreateDialog(false);
        resetForm();
        loadContacts();
      }
    } catch (error) {
      setErrorMessage('Error saving contact. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setErrorMessage('');
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      emails: defaultEmailRowsFromEntity(contact),
      phones: defaultPhoneRowsFromEntity(contact),
      jobTitle: contact.jobTitle || '',
      department: contact.department || '',
      companyId: contact.companyId || '',
      contactType: contact.contactType ?? ContactType.CUSTOMER,
      notes: contact.notes || '',
      description: contact.description || '',
      tags: contact.tags || [],
      attachments: contact.attachments || [],
      isActive: contact.isActive,
      initials: contact.initials || '',
      fullName: contact.fullName || '',
      birthday: birthdayInputFromApi(contact.birthday),
      businessTaxId: contact.businessTaxId || '',
      addresses: Array.isArray(contact.addresses) ? contact.addresses : [],
      socialLinks: mergeSocialFromApi(contact.socialLinks),
      assignedTo: contact.assignedTo || '',
      website: contact.website || '',
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (contactId: string) => {
    const ok = await confirm({ description: 'Are you sure you want to delete this contact?', destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try {
      await CRMService.deleteContact(contactId);
      toast.success('Contact deleted successfully!');
      loadContacts();
    } catch (error) {
      setErrorMessage('Error deleting contact. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleAttachmentFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentUploading(true);
    try {
      const res = await fileUploadService.uploadDocument(file);
      setFormData((prev) => ({
        ...prev,
        attachments: [
          ...(prev.attachments || []),
          {
            url: res.file_url,
            original_filename: res.original_filename,
            s3_key: res.s3_key,
          },
        ],
      }));
    } catch {
      setErrorMessage('File upload failed. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setAttachmentUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachmentAt = async (index: number) => {
    const list = formData.attachments || [];
    const att = list[index];
    if (att) {
      const key = att.s3_key || fileUploadService.extractS3KeyFromUrl(att.url);
      if (key) {
        try {
          await fileUploadService.deleteFile(key);
        } catch {
          setErrorMessage('Removed from list; storage delete may have failed.');
          setTimeout(() => setErrorMessage(''), 5000);
        }
      }
    }
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading Contacts...</p>
        </div>
      </div>
    );
  }

  const showClear = activePinned !== null || !!filters.search;

  return (
    <DashboardLayout>
      <div className="bg-white min-h-screen">
        <div className="px-6 py-5 space-y-5">

          {/* TOP ACTION BAR */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-700" onClick={loadContacts}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Select value="apply_actions" onValueChange={() => {}}>
                <SelectTrigger className="w-[150px] h-9 text-[12px] rounded-lg border-gray-200">
                  <SelectValue placeholder="APPLY ACTIONS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apply_actions" disabled>APPLY ACTIONS</SelectItem>
                  <SelectItem value="assign">Assign to user</SelectItem>
                  <SelectItem value="change_type">Change type</SelectItem>
                  <SelectItem value="change_status">Change status</SelectItem>
                  <SelectItem value="delete_selected">Delete selected</SelectItem>
                </SelectContent>
              </Select>
              <Select value="saved_filter" onValueChange={() => {}}>
                <SelectTrigger className="w-[180px] h-9 text-[12px] rounded-lg border-gray-200">
                  <SelectValue placeholder="APPLY SAVED FILTER" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saved_filter" disabled>APPLY SAVED FILTER</SelectItem>
                  <SelectItem value="all_contacts">All Contacts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="high_value">High Value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              size="default"
              className="h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-[13px] shadow-sm"
              onClick={() => {
                setEditingContact(null);
                resetForm();
                const uid = user?.id || user?.userId;
                if (uid) {
                  setFormData((prev) => ({ ...prev, assignedTo: uid }));
                }
                setErrorMessage('');
                setShowCreateDialog(true);
              }}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mr-2">
                <Plus className="w-3 h-3 text-white" />
              </span>
              ADD NEW CONTACT
            </Button>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-600">
                <HelpCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-600">
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-600">
                <Mail className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-600">
                <Bell className="w-4 h-4" />
              </Button>
              <Avatar className="h-8 w-8 ml-2">
                <AvatarFallback className="text-[11px] bg-blue-500 text-white font-medium">AD</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* PINNED FILTERS ROW */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-medium text-gray-600 mr-1">Pinned:</span>
            {PINNED_FILTERS.map((pf) => (
              <button
                key={pf.key}
                onClick={() => togglePinned(pf.key)}
                className={`text-[11px] font-semibold px-3.5 py-1 rounded-full transition-colors cursor-pointer ${
                  activePinned === pf.key
                    ? `${pf.color} shadow-sm`
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {pf.label}
              </button>
            ))}
            {showClear && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-gray-400 hover:text-gray-600 ml-1 underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* FILTER BAR */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-gray-600">
                <ListFilter className="w-4 h-4" />
                <span className="text-[12px] font-semibold uppercase">Filters</span>
              </div>
              <Select value="date_range" onValueChange={() => {}}>
                <SelectTrigger className="w-[160px] h-8 text-[11px] rounded-lg border-gray-200">
                  <SelectValue placeholder="Date Created" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_range" disabled>Date Created</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  setSortBy(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px] h-8 text-[11px] rounded-lg border-gray-200">
                  <SelectValue placeholder="Show most recent first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt">Show most recent first</SelectItem>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="lifetimeValue">Lifetime Value</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[90px] h-8 text-[11px] rounded-lg border-gray-200">
                  <SelectValue placeholder="20" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / Page</SelectItem>
                  <SelectItem value="20">20 / Page</SelectItem>
                  <SelectItem value="50">50 / Page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="w-[260px] h-9 pl-9 text-[12px] rounded-full border-gray-200 bg-gray-50"
                />
              </div>
              <Button
                size="sm"
                className="h-9 px-5 bg-blue-500 hover:bg-blue-600 text-white text-[12px] font-semibold rounded-lg"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>

          {/* Contacts Table */}
          <ContactsListCard
            contacts={contacts}
            companies={companies}
            totalCount={totalCount}
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            listLoading={listLoading}
            selectedIds={selectedIds}
            onSelectContact={toggleSelectContact}
            onSelectAll={toggleSelectAll}
            onPageChange={setPage}
            onView={(contact) => { router.push(`/crm/contacts/${contact.id}`); }}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

        </div>

        {/* Create/Edit Contact Dialog */}
        <ContactFormDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              setEditingContact(null);
              resetForm();
              setErrorMessage('');
            }
          }}
          editingContact={editingContact}
          formData={formData}
          setFormData={setFormData}
          companies={companies}
          customContactTypes={customContactTypes}
          onRequestCustomContactType={() =>
            setShowCustomContactTypeDialog(true)
          }
          users={users}
          selectedAssignee={selectedAssignee}
          openAdditional={openAdditional}
          onToggleAdditional={() => setOpenAdditional((o) => !o)}
          openAddresses={openAddresses}
          onToggleAddresses={() => setOpenAddresses((o) => !o)}
          openContactDetails={openContactDetails}
          onToggleContactDetails={() => setOpenContactDetails((o) => !o)}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
          submitting={submitting}
          onCancel={() => {
            setShowCreateDialog(false);
              setEditingContact(null);
              resetForm();
              setErrorMessage('');
            }}
          attachmentFileInputRef={attachmentFileInputRef}
          onAttachmentFile={handleAttachmentFile}
          attachmentUploading={attachmentUploading}
          onRemoveAttachment={removeAttachmentAt}
        />

        {/* Custom Contact Type Dialog */}
        <CustomOptionDialog
          open={showCustomContactTypeDialog}
          onOpenChange={setShowCustomContactTypeDialog}
          title="Create New Contact Type"
          description="Create a custom contact type that will be available for your tenant."
          optionName="Contact Type"
          placeholder="e.g., Partner, Vendor"
          onSubmit={handleCreateCustomContactType}
          loading={customOptionsLoading.contactType}
        />
      </div>
    </DashboardLayout>
  );
}