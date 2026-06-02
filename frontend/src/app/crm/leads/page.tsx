'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModuleGuard } from '../../../components/guards/PermissionGuard';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Plus, Search, Filter } from 'lucide-react';
import { LeadsListCard } from '@/src/components/crm/leads/LeadsListCard';
import CRMService from '@/src/services/CRMService';
import {
  Lead,
  LeadCreate,
  LeadStatus,
  LeadSource,
  CRMLeadFilters,
} from '@/src/models/crm';
import { DashboardLayout } from '../../../components/layout';
import { useConfirm } from '@/src/contexts/ConfirmContext';
import { useCustomOptions } from '../../../hooks/useCustomOptions';
import { CustomOptionDialog } from '../../../components/common/CustomOptionDialog';

export default function CRMLeadsPage() {
  return (
    <ModuleGuard module="crm" fallback={<div>You don't have access to CRM module</div>}>
      <CRMLeadsContent />
    </ModuleGuard>
  );
}

function CRMLeadsContent() {
  const confirm = useConfirm();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<CRMLeadFilters>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCustomLeadSourceDialog, setShowCustomLeadSourceDialog] =
    useState(false);

  // Custom options hook
  const {
    customLeadSources,
    createCustomLeadSource,
    loading: customOptionsLoading,
  } = useCustomOptions();

  const [formData, setFormData] = useState<LeadCreate>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    status: LeadStatus.NEW,
    source: LeadSource.WEBSITE,
    notes: '',
    tags: [],
    score: 0,
    budget: undefined,
    timeline: '',
  });

  const loadLeads = useCallback(async () => {
    try {
      if (leads.length === 0) {
        setLoading(true);
      } else {
        setListLoading(true);
      }
      const response = await CRMService.getLeads(filters, page, 10);
      setLeads(response.leads);
      setTotalPages(response.pagination.pages);
      setTotalCount(response.pagination.total);
    } catch (err) {
      } finally {
      setLoading(false);
      setListLoading(false);
    }
  }, [filters, page, leads.length]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsCreateDialogOpen(true);
    }
  }, [searchParams]);

  const handleCreateCustomLeadSource = async (
    name: string,
    description: string,
  ) => {
    try {
      await createCustomLeadSource(name, description);
    } catch (error) {
      }
  };

  const handleCreateLead = async () => {
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = (formData.email || '').trim();
    if (!firstName || !lastName || !emailPattern.test(email)) {
      setFormError('First name, last name, and a valid email are required.');
      return;
    }

    const payload: LeadCreate = {
      ...formData,
      firstName,
      lastName,
      email,
      phone: formData.phone?.trim() || undefined,
      company: formData.company?.trim() || undefined,
      jobTitle: formData.jobTitle?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      timeline: formData.timeline?.trim() || undefined,
    };

    try {
      setFormError(null);
      await CRMService.createLead(payload);
      setIsCreateDialogOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        jobTitle: '',
        status: LeadStatus.NEW,
        source: LeadSource.WEBSITE,
        notes: '',
        tags: [],
        score: 0,
        budget: undefined,
        timeline: '',
      });
      loadLeads();
    } catch (err) {
      setFormError('Failed to create lead. Please try again.');
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = (formData.email || '').trim();
    if (!firstName || !lastName || !emailPattern.test(email)) {
      setFormError('First name, last name, and a valid email are required.');
      return;
    }

    const payload: LeadCreate = {
      ...formData,
      firstName,
      lastName,
      email,
      phone: formData.phone?.trim() || undefined,
      company: formData.company?.trim() || undefined,
      jobTitle: formData.jobTitle?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      timeline: formData.timeline?.trim() || undefined,
    };

    try {
      setFormError(null);
      await CRMService.updateLead(selectedLead.id, payload);
      setIsEditDialogOpen(false);
      loadLeads();
    } catch (err) {
      setFormError('Failed to update lead. Please try again.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    const ok = await confirm({
      description: 'Are you sure you want to delete this lead?',
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    try {
      await CRMService.deleteLead(id);
      loadLeads();
    } catch (err) {
      }
  };

  const handleSearch = () => {
    setFilters((prev: CRMLeadFilters) => ({ ...prev, search }));
    setPage(1);
  };

  const handleFilterChange = (key: keyof CRMLeadFilters, value: string) => {
    setFilters((prev: CRMLeadFilters) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({});
    setSearch('');
    setPage(1);
  };

  const openEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      jobTitle: lead.jobTitle || '',
      status: lead.status,
      source: lead.leadSource ?? lead.source,
      notes: lead.notes || '',
      tags: lead.tags,
      score: lead.score,
      budget: lead.budget,
      timeline: lead.timeline || '',
    });
    setIsEditDialogOpen(true);
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading Leads...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Leads</h1>
            <p className="text-gray-600">Manage and track your sales leads</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="flex space-x-2">
                  <Input
                    id="search"
                    placeholder="Search leads..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(LeadStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={filters.source || 'all'}
                  onValueChange={(value) => handleFilterChange('source', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {Object.values(LeadSource).map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.replace('_', ' ').charAt(0).toUpperCase() +
                          source.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <LeadsListCard
          leads={leads}
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          listLoading={listLoading}
          onPageChange={setPage}
          onView={(lead) => {
            setSelectedLead(lead);
            setIsViewDialogOpen(true);
          }}
          onEdit={openEditLead}
          onDelete={handleDeleteLead}
        />

        {/* Create Lead Dialog */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setFormError(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>
                Add a new lead to your CRM system
              </DialogDescription>
            </DialogHeader>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev: LeadCreate) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      jobTitle: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as LeadStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => {
                    if (value === 'create_new') {
                      setShowCustomLeadSourceDialog(true);
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        source: value as LeadSource,
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadSource).map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.replace('_', ' ').charAt(0).toUpperCase() +
                          source.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}

                    {/* Custom Lead Sources */}
                    {customLeadSources &&
                      customLeadSources.length > 0 &&
                      customLeadSources.map((customSource) => (
                        <SelectItem
                          key={customSource.id}
                          value={customSource.id}
                        >
                          {customSource.name}
                        </SelectItem>
                      ))}

                    <SelectItem
                      value="create_new"
                      className="font-semibold text-blue-600"
                    >
                      + Create New Lead Source
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  type="number"
                  value={formData.score}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      score: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      budget: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateLead}>Create Lead</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Lead Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setFormError(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>Update lead information</DialogDescription>
            </DialogHeader>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editCompany">Company</Label>
                <Input
                  id="editCompany"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editJobTitle">Job Title</Label>
                <Input
                  id="editJobTitle"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      jobTitle: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: value as LeadStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editSource">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      source: value as LeadSource,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadSource).map((source) => (
                      <SelectItem key={source} value={source}>
                        {source.replace('_', ' ').charAt(0).toUpperCase() +
                          source.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editScore">Score</Label>
                <Input
                  id="editScore"
                  type="number"
                  value={formData.score}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      score: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="editBudget">Budget</Label>
                <Input
                  id="editBudget"
                  type="number"
                  value={formData.budget || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      budget: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateLead}>Update Lead</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Lead Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
              <DialogDescription>
                View complete lead information
              </DialogDescription>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Name</Label>
                    <p>
                      {selectedLead.firstName} {selectedLead.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Email</Label>
                    <p>{selectedLead.email}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Phone</Label>
                    <p>{selectedLead.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Company</Label>
                    <p>{selectedLead.company || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Job Title</Label>
                    <p>{selectedLead.jobTitle || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Status</Label>
                    <Badge
                      className={CRMService.getLeadStatusColor(
                        selectedLead.status ?? 'new',
                      )}
                    >
                      {(selectedLead.status ?? 'new').charAt(0).toUpperCase() +
                        (selectedLead.status ?? 'new').slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Source</Label>
                    <Badge variant="outline">
                      {((selectedLead.leadSource ?? selectedLead.source) ?? '')
                        .replace('_', ' ')
                        .charAt(0)
                        .toUpperCase() +
                        ((selectedLead.leadSource ?? selectedLead.source) ?? '')
                          .replace('_', ' ')
                          .slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Score</Label>
                    <p>{selectedLead.score}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Budget</Label>
                    <p>
                      {selectedLead.budget
                        ? CRMService.formatCurrency(selectedLead.budget)
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {selectedLead.notes && (
                  <div>
                    <Label className="font-medium">Notes</Label>
                    <p className="text-gray-600">{selectedLead.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Created</Label>
                    <p>{CRMService.formatDateTime(selectedLead.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Last Updated</Label>
                    <p>{CRMService.formatDateTime(selectedLead.updatedAt)}</p>
                  </div>
                  {selectedLead.lastContactDate && (
                    <div>
                      <Label className="font-medium">Last Contact</Label>
                      <p>
                        {CRMService.formatDate(selectedLead.lastContactDate)}
                      </p>
                    </div>
                  )}
                  {selectedLead.nextFollowUpDate && (
                    <div>
                      <Label className="font-medium">Next Follow-up</Label>
                      <p>
                        {CRMService.formatDate(selectedLead.nextFollowUpDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Custom Lead Source Dialog */}
        <CustomOptionDialog
          open={showCustomLeadSourceDialog}
          onOpenChange={setShowCustomLeadSourceDialog}
          title="Create New Lead Source"
          description="Create a custom lead source that will be available for your tenant."
          optionName="Lead Source"
          placeholder="e.g., LinkedIn Campaign, Webinar"
          onSubmit={handleCreateCustomLeadSource}
          loading={customOptionsLoading.leadSource}
        />
      </div>
    </DashboardLayout>
  );
}
