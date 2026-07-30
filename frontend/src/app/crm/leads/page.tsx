'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ModuleGuard } from '../../../components/guards/PermissionGuard';
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
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import { Plus, Search, Bell, Settings } from 'lucide-react';
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
      <Suspense fallback={<div className="p-6">Loading leads...</div>}>
        <CRMLeadsContent />
      </Suspense>
    </ModuleGuard>
  );
}

const PRIORITY_OPTIONS = [
  { key: 'urgent', label: 'URGENT', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { key: 'high', label: 'HIGH', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  { key: 'medium', label: 'MEDIUM', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { key: 'low', label: 'LOW', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
];

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
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCustomLeadSourceDialog, setShowCustomLeadSourceDialog] = useState(false);

  const activePriority = filters.priority || null;
  const activeSearch = filters.search || '';

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
      if (leads.length === 0) setLoading(true);
      else setListLoading(true);
      const response = await CRMService.getLeads(filters, page, pageSize);
      setLeads(response.leads);
      setTotalPages(response.pagination.pages);
      setTotalCount(response.pagination.total);
    } catch (err) {
    } finally {
      setLoading(false);
      setListLoading(false);
    }
  }, [filters, page, pageSize, leads.length]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (searchParams.get('new') === '1') setIsCreateDialogOpen(true);
  }, [searchParams]);

  const handleCreateCustomLeadSource = async (name: string, description: string) => {
    try { await createCustomLeadSource(name, description); } catch (error) {}
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
      firstName, lastName, email,
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
      setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', jobTitle: '', status: LeadStatus.NEW, source: LeadSource.WEBSITE, notes: '', tags: [], score: 0, budget: undefined, timeline: '' });
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
      ...formData, firstName, lastName, email,
      phone: formData.phone?.trim() || undefined,
      company: formData.company?.trim() || undefined,
      jobTitle: formData.jobTitle?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      timeline: formData.timeline?.trim() || undefined,
    };
    try {
      setFormError(null);
      const updated = await CRMService.updateLead(selectedLead.id, payload) as Lead;
      setSelectedLead(updated);
      setIsEditDialogOpen(false);
      setIsViewDialogOpen(true);
      loadLeads();
    } catch (err) {
      setFormError('Failed to update lead. Please try again.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    const ok = await confirm({ description: 'Are you sure you want to delete this lead?', destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try { await CRMService.deleteLead(id); loadLeads(); } catch (err) {}
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({});
    setSearch('');
    setPage(1);
  };

  const togglePriority = (priority: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority === priority ? undefined : priority,
    }));
    setPage(1);
  };

  const toggleSelectLead = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const openEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      firstName: lead.firstName, lastName: lead.lastName, email: lead.email,
      phone: lead.phone || '', company: lead.company || '', jobTitle: lead.jobTitle || '',
      status: lead.status, source: lead.leadSource ?? lead.source, notes: lead.notes || '',
      tags: lead.tags, score: lead.score, budget: lead.budget, timeline: lead.timeline || '',
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
      <div className="container mx-auto p-6 space-y-4">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value="apply_actions" onValueChange={() => {}}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="APPLY ACTIONS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apply_actions" disabled>APPLY ACTIONS</SelectItem>
                <SelectItem value="assign">Assign to user</SelectItem>
                <SelectItem value="change_status">Change status</SelectItem>
                <SelectItem value="change_priority">Change priority</SelectItem>
                <SelectItem value="delete_selected">Delete selected</SelectItem>
              </SelectContent>
            </Select>
            <Select value="saved_filter" onValueChange={() => {}}>
              <SelectTrigger className="w-[170px] h-9 text-sm">
                <SelectValue placeholder="APPLY SAVED FILTER" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saved_filter" disabled>APPLY SAVED FILTER</SelectItem>
                <SelectItem value="all_leads">All Leads</SelectItem>
                <SelectItem value="new_leads">New Leads</SelectItem>
                <SelectItem value="high_priority">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings className="w-4 h-4" />
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">AD</AvatarFallback>
            </Avatar>
            <Button size="sm" className="h-9" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> ADD NEW LEAD
            </Button>
          </div>
        </div>

        {/* Pinned Priority Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => togglePriority(opt.key)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                activePriority === opt.key
                  ? `${opt.color} border-transparent`
                  : 'bg-background text-muted-foreground border-muted-foreground/20 hover:border-muted-foreground/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {activePriority && (
            <button
              onClick={() => {
                setFilters((prev) => { const next = { ...prev }; delete next.priority; return next; });
                setPage(1);
              }}
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
            >
              × Clear
            </button>
          )}
        </div>

        {/* Filter & Search Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value="date_range" onValueChange={() => {}}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Custom Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_range" disabled>Custom Date Range</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortBy || 'updatedAt'}
            onValueChange={(v) => {
              setFilters((prev) => ({ ...prev, sortBy: v || undefined }));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Date Modified</SelectItem>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="10 Per Page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 Per Page</SelectItem>
              <SelectItem value="25">25 Per Page</SelectItem>
              <SelectItem value="50">50 Per Page</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {(activeSearch || Object.keys(filters).some((k) => k !== 'sortBy' && filters[k as keyof CRMLeadFilters] !== undefined)) && (
            <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={resetFilters}>
              Clear
            </Button>
          )}
        </div>

        {/* Leads Table */}
        <LeadsListCard
          leads={leads}
          totalCount={totalCount}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          listLoading={listLoading}
          selectedIds={selectedIds}
          onSelectLead={toggleSelectLead}
          onSelectAll={toggleSelectAll}
          onPageChange={setPage}
          onView={(lead) => { setSelectedLead(lead); setIsViewDialogOpen(true); }}
          onEdit={openEditLead}
          onDelete={handleDeleteLead}
        />

        {/* Create Lead Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) setFormError(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>Add a new lead to your CRM system</DialogDescription>
            </DialogHeader>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={formData.company} onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input id="jobTitle" value={formData.jobTitle} onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as LeadStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadStatus).map((status) => (
                      <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => {
                    if (value === 'create_new') setShowCustomLeadSourceDialog(true);
                    else setFormData((prev) => ({ ...prev, source: value as LeadSource }));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadSource).map((source) => (
                      <SelectItem key={source} value={source}>{source.replace('_', ' ').charAt(0).toUpperCase() + source.replace('_', ' ').slice(1)}</SelectItem>
                    ))}
                    {customLeadSources?.length > 0 && customLeadSources.map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>{cs.name}</SelectItem>
                    ))}
                    <SelectItem value="create_new" className="font-semibold text-blue-600">+ Create New Lead Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="score">Score</Label>
                <Input id="score" type="number" value={formData.score} onChange={(e) => setFormData((prev) => ({ ...prev, score: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input id="budget" type="number" value={formData.budget || ''} onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value ? parseFloat(e.target.value) : undefined }))} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateLead}>Create Lead</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Lead Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setFormError(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription>Update lead information</DialogDescription>
            </DialogHeader>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input id="editFirstName" value={formData.firstName} onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input id="editLastName" value={formData.lastName} onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="editEmail">Email *</Label>
                <Input id="editEmail" type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input id="editPhone" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="editCompany">Company</Label>
                <Input id="editCompany" value={formData.company} onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="editJobTitle">Job Title</Label>
                <Input id="editJobTitle" value={formData.jobTitle} onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as LeadStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadStatus).map((status) => (
                      <SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editSource">Source</Label>
                <Select value={formData.source} onValueChange={(value) => setFormData((prev) => ({ ...prev, source: value as LeadSource }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(LeadSource).map((source) => (
                      <SelectItem key={source} value={source}>{source.replace('_', ' ').charAt(0).toUpperCase() + source.replace('_', ' ').slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editScore">Score</Label>
                <Input id="editScore" type="number" value={formData.score} onChange={(e) => setFormData((prev) => ({ ...prev, score: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label htmlFor="editBudget">Budget</Label>
                <Input id="editBudget" type="number" value={formData.budget || ''} onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value ? parseFloat(e.target.value) : undefined }))} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea id="editNotes" value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateLead}>Update Lead</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Lead Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
              <DialogDescription>View complete lead information</DialogDescription>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Name</Label>
                    <p>{selectedLead.firstName} {selectedLead.lastName}</p>
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
                    <Badge className={CRMService.getLeadStatusColor(selectedLead.status ?? 'new')}>
                      {(selectedLead.status ?? 'new').charAt(0).toUpperCase() + (selectedLead.status ?? 'new').slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Source</Label>
                    <Badge variant="outline">
                      {((selectedLead.leadSource ?? selectedLead.source) ?? '').replace('_', ' ').charAt(0).toUpperCase() +
                        ((selectedLead.leadSource ?? selectedLead.source) ?? '').replace('_', ' ').slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Score</Label>
                    <p>{selectedLead.score}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Budget</Label>
                    <p>{selectedLead.budget ? CRMService.formatCurrency(selectedLead.budget) : 'N/A'}</p>
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
                      <p>{CRMService.formatDate(selectedLead.lastContactDate)}</p>
                    </div>
                  )}
                  {selectedLead.nextFollowUpDate && (
                    <div>
                      <Label className="font-medium">Next Follow-up</Label>
                      <p>{CRMService.formatDate(selectedLead.nextFollowUpDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              <Button onClick={() => { setIsViewDialogOpen(false); if (selectedLead) openEditLead(selectedLead); }}>
                Edit Lead
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
