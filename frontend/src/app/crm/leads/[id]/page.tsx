'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ModuleGuard } from '@/src/components/guards/PermissionGuard';
import { DashboardLayout } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Tags,
  Target,
  Star,
  User,
} from 'lucide-react';
import CRMService from '@/src/services/CRMService';
import { Lead, SalesActivity, ActivityType, LeadStatus, LeadUpdate } from '@/src/models/crm';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { toast } from 'sonner';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contacted', color: 'bg-amber-100 text-amber-800' },
  qualified: { label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  proposal_sent: { label: 'Proposal Sent', color: 'bg-cyan-100 text-cyan-800' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-100 text-orange-800' },
  won: { label: 'Won', color: 'bg-green-100 text-green-800' },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-800' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function LeadDetailPage() {
  return (
    <ModuleGuard module="crm" fallback={<div>You don't have access to CRM module</div>}>
      <LeadDetailContent />
    </ModuleGuard>
  );
}

function LeadDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const leadId = typeof params.id === 'string' ? params.id : '';

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [notesContent, setNotesContent] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState<LeadUpdate>({});

  const fetchLead = useCallback(async () => {
    if (!leadId) { router.replace('/crm/leads'); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await CRMService.getLead(leadId) as Lead;
      setLead(data);
      setNotesContent(data.notes || '');
      const acts = await CRMService.getActivities({}, 1, 50) as any;
      const leadActs = (acts.activities || []).filter((a: SalesActivity) => a.leadId === leadId);
      setActivities(leadActs);
    } catch (err) {
      setError('Failed to load lead. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [leadId, router]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  const openEditDialog = () => {
    if (!lead) return;
    setEditForm({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      jobTitle: lead.jobTitle,
      status: lead.status,
      source: lead.source || lead.leadSource,
      budget: lead.budget,
      notes: lead.notes,
    });
    setIsEditOpen(true);
  };

  const handleUpdateLead = async () => {
    if (!lead) return;
    try {
      await CRMService.updateLead(lead.id, editForm);
      toast.success('Lead updated!');
      setIsEditOpen(false);
      fetchLead();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update lead.');
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    try {
      await CRMService.deleteLead(lead.id);
      toast.success('Lead deleted.');
      router.push('/crm/leads');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete lead.');
    }
  };

  const handleAddNote = async () => {
    if (!notesContent.trim() || !lead) return;
    try {
      await CRMService.createActivity({
        type: ActivityType.NOTE,
        subject: 'Note',
        description: notesContent,
        leadId: lead.id,
        completed: true,
      });
      toast.success('Note added!');
      setNotesContent('');
      fetchLead();
    } catch { toast.error('Failed to add note.'); }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await CRMService.deleteActivity(id);
      toast.success('Activity deleted.');
      fetchLead();
    } catch { toast.error('Failed to delete activity.'); }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 overflow-y-auto p-4 bg-[#e5e7eb] flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !lead) {
    return (
      <DashboardLayout>
        <div className="flex-1 overflow-y-auto p-4 bg-[#e5e7eb] flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <p className="text-red-500 mb-4">{error || 'Lead not found'}</p>
            <Button onClick={() => router.push('/crm/leads')}>Back to Leads</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const source = lead.source ?? lead.leadSource;
  const statusCfg = STATUS_LABELS[lead.status] || STATUS_LABELS.new;
  const priorityColor = PRIORITY_COLORS[(lead.priority || 'medium').toLowerCase()] || PRIORITY_COLORS.medium;
  const leadActivities = activities || [];
  const noteActivities = leadActivities.filter(a => a.type !== ActivityType.TASK);

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5e7eb] font-['Inter',sans-serif]">
        <div className="max-w-[1400px] mx-auto">

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/crm/leads')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
                <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                {lead.priority && (
                  <Badge className={priorityColor}>{lead.priority}</Badge>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                Created {formatDate(lead.createdAt)} · Source: {source || '—'}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={openEditDialog}>
                <Pencil className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">

            {/* LEFT COLUMN */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">

              {/* Lead Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-semibold text-blue-600 shrink-0">
                    {lead.firstName?.charAt(0)?.toUpperCase() || '?'}{lead.lastName?.charAt(0)?.toUpperCase() || ''}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">{fullName}</div>
                    <div className="text-xs text-gray-500">{lead.company || '—'}</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700"><Phone className="w-3.5 h-3.5 text-green-500" /> Phone</div>
                    <span className="text-gray-900 font-medium">{lead.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700"><Mail className="w-3.5 h-3.5 text-green-500" /> Email</div>
                    <span className="text-gray-900 font-medium truncate max-w-[55%]">{lead.email || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700"><Briefcase className="w-3.5 h-3.5 text-blue-500" /> Job Title</div>
                    <span className="text-gray-900 font-medium">{lead.jobTitle || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700"><Building2 className="w-3.5 h-3.5 text-purple-500" /> Company</div>
                    <span className="text-gray-900 font-medium truncate max-w-[55%]">{lead.company || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700"><MapPin className="w-3.5 h-3.5 text-red-400" /> Timeline</div>
                    <span className="text-gray-900 font-medium">{lead.timeline || '—'}</span>
                  </div>
                </div>
                {(lead.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {lead.tags.map((tag, i) => (
                      <span key={i} className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                        <Tags className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Budget</div>
                  <div className="text-lg font-bold text-gray-900">{lead.budget ? formatCurrency(lead.budget) : '—'}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> Score</div>
                  <div className="text-lg font-bold text-gray-900">{lead.score ?? '—'}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Assigned: {lead.assignedTo || 'Unassigned'}</div>
                </div>
              </div>

              {/* Contact Dates */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="font-medium text-gray-800 text-sm mb-3">Contact Dates</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Contact</span>
                    <span className="font-medium text-gray-900">{formatDate(lead.lastContactDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Next Follow-up</span>
                    <span className="font-medium text-gray-900">{formatDate(lead.nextFollowUpDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex gap-6 border-b border-gray-100 pb-2 mb-4 text-sm text-gray-500">
                  <button
                    className={`cursor-pointer pb-2 -mb-2 border-b-2 transition ${activeTab === 'overview' ? 'text-blue-600 font-medium border-blue-600' : 'hover:text-gray-800 border-transparent'}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`cursor-pointer pb-2 -mb-2 border-b-2 transition ${activeTab === 'notes' ? 'text-blue-600 font-medium border-blue-600' : 'hover:text-gray-800 border-transparent'}`}
                    onClick={() => setActiveTab('notes')}
                  >
                    Notes & Activities ({noteActivities.length})
                  </button>
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <div className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1.5">Notes</div>
                      {lead.notes || <span className="text-gray-400">No notes provided.</span>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500">Created</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(lead.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Last Updated</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(lead.updatedAt)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Created By</div>
                        <div className="text-sm font-medium text-gray-900">{lead.createdBy || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Converted</div>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.convertedToContact || lead.convertedToOpportunity ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div>
                    <div className="relative border border-gray-200 rounded-lg bg-gray-50 p-2 mb-3 h-24">
                      <textarea
                        value={notesContent}
                        onChange={(e) => setNotesContent(e.target.value)}
                        className="w-full h-full bg-transparent outline-none text-sm text-gray-600 resize-none"
                        placeholder="Write a note..."
                      />
                      <div className="absolute right-3 bottom-3 text-xs text-gray-400">{notesContent.length}</div>
                    </div>
                    <div className="flex justify-end gap-3 mb-4">
                      <button className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200" onClick={() => setNotesContent('')}>Clear</button>
                      <button className="px-4 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600" onClick={handleAddNote}>Save</button>
                    </div>
                    <div className="border-t border-gray-200 pt-4 space-y-4">
                      {noteActivities.length === 0 && (
                        <div className="text-center text-gray-400 text-xs py-4">No notes or activities yet.</div>
                      )}
                      {noteActivities.map((act) => (
                        <div key={act.id} className="flex gap-3 border-b border-gray-100 pb-4">
                          <div className="text-blue-500 pt-0.5"><User className="w-4 h-4" /></div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-800 leading-relaxed mb-1">{act.description || act.subject}</div>
                            <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
                              <span>CREATED BY <span className="font-medium text-gray-700">{act.createdBy || 'System'}</span></span>
                              <span>{formatDate(act.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 text-gray-300 text-[10px] pt-0.5">
                            <button className="hover:text-red-500" onClick={() => handleDeleteActivity(act.id)}><i className="fa-regular fa-trash-can"></i></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={editForm.firstName || ''} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={editForm.lastName || ''} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input value={editForm.jobTitle || ''} onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status || 'new'} onValueChange={(v) => setEditForm({ ...editForm, status: v as LeadStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, cfg]) => (
                    <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input
                type="number"
                value={editForm.budget ?? 0}
                onChange={(e) => setEditForm({ ...editForm, budget: Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateLead}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-gray-900">{fullName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteLead}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
