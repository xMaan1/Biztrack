import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Building2,
} from 'lucide-react';
import CRMService from '@/src/services/CRMService';
import {
  Contact,
  ContactType,
  CRMContactFilters,
  ContactCreate,
} from '@/src/models/crm';
import { DashboardLayout } from '../../../components/layout';
import { useCustomOptions } from '../../../hooks/useCustomOptions';
import { CustomOptionDialog } from '../../../components/common/CustomOptionDialog';
import {
  PageHeader,
  SearchFilterBar,
  DeleteConfirmationModal,
  ErrorHandlerProvider,
  useAsyncErrorHandler
} from '../../../components/common';

function CRMContactsPageContent() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CRMContactFilters>({});
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCustomContactTypeDialog, setShowCustomContactTypeDialog] = useState(false);

  const { handleAsync, showSuccess } = useAsyncErrorHandler();

  const {
    customContactTypes,
    createCustomContactType,
    loading: customOptionsLoading,
  } = useCustomOptions();

  const [formData, setFormData] = useState<ContactCreate>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    jobTitle: '',
    department: '',
    companyId: '',
    type: ContactType.CUSTOMER,
    notes: '',
    tags: [],
    isActive: true,
  });
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    loadContacts();
    loadCompanies();
  }, [filters]);

  const loadContacts = useCallback(async () => {
    await handleAsync(async () => {
      setLoading(true);
      const response = await CRMService.getContacts(filters, 1, 100);
      setContacts(response.contacts);
    }, 'Failed to load contacts. Please try again.');
    
    setLoading(false);
  }, [filters, handleAsync]);

  const loadCompanies = useCallback(async () => {
    await handleAsync(async () => {
      const response = await CRMService.getCompanies({}, 1, 100);
      setCompanies(response.companies || []);
    }, 'Failed to load companies. Please try again.');
  }, [handleAsync]);

  const handleSearch = () => {
    setFilters((prev: CRMContactFilters) => ({ ...prev, search }));
  };

  const resetFilters = () => {
    setFilters({});
    setSearch('');
  };

  const handleCreateCustomContactType = async (
    name: string,
    description: string,
  ) => {
    await handleAsync(async () => {
      await createCustomContactType(name, description);
    }, 'Failed to create custom contact type. Please try again.');
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      jobTitle: '',
      department: '',
      companyId: '',
      type: ContactType.CUSTOMER,
      notes: '',
      tags: [],
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim()
    ) {
      alert('First name, last name, and email are required');
      return;
    }

    await handleAsync(async () => {
      setSubmitting(true);
      if (editingContact) {
        await CRMService.updateContact(editingContact.id, formData);
        showSuccess('Contact updated successfully!');
        setShowCreateDialog(false);
        setEditingContact(null);
        resetForm();
        loadContacts();
      } else {
        await CRMService.createContact(formData);
        showSuccess('Contact created successfully!');
        setShowCreateDialog(false);
        resetForm();
        loadContacts();
      }
    }, 'Error saving contact. Please try again.');
    
    setSubmitting(false);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      mobile: contact.mobile || '',
      jobTitle: contact.jobTitle || '',
      department: contact.department || '',
      companyId: contact.companyId || '',
      type: contact.type,
      notes: contact.notes || '',
      tags: contact.tags || [],
      isActive: contact.isActive,
    });
    setShowCreateDialog(true);
  };

  const handleView = (contact: Contact) => {
    setViewingContact(contact);
  };

  const handleDelete = async (contact: Contact) => {
    setDeletingContact(contact);
  };

  const confirmDelete = async () => {
    if (!deletingContact) return;

    await handleAsync(async () => {
      setDeleting(true);
      await CRMService.deleteContact(deletingContact.id);
      showSuccess('Contact deleted successfully!');
      setDeletingContact(null);
      loadContacts();
    }, 'Error deleting contact. Please try again.');
    
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading Contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="CRM Contacts"
          description="Manage your customer contacts and relationships"
          actions={[
            {
              label: 'New Contact',
              onClick: () => {
                setEditingContact(null);
                resetForm();
                setShowCreateDialog(true);
              },
              icon: <Plus className="w-4 h-4" />
            }
          ]}
        />

        <SearchFilterBar
          searchTerm={search}
          onSearchChange={setSearch}
          onSearch={handleSearch}
          searchPlaceholder="Search contacts..."
          filters={[
            {
              key: 'type',
              label: 'Type',
              options: [
                { value: 'all', label: 'All Types' },
                ...Object.values(ContactType).map((type) => ({
                  value: type,
                  label: type.charAt(0).toUpperCase() + type.slice(1)
                }))
              ]
            }
          ]}
          onFilterChange={(key, value) => {
            setFilters((prev: CRMContactFilters) => ({
              ...prev,
              [key]: value === 'all' ? undefined : value
            }));
          }}
          onClearFilters={resetFilters}
        />

        {/* Contacts List */}
        <Card>
          <CardHeader>
            <CardTitle>Contacts ({contacts.length})</CardTitle>
            <CardDescription>
              Manage your customer contacts and track interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contact.email}
                          </div>
                        </div>
                      </div>
                      {contact.companyId && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Building2 className="w-4 h-4" />
                          <span>Company ID: {contact.companyId}</span>
                        </div>
                      )}
                      {contact.jobTitle && (
                        <span className="text-sm text-gray-500">
                          {contact.jobTitle}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">
                        {contact.type.charAt(0).toUpperCase() +
                          contact.type.slice(1)}
                      </Badge>
                      <Badge
                        variant={contact.isActive ? 'default' : 'secondary'}
                      >
                        {contact.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {contact.notes && (
                      <div className="text-sm text-gray-600 mt-2">
                        {contact.notes}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>
                        Created: {CRMService.formatDate(contact.createdAt)}
                      </span>
                      {contact.lastContactDate && (
                        <span>
                          Last Contact:{' '}
                          {CRMService.formatDate(contact.lastContactDate)}
                        </span>
                      )}
                      {contact.nextFollowUpDate && (
                        <span>
                          Next Follow-up:{' '}
                          {CRMService.formatDate(contact.nextFollowUpDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(contact)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(contact)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Contact Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Edit Contact' : 'Create New Contact'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    type="email"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile: e.target.value })
                    }
                    placeholder="Enter mobile number"
                  />
                </div>

                <div>
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, jobTitle: e.target.value })
                    }
                    placeholder="Enter job title"
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="Enter department"
                  />
                </div>

                <div>
                  <Label htmlFor="companyId">Company</Label>
                  <Select
                    value={formData.companyId || 'none'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        companyId: value === 'none' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Company</SelectItem>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Contact Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      if (value === 'create_new') {
                        setShowCustomContactTypeDialog(true);
                      } else {
                        setFormData({
                          ...formData,
                          type: value as ContactType,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ContactType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}

                      {/* Custom Contact Types */}
                      {customContactTypes &&
                        customContactTypes.length > 0 &&
                        customContactTypes.map((customType) => (
                          <SelectItem key={customType.id} value={customType.id}>
                            {customType.name}
                          </SelectItem>
                        ))}

                      <SelectItem
                        value="create_new"
                        className="font-semibold text-blue-600"
                      >
                        + Create New Contact Type
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value === 'active' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes about the contact"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value
                          ? e.target.value.split(',').map((tag) => tag.trim())
                          : [],
                      })
                    }
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingContact(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? 'Saving...'
                    : editingContact
                      ? 'Update Contact'
                      : 'Create Contact'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Contact Dialog */}
        <Dialog
          open={!!viewingContact}
          onOpenChange={() => setViewingContact(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contact Details</DialogTitle>
            </DialogHeader>

            {viewingContact && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      First Name
                    </Label>
                    <p className="text-lg font-semibold">
                      {viewingContact.firstName}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Last Name
                    </Label>
                    <p className="text-lg font-semibold">
                      {viewingContact.lastName}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Email
                    </Label>
                    <p>{viewingContact.email}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Phone
                    </Label>
                    <p>{viewingContact.phone || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Mobile
                    </Label>
                    <p>{viewingContact.mobile || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Job Title
                    </Label>
                    <p>{viewingContact.jobTitle || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Department
                    </Label>
                    <p>{viewingContact.department || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Company
                    </Label>
                    <p>
                      {viewingContact.companyId
                        ? companies.find(
                            (c) => c.id === viewingContact.companyId,
                          )?.name || 'Company ID: ' + viewingContact.companyId
                        : 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Contact Type
                    </Label>
                    <p>
                      {viewingContact.type.charAt(0).toUpperCase() +
                        viewingContact.type.slice(1)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <Badge
                      variant={
                        viewingContact.isActive ? 'default' : 'secondary'
                      }
                    >
                      {viewingContact.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Notes
                    </Label>
                    <p>{viewingContact.notes || 'No notes'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {viewingContact.tags && viewingContact.tags.length > 0 ? (
                        viewingContact.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p>No tags</p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Created
                    </Label>
                    <p>{CRMService.formatDate(viewingContact.createdAt)}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Last Updated
                    </Label>
                    <p>{CRMService.formatDate(viewingContact.updatedAt)}</p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewingContact(null)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setViewingContact(null);
                      handleEdit(viewingContact);
                    }}
                  >
                    Edit Contact
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <DeleteConfirmationModal
          open={!!deletingContact}
          onOpenChange={() => setDeletingContact(null)}
          onConfirm={confirmDelete}
          title="Delete Contact"
          description={`Are you sure you want to delete "${deletingContact?.firstName} ${deletingContact?.lastName}"? This action cannot be undone.`}
          itemName={deletingContact ? `${deletingContact.firstName} ${deletingContact.lastName}` : ''}
          loading={deleting}
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

export default function CRMContactsPage() {
  return (
    <ErrorHandlerProvider defaultErrorType="toast">
      <CRMContactsPageContent />
    </ErrorHandlerProvider>
  );
}