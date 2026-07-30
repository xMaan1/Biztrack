'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ModuleGuard } from '@/src/components/guards/PermissionGuard';
import { DashboardLayout } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import CRMService from '@/src/services/CRMService';
import { Lead, SalesActivity, ActivityType } from '@/src/models/crm';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { toast } from 'sonner';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return `${Math.floor(diffMs / (1000 * 60))} minutes ago`;
  if (diffHrs < 24) return `${diffHrs} hours ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} days ago`;
}

function getPipelineLabel(status?: string): string {
  const map: Record<string, string> = {
    new: 'New Lead',
    contacted: 'Tried to contact',
    qualified: 'Qualified',
    proposal: 'Proposal',
    won: 'Won',
    lost: 'Lost',
  };
  return status ? (map[status] || status) : 'Open';
}

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
  const [activeTab, setActiveTab] = useState('notes');
  const [infoTab, setInfoTab] = useState('lead_data');
  const [notesContent, setNotesContent] = useState('');
  const [commType, setCommType] = useState<'note' | 'call'>('call');
  const [callResult, setCallResult] = useState('Lead Called In');
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [hideSystemNotes, setHideSystemNotes] = useState(false);
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [taskAssigned, setTaskAssigned] = useState('Asad Zaman');
  const [taskReminder, setTaskReminder] = useState('No reminder');
  const [taskStatus, setTaskStatus] = useState('Not Started');
  const [taskDue, setTaskDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });

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

  const handleAddActivity = async () => {
    if (!notesContent.trim() || !lead) return;
    try {
      await CRMService.createActivity({
        type: commType === 'call' ? ActivityType.CALL : ActivityType.NOTE,
        subject: commType === 'call' ? `Call - ${callResult}` : 'Note',
        description: notesContent,
        leadId: lead.id,
        completed: commType === 'call',
      });
      toast.success(`${commType === 'call' ? 'Call' : 'Note'} added!`);
      setNotesContent('');
      fetchLead();
    } catch { toast.error('Failed to add activity.'); }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !lead) return;
    try {
      await CRMService.createActivity({
        type: ActivityType.TASK,
        subject: taskTitle,
        description: taskDetails,
        leadId: lead.id,
        dueDate: taskDue,
        completed: false,
      });
      toast.success('Task added!');
      setTaskTitle('');
      setTaskDetails('');
      fetchLead();
    } catch { toast.error('Failed to add task.'); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    try {
      await CRMService.updateLead(lead.id, { status: newStatus as any });
      toast.success('Status updated!');
      fetchLead();
    } catch { toast.error('Failed to update status.'); }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await CRMService.deleteActivity(id);
      toast.success('Activity deleted.');
      fetchLead();
    } catch { toast.error('Failed to delete activity.'); }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await CRMService.deleteLead(lead.id);
      toast.success('Lead deleted.');
      router.push('/crm/leads');
    } catch { toast.error('Failed to delete lead.'); }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !lead) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#e5e7eb] flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-sm">
            <p className="text-red-500 mb-4">{error || 'Lead not found'}</p>
            <Button onClick={() => router.push('/crm/leads')}>Back to Leads</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = `${lead.firstName} ${lead.lastName}`;
  const source = lead.leadSource ?? lead.source;
  const leadActivities = activities || [];
  const pipelineLabel = getPipelineLabel(lead.status);
  const callCount = leadActivities.filter(a => a.type === ActivityType.CALL).length;
  const emailCount = leadActivities.filter(a => a.type === ActivityType.EMAIL).length;
  const smsCount = 0;
  const notesCallCount = leadActivities.length;

  function switchTab(tabId: string) {
    setActiveTab(tabId);
  }

  function switchInfoTab(tabId: string) {
    setInfoTab(tabId);
  }

  const displayedActivities = leadActivities.filter(a => !hideSystemNotes || a.type !== ActivityType.NOTE);

  return (
    <DashboardLayout>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style>{`
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .tab-btn { position: relative; cursor: pointer; color: #6b7280; transition: color 0.2s; }
        .tab-btn:hover { color: #374151; }
        .tab-btn.active { color: #2563eb; font-weight: 500; }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -9px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #2563eb;
        }
        select.call-result-dropdown:focus-visible { outline: 2px solid #ef4444; }
        .call-result-dropdown option:checked { background-color: #0284c7; color: white; }
        .map-placeholder {
          background-color: #f8fafc;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239aa0a6' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5e7eb] font-['Inter',sans-serif]">
        <div className="grid grid-cols-12 gap-4 max-w-[1600px] mx-auto">

          {/* LEFT COLUMN (col-span-4) */}
          <div className="col-span-4 flex flex-col gap-4">

            {/* Blue Banner */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="bg-blue-500 text-white px-4 py-2.5 flex justify-between items-center text-sm">
                <span className="flex items-center gap-2"><i className="fa-regular fa-circle-question"></i> Home Locator Mobile App Info</span>
                <div className="flex items-center gap-3"><i className="fa-regular fa-circle-question"></i> <i className="fa-solid fa-chevron-down"></i></div>
              </div>
              <div className="p-3 flex justify-between items-center bg-white border-t border-gray-100 text-xs">
                <span className="text-gray-600">Lead activity: <span className="font-semibold text-gray-900">Not active</span></span>
                <span className="text-gray-500">Last time link generated: <span className="font-medium text-gray-800">{formatDateShort(lead.updatedAt)}</span></span>
              </div>
              <div className="p-3 pt-0 pb-4 bg-white">
                <a href="#" className="text-blue-600 text-sm font-medium hover:underline">Get App Link</a>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between border-b border-gray-100 pb-3 mb-1">
                <input type="text" value={lead.firstName} className="w-[48%] text-base text-gray-800 outline-none bg-transparent font-medium" readOnly />
                <input type="text" value={lead.lastName} className="w-[48%] text-base text-gray-800 outline-none bg-transparent font-medium" readOnly />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm"><i className="fa-solid fa-phone text-green-500"></i> {lead.phone || '—'}</div>
                <button className="text-gray-400 hover:text-blue-500" onClick={() => toast.info('Edit Phone Clicked')}><i className="fa-regular fa-pen-to-square"></i></button>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm"><i className="fa-solid fa-at text-green-500"></i> {lead.email}</div>
                <div className="flex gap-2 text-gray-400">
                  <button className="hover:text-blue-500" onClick={() => toast.info('Edit Email Clicked')}><i className="fa-regular fa-pen-to-square"></i></button>
                  <button className="hover:text-blue-500" onClick={() => toast.info('Send Email Clicked')}><i className="fa-regular fa-envelope"></i></button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-blue-600 text-sm font-medium">
                <button className="flex items-center gap-1 hover:text-blue-800" onClick={() => toast.info('Add Additional Contact clicked')}><i className="fa-solid fa-plus"></i> Additional Contact</button>
                <button className="flex items-center gap-1 hover:text-blue-800" onClick={() => toast.info('Add Address clicked')}><i className="fa-solid fa-plus"></i> Add an address</button>
              </div>
              <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-4">
                <div className="flex gap-1.5">
                  <button className="w-7 h-7 border border-gray-200 rounded flex items-center justify-center text-gray-400"><i className="fa-regular fa-bookmark"></i></button>
                  <span className="w-7 h-7 rounded-full bg-cyan-400 text-white flex items-center justify-center text-[10px] font-bold">S</span>
                  <span className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold">L</span>
                  <button className="w-7 h-7 rounded-full bg-transparent text-blue-500 flex items-center justify-center hover:bg-blue-50 text-lg">+</button>
                </div>
                <div className="flex gap-2 text-gray-400 text-sm">
                  <button className="hover:text-gray-600" onClick={() => toast.info('Image Icon Clicked')}><i className="fa-regular fa-image"></i></button>
                  <button className="hover:text-gray-600" onClick={() => toast.info('Calendar Icon Clicked')}><i className="fa-regular fa-calendar-days"></i></button>
                  <button className="hover:text-gray-600" onClick={() => toast.info('Comment Icon Clicked')}><i className="fa-regular fa-comment"></i></button>
                  <button className="hover:text-gray-600" onClick={() => toast.info('File Icon Clicked')}><i className="fa-regular fa-file-lines"></i></button>
                  <button className="hover:text-gray-600" onClick={() => toast.info('Phone Icon Clicked')}><i className="fa-solid fa-phone"></i></button>
                </div>
              </div>
              <div className="mt-3">
                <textarea
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  className="w-full border border-gray-200 rounded p-2 text-sm text-gray-700 outline-none focus:border-blue-500 resize-none h-20 text-xs placeholder-gray-400 bg-gray-50"
                  placeholder="Lead Description..."
                />
              </div>
            </div>

            {/* Activity Card (Red) */}
            <div className="bg-[#ef4444] text-white rounded-lg p-4 flex gap-4 shadow-sm relative border border-red-500 items-start">
              <div className="shrink-0 pt-1 text-xl"><i className="fa-regular fa-clock"></i></div>
              <div className="text-sm">
                <div className="font-medium mb-1">{lead.lastContactDate ? formatDate(lead.lastContactDate) : '—'}</div>
                <div className="opacity-90 mb-0.5">Title: {leadActivities.length > 0 ? leadActivities[0].subject : '—'}</div>
                <div className="opacity-90 mb-0.5">Status: {(lead.status ?? 'new').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                <div className="opacity-90">User: {lead.assignedTo || 'Unassigned'}</div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="font-medium text-gray-800 text-sm mb-2">Lead Stats</div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  {fullName} is a lead from {timeAgo(lead.createdAt) || 'recently'} who registered on {formatDateShort(lead.createdAt)}. {lead.lastContactDate ? `Last contacted ${timeAgo(lead.lastContactDate)}.` : ''} Lead has had a total of {callCount} calls, {emailCount} emails, &amp; {smsCount} SMS messages.
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="font-medium text-gray-800 text-sm mb-1">Last property view - {timeAgo(lead.updatedAt) || 'N/A'}</div>
                  <div className="text-xs text-gray-600 mb-3">This lead is interested in properties. <br /> <span className="font-medium text-gray-800">{lead.budget ? formatCurrency(lead.budget) : '—'}</span> budget range.</div>
                </div>
                <button className="w-full text-blue-500 border border-blue-500 rounded py-1.5 text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-50 transition" onClick={() => toast.info('More details clicked')}><i className="fa-regular fa-circle-question"></i> More details</button>
              </div>
            </div>

            {/* Pipeline & Integration Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="font-medium text-gray-800 text-sm mb-3">Pipeline</div>
                <div className="flex justify-between items-center bg-red-100 text-red-700 rounded px-3 py-2 text-xs font-medium">
                  {pipelineLabel}{lead.status !== 'new' ? ` (${formatDateShort(lead.updatedAt)})` : ''} <i className="fa-solid fa-chevron-down"></i>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div className="font-medium text-gray-800 text-sm mb-3">CRM Integrations</div>
                <button className="w-full text-blue-500 border border-blue-500 rounded py-1.5 text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-50 transition" onClick={() => toast.info('Setup Clicked')}><i className="fa-solid fa-arrow-right-to-bracket"></i> Setup</button>
              </div>
            </div>

            {/* Saved Listings Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <div className="font-medium text-gray-800 text-sm">Saved Listing Searches</div>
                <button className="text-blue-500 border border-blue-500 rounded px-3 py-1 text-xs font-medium hover:bg-blue-50 transition" onClick={() => toast.info('Add New Search Clicked')}><i className="fa-solid fa-plus mr-1"></i> Add New Search</button>
              </div>
              <div className="flex gap-4 pt-2 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-lg shrink-0">
                  <i className="fa-regular fa-circle-check"></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm text-gray-800">Brampton, Condo</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">Lead <i className="fa-regular fa-circle-check text-green-500"></i></div>
                    </div>
                    <div className="flex gap-1 text-[10px] text-gray-500">
                      <button className="w-5 h-5 rounded-full border border-red-300 text-red-500 flex items-center justify-center hover:bg-red-50" onClick={() => toast.info('Remove Search Clicked')}><i className="fa-solid fa-xmark"></i></button>
                      <button className="w-5 h-5 rounded-full border border-red-300 text-red-500 flex items-center justify-center hover:bg-red-50" onClick={() => toast.info('Restore Search Clicked')}><i className="fa-solid fa-rotate-left"></i></button>
                      <button className="w-5 h-5 rounded-full border border-red-300 text-red-500 flex items-center justify-center hover:bg-red-50" onClick={() => toast.info('External Link Clicked')}><i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i></button>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1 flex gap-2">
                    <span className="bg-gray-100 px-1.5 rounded">1</span> <span className="text-gray-400">&bull;</span> Brampton <span className="text-gray-400">&bull;</span> <span className="text-gray-700 font-medium">{lead.budget ? `${formatCurrency(lead.budget * 0.8)} - ${formatCurrency(lead.budget)}` : '$400,000 - $500,000'}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-2 flex gap-1"><span className="bg-gray-100 px-1 rounded">2 other criteria</span> <span className="bg-gray-100 px-1 rounded"><i className="fa-solid fa-tag text-[8px]"></i> 68</span></div>
                  <div className="mt-2 text-[10px] text-gray-500 border-t border-gray-100 pt-1">
                    <div>Details:</div>
                    <div className="flex justify-between"><span className="text-gray-400">emails sent 2</span> <span className="text-gray-400">&bull;</span> last sent at <span className="font-medium text-gray-700">{formatDateShort(lead.createdAt)}</span></div>
                    <div className="flex justify-between mt-0.5"><span className="text-gray-400">next at</span> <span className="font-medium text-gray-700">{formatDateShort(lead.updatedAt)}</span></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN (col-span-8) */}
          <div className="col-span-8 flex flex-col gap-4">

            {/* Top Action & Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-gray-800 text-sm">Notes & Calls ({notesCallCount})</div>
                <button className="text-blue-500 border border-blue-500 rounded px-4 py-1 text-xs font-medium hover:bg-blue-50 transition" onClick={() => toast.info('Load Lead Navigation clicked')}><i className="fa-regular fa-circle-check mr-1"></i> Load Lead Navigation</button>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-6 border-b border-gray-100 pb-2 mb-4 text-sm text-gray-500">
                <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => switchTab('notes')}>Notes & Calls ({notesCallCount})</button>
                <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => switchTab('timeline')}>Timeline</button>
                <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => switchTab('tasks')}>Tasks</button>
                <button className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => switchTab('emails')}>E-mails ({emailCount})</button>
                <button className={`tab-btn ${activeTab === 'sms' ? 'active' : ''}`} onClick={() => switchTab('sms')}>SMS ({smsCount})</button>
                <button className={`tab-btn ${activeTab === 'ecampaigns' ? 'active' : ''}`} onClick={() => switchTab('ecampaigns')}>E-campaigns</button>
                <button className={`tab-btn ${activeTab === 'sold' ? 'active' : ''}`} onClick={() => switchTab('sold')}>Sold Details</button>
              </div>

              {/* NOTES & CALLS TAB */}
              {activeTab === 'notes' && (
                <div>
                  <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline mb-4" onClick={() => switchTab('sold')}>Sold Details</div>

                  <div className="flex flex-wrap gap-3 mb-3 items-center">
                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-1.5 text-xs">
                      <input type="radio" name="comm_type" id="note" className="accent-blue-600" checked={commType === 'note'} onChange={() => setCommType('note')} /> <label htmlFor="note">Note</label>
                      <input type="radio" name="comm_type" id="call" className="accent-blue-600" checked={commType === 'call'} onChange={() => setCommType('call')} /> <label htmlFor="call">Call</label>
                    </div>
                    <input type="datetime-local" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} className="border border-blue-400 rounded px-2 py-1.5 text-xs text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    {commType === 'call' && (
                      <select value={callResult} onChange={(e) => setCallResult(e.target.value)} className="call-result-dropdown border border-red-400 rounded px-2 py-1.5 text-xs bg-gray-100 text-gray-700 outline-none focus:border-red-500 min-w-[140px]">
                        <option value="Lead Called In">Lead Called In</option>
                        <option value="Connected">Connected</option>
                        <option value="Interested">Interested</option>
                        <option value="Attempted">Attempted</option>
                        <option value="Called (No message left)">Called (No message left)</option>
                        <option value="Opt Out - Do not call">Opt Out - Do not call</option>
                        <option value="Lead Is Not There">Lead Is Not There</option>
                        <option value="Talked to Lead">Talked to Lead</option>
                        <option value="Wrong Number">Wrong Number</option>
                        <option value="Left Voice Mail">Left Voice Mail</option>
                        <option value="SMS Message" disabled>SMS Message</option>
                      </select>
                    )}
                  </div>

                  <div className="relative border border-gray-200 rounded-lg bg-gray-50 p-2 mb-3 h-28">
                    <textarea value={notesContent} onChange={(e) => setNotesContent(e.target.value)} className="w-full h-full bg-transparent outline-none text-sm text-gray-600 resize-none" placeholder="Content..."></textarea>
                    <div className="absolute right-3 bottom-3 text-xs text-gray-400">{notesContent.length}</div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200" onClick={() => setNotesContent('')}>Clear</button>
                    <button className="px-4 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600" onClick={handleAddActivity}>Save</button>
                  </div>

                  <div className="mt-6 border-t border-gray-200 pt-4 space-y-4">
                    {displayedActivities.map((act) => (
                      <div key={act.id} className="flex gap-3 border-b border-gray-100 pb-4">
                        <div className="text-blue-500 pt-0.5"><i className="fa-regular fa-clock"></i></div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-800 leading-relaxed mb-1">{act.description || act.subject}</div>
                          {act.type === ActivityType.CALL && (
                            <div className="text-xs text-gray-500"><span className="font-medium text-blue-600">CALL RESULT:</span> {act.subject.replace('Call - ', '')}</div>
                          )}
                          <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500">
                            <span>CREATED BY <span className="font-medium text-gray-700">{act.createdBy || 'System'}</span></span>
                            <span><i className="fa-regular fa-clock mr-1"></i> {formatDate(act.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 text-gray-300 text-[10px] pt-0.5">
                          <button className="hover:text-blue-500" onClick={() => toast.info('Edit Note Clicked')}><i className="fa-regular fa-pen-to-square"></i></button>
                          <button className="hover:text-red-500" onClick={() => handleDeleteActivity(act.id)}><i className="fa-regular fa-trash-can"></i></button>
                        </div>
                      </div>
                    ))}
                    {displayedActivities.length > 0 && (
                      <div className="flex justify-center mt-2">
                        <button className="px-4 py-1.5 border border-blue-500 text-blue-500 rounded-full text-xs font-medium hover:bg-blue-50 transition" onClick={() => setHideSystemNotes(!hideSystemNotes)}>{hideSystemNotes ? 'Show system notes' : 'Hide system notes'}</button>
                      </div>
                    )}
                    {displayedActivities.length === 0 && (
                      <div className="text-center text-gray-400 text-xs py-4">No notes or calls yet.</div>
                    )}
                  </div>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div>
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="pb-3 font-medium">Pipeline Status</th>
                        <th className="pb-3 font-medium">Date of Change (Local)</th>
                        <th className="pb-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-3">{pipelineLabel}</td>
                        <td className="py-3">{formatDate(lead.updatedAt)}</td>
                        <td className="py-3 text-right text-blue-500">
                          <button className="hover:text-blue-700 mr-3" onClick={() => toast.info('Edit Timeline 1')}><i className="fa-regular fa-pen-to-square"></i></button>
                          <button className="hover:text-red-500" onClick={() => toast.info('Delete Timeline 1')}><i className="fa-regular fa-trash-can"></i></button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3">New Lead</td>
                        <td className="py-3">{formatDate(lead.createdAt)}</td>
                        <td className="py-3 text-right text-gray-300">
                          <button className="hover:text-blue-500 mr-3" onClick={() => toast.info('Edit Timeline 2')}><i className="fa-regular fa-pen-to-square"></i></button>
                          <button className="hover:text-red-500" onClick={() => toast.info('Delete Timeline 2')}><i className="fa-regular fa-trash-can"></i></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  <div>
                    <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full bg-gray-100 border border-gray-200 rounded p-2 text-sm text-gray-600 placeholder-gray-400 outline-none" placeholder="Enter Title of new task..." />
                  </div>
                  <div>
                    <textarea value={taskDetails} onChange={(e) => setTaskDetails(e.target.value)} className="w-full bg-gray-100 border border-gray-200 rounded p-2 text-sm text-gray-600 placeholder-gray-400 outline-none h-28 resize-none" placeholder="Task details..."></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <select value={taskAssigned} onChange={(e) => setTaskAssigned(e.target.value)} className="w-full border border-blue-300 rounded p-2 text-sm text-gray-700 bg-white outline-none"><option>Asad Zaman</option><option>Naeem Iqbal</option><option>Gurleen Nagpal</option></select>
                      <select value={taskReminder} onChange={(e) => setTaskReminder(e.target.value)} className="w-full border border-blue-300 rounded p-2 text-sm text-gray-700 bg-white outline-none"><option>No reminder</option><option>15 minutes before</option><option>1 hour before</option><option>1 day before</option></select>
                    </div>
                    <div className="space-y-3">
                      <select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)} className="w-full border border-blue-300 rounded p-2 text-sm text-gray-700 bg-white outline-none"><option>Not Started</option><option>In Progress</option><option>Completed</option><option>Deferred</option></select>
                      <input type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="w-full border border-blue-300 rounded p-2 text-sm text-gray-700 bg-white outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-3 pt-2">
                    <i className="fa-regular fa-circle-question text-gray-400 text-lg"></i>
                    <button className="px-4 py-1.5 border border-blue-300 text-blue-500 rounded text-sm font-medium hover:bg-blue-50" onClick={handleAddTask}>Save</button>
                    <button className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded text-sm font-medium hover:bg-gray-50" onClick={() => { setTaskTitle(''); setTaskDetails(''); }}>Clear</button>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    {leadActivities.filter(a => a.type === ActivityType.TASK).map((task) => (
                      <div key={task.id} className="border border-gray-200 rounded shadow-sm p-4 mb-4">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium text-gray-800">{task.subject}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500"><i className="fa-solid fa-gem text-yellow-400 text-[10px]"></i> Normal Priority</div>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.completed ? 'bg-green-400 text-white' : 'bg-yellow-400 text-white'}`}>{task.completed ? 'Completed' : 'In Progress'}</span>
                          <div className="text-xs text-gray-500 flex items-center gap-1"><i className="fa-regular fa-clock"></i> {formatDate(task.createdAt)}{task.dueDate && new Date(task.dueDate) < new Date() && !task.completed && <span className="text-red-500 font-medium ml-1">OVERDUE</span>}</div>
                        </div>
                        <div className="text-sm text-gray-700 mb-3">{task.description || ''}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 border-t border-gray-100 pt-2 mb-3">
                          <i className="fa-regular fa-user-circle"></i> {task.assignedTo || 'Unassigned'} <span className="text-gray-300">&bull;</span> <i className="fa-regular fa-calendar"></i> {timeAgo(task.createdAt)}
                        </div>
                        <div className="flex border-t border-gray-200 divide-x divide-gray-200 text-xs text-gray-500">
                          <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-gray-50 text-blue-500" onClick={() => toast.info('Edit Task Clicked')}><i className="fa-regular fa-pen-to-square"></i> Edit</button>
                          <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-gray-50" onClick={() => toast.info('Task Completed!')}><i className="fa-solid fa-check"></i> Complete</button>
                          <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-gray-50 text-blue-500" onClick={() => toast.info('Push Task Clicked')}><i className="fa-solid fa-arrow-right-from-bracket"></i> Push</button>
                          <button className="flex-1 py-2 flex items-center justify-center gap-1 hover:bg-gray-50" onClick={() => handleDeleteActivity(task.id)}><i className="fa-regular fa-trash-can"></i> Delete</button>
                        </div>
                      </div>
                    ))}
                    {leadActivities.filter(a => a.type === ActivityType.TASK).length > 0 && (
                      <div className="flex justify-end gap-2 mt-3">
                        <button className="px-3 py-1 bg-blue-300 text-white rounded text-xs font-medium cursor-not-allowed">Previous</button>
                        <button className="px-3 py-1 bg-blue-300 text-white rounded text-xs font-medium cursor-not-allowed">Next</button>
                      </div>
                    )}
                    <div className="text-center mt-4">
                      <button className="border border-blue-500 text-blue-500 rounded px-4 py-1 text-xs font-medium hover:bg-blue-50" onClick={() => toast.info('Show completed tasks')}>Show completed</button>
                    </div>
                  </div>
                </div>
              )}

              {/* EMAILS TAB */}
              {activeTab === 'emails' && (
                <div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
                    <div className="flex gap-6 text-sm">
                      <span className="text-blue-600 font-medium border-b-2 border-blue-600 pb-3 -mb-3.5 cursor-pointer">Outgoing ({emailCount})</span>
                      <span className="text-gray-500 cursor-pointer hover:text-gray-800">Incoming (0)</span>
                    </div>
                    <button className="border border-blue-500 text-blue-500 rounded px-3 py-1 text-sm font-medium hover:bg-blue-50" onClick={() => toast.info('Compose Email Clicked')}><i className="fa-solid fa-plus mr-1"></i> Compose</button>
                  </div>
                  <div className="space-y-4">
                    {leadActivities.filter(a => a.type === ActivityType.EMAIL).map((email) => (
                      <div key={email.id} className="flex gap-3 border-b border-gray-100 pb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0">{lead.firstName?.charAt(0)?.toUpperCase() || '?'}{lead.lastName?.charAt(0)?.toUpperCase() || ''}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-800"><i className="fa-regular fa-envelope text-blue-500"></i> {email.subject}</div>
                          <div className="text-xs text-gray-500 mb-1">To: {lead.email}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium block mb-1 ${email.completed ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>{email.completed ? `Delivered (${timeAgo(email.createdAt)})` : 'Draft'}</span>
                          <span className="text-xs text-gray-500 block">{formatDate(email.createdAt)} <i className="fa-solid fa-reply-all text-gray-400 ml-1 text-[10px]" onClick={() => toast.info('Reply All Clicked')}></i></span>
                        </div>
                      </div>
                    ))}
                    {emailCount === 0 && <div className="text-center text-gray-400 text-sm py-8">No email history.</div>}
                  </div>
                  <div className="text-right mt-4">
                    <button className="border border-blue-500 text-blue-500 rounded px-4 py-1 text-sm font-medium hover:bg-blue-50" onClick={() => toast.info('Show 3 months history')}>Show three months</button>
                  </div>
                </div>
              )}

              {/* SMS TAB */}
              {activeTab === 'sms' && (
                <div>
                  <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-4 text-sm">
                    <span className="text-gray-600">Receive SMS</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-500 left-5" />
                      <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-500 cursor-pointer"></label>
                    </div>
                    <span className="text-blue-500 font-medium text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">YES</span>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    <div className="flex flex-col items-end mb-4">
                      <div className="flex items-center gap-1 text-[10px] text-green-600 mb-1"><i className="fa-solid fa-check"></i> Delivered</div>
                      <div className="bg-blue-100 rounded-xl rounded-tr-none p-3 max-w-[90%] text-sm text-gray-700 relative">
                        Hi {lead.firstName}! An automatic listing alert has already been created on your behalf, and I just want to make sure I'm sending you the correct listings on search.realestatewithiqbal.com. Are you only looking for Condo Apartment properties in Brampton? Also, what would be your ideal price range? - Naeem
                        <div className="text-[10px] text-gray-500 text-right mt-1">{formatDateShort(lead.createdAt)}</div>
                      </div>
                      <i className="fa-regular fa-circle-info text-blue-400 absolute right-0 top-2"></i>
                    </div>
                    <div className="text-center text-xs text-gray-400 my-4">Yesterday</div>
                    <div className="flex flex-col items-end mb-4 relative">
                      <div className="flex items-center gap-1 text-[10px] text-green-600 mb-1"><i className="fa-solid fa-check"></i> Delivered</div>
                      <div className="bg-blue-100 rounded-xl rounded-tr-none p-3 max-w-[90%] text-sm text-gray-700">
                        Hello {lead.firstName}, this is Asad calling on behalf of Naeem Iqbal Realtor. I'm just following up on your recent real estate inquiry. Whether you're looking for your dream home, an investment property, or simply exploring your options, we're here to help. Please give me a call back when it's convenient for you. I look forward to speaking with you. Have a great day!
                        <div className="text-[10px] text-gray-500 text-right mt-1">Yesterday, 3:50 AM</div>
                      </div>
                      <i className="fa-regular fa-circle-info text-blue-400 absolute right-0 top-2"></i>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-4 text-xs text-gray-600">
                    You cannot send SMS messages since you did not set up your Twilio account. To set up a Twilio account please click <a href="#" className="text-blue-500 hover:underline" onClick={() => toast.info('Twilio Setup Redirect')}>here</a>.
                  </div>
                </div>
              )}

              {/* E-CAMPAIGNS TAB */}
              {activeTab === 'ecampaigns' && (
                <div>
                  <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-4">
                    <select className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-white w-64 outline-none"><option>Select Campaign</option></select>
                    <button className="border border-blue-500 text-blue-500 rounded px-4 py-1.5 text-sm font-medium flex items-center gap-1 hover:bg-blue-50" onClick={() => toast.info('Assign Campaign Clicked')}><i className="fa-regular fa-circle-plus text-lg"></i> Assign</button>
                  </div>
                  <div className="flex justify-end gap-4 text-sm mb-4 text-gray-500">
                    <span className="flex items-center gap-1 text-red-500 cursor-pointer" onClick={() => toast.info('Stop Campaign')}><i className="fa-solid fa-xmark"></i> Stop</span>
                    <span className="flex items-center gap-1 text-yellow-500 cursor-pointer" onClick={() => toast.info('Listing Exception Click')}><i className="fa-solid fa-ban"></i> Listing Exception</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <tr>
                        <th className="pb-2 w-8"><input type="checkbox" className="rounded border-gray-300" /></th>
                        <th className="pb-2 text-left font-medium">Campaign Name</th>
                        <th className="pb-2 text-left font-medium">Status</th>
                        <th className="pb-2 text-left font-medium">Date Assigned</th>
                        <th className="pb-2 text-left font-medium">Progress</th>
                        <th className="pb-2 text-left font-medium">Assigned By</th>
                        <th className="pb-2 text-center font-medium">Stop</th>
                        <th className="pb-2 text-center font-medium">Start</th>
                        <th className="pb-2 text-center font-medium">Force</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
                        <td className="py-3 font-medium text-gray-800">Auto Assigned Ne...</td>
                        <td className="py-3 text-blue-600 flex items-center gap-1"><i className="fa-solid fa-link"></i> In Progress</td>
                        <td className="py-3 text-gray-600">07/26/2026</td>
                        <td className="py-3 flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> 10% (3/28)</td>
                        <td className="py-3 text-gray-600">Naeem Iqbal</td>
                        <td className="py-3 text-center text-blue-500 cursor-pointer" onClick={() => toast.info('Stop Campaign Action')}><i className="fa-solid fa-xmark"></i></td>
                        <td className="py-3 text-center text-blue-500 cursor-pointer" onClick={() => toast.info('Start Campaign Action')}><i className="fa-solid fa-check"></i></td>
                        <td className="py-3 text-center text-blue-500 cursor-pointer" onClick={() => toast.info('Force Campaign Action')}><i className="fa-solid fa-rotate-right"></i></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* SOLD DETAILS TAB */}
              {activeTab === 'sold' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button className="border border-blue-500 text-blue-500 rounded px-4 py-1 text-sm font-medium hover:bg-blue-50" onClick={() => toast.info('Add a Sale clicked')}><i className="fa-solid fa-plus mr-1"></i> Add a Sale</button>
                  </div>
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="pb-3 font-medium">Agent Role</th>
                        <th className="pb-3 font-medium">Closing Date</th>
                        <th className="pb-3 font-medium">MLS Number</th>
                        <th className="pb-3 font-medium">Selling Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-xs">No sales recorded yet.</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

            </div>

            {/* Data Tabs & Map */}
            <div className="grid grid-cols-12 gap-4 pb-2">

              {/* Left: Data Tabs */}
              <div className="col-span-7 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex border-b border-gray-200">
                  <div className={`px-4 py-2.5 text-xs font-medium cursor-pointer ${infoTab === 'lead_data' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => switchInfoTab('lead_data')}>Lead Data</div>
                  <div className={`px-4 py-2.5 text-xs font-medium cursor-pointer ${infoTab === 'more_details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => switchInfoTab('more_details')}>More Details</div>
                  <div className={`px-4 py-2.5 text-xs font-medium cursor-pointer ${infoTab === 'buyer_info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => switchInfoTab('buyer_info')}>Buyer Info</div>
                  <div className={`px-4 py-2.5 text-xs font-medium cursor-pointer ${infoTab === 'seller_info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => switchInfoTab('seller_info')}>Seller Info</div>
                  <div className={`px-4 py-2.5 text-xs font-medium cursor-pointer ${infoTab === 'custom_fields' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'}`} onClick={() => switchInfoTab('custom_fields')}>Custom Fields</div>
                </div>

                {infoTab === 'lead_data' && (
                  <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <div className="text-gray-500 mb-0.5">Status:</div>
                      <select value={lead.status ?? 'new'} onChange={(e) => handleStatusChange(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none">
                        <option value="new">New Lead</option>
                        <option value="contacted">Tried to contact</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Lead Rating:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Ref. source:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none"><option>{source ? source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Google'}</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Source:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none"><option>{source ? `AL-${source.replace(/_/g, '-').replace(/\b\w/g, c => c.toUpperCase())}` : 'Not selected'}</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">House to sell:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none"><option>Unknown</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Lead type:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none"><option>Home Buyer</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Buying in:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Selling in:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Mortgage type:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Owns/Rents:</div>
                      <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none"><option>Not selected</option></select>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Work phone:</div>
                      <input type="text" className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none" placeholder="Work phone" />
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Home phone:</div>
                      <input type="text" className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none" placeholder="Home phone" />
                    </div>
                  </div>
                )}

                {infoTab !== 'lead_data' && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    {infoTab === 'more_details' && 'More Details section'}
                    {infoTab === 'buyer_info' && 'Buyer Info section'}
                    {infoTab === 'seller_info' && 'Seller Info section'}
                    {infoTab === 'custom_fields' && 'Custom Fields section'}
                  </div>
                )}
              </div>

              {/* Right: Map */}
              <div className="col-span-5 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative flex flex-col">
                <div className="text-[10px] text-gray-500 text-right p-2 pb-0 absolute top-0 right-0 z-10 bg-white/80 rounded-bl">IP Address: —</div>
                <div className="flex-1 map-placeholder min-h-[280px] relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <i className="fa-solid fa-location-dot text-blue-500 text-3xl drop-shadow-md"></i>
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-500 bg-white/80 px-2 py-0.5 rounded border border-gray-200">
                    Leaflet | &copy; OpenStreetMap contributors
                  </div>
                </div>
              </div>
            </div>

            {/* Agents & Delete Area */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-7 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="font-medium text-gray-800 text-sm mb-3">Agents</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-b border-gray-100 pb-4 mb-0">
                  <div>
                    <div className="text-gray-500 mb-0.5">Main agent:</div>
                    <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 outline-none"><option>{lead.assignedTo || 'Unassigned'}</option></select>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">List Agent:</div>
                    <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none"><option>Not selected</option></select>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">Mort. agent:</div>
                    <select className="w-full border border-gray-200 rounded px-2 py-1 bg-white text-gray-500 outline-none"><option>Not selected</option></select>
                  </div>
                </div>
              </div>
              <div className="col-span-5 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-end justify-end">
                <button className="border border-red-300 text-red-500 rounded px-4 py-1.5 text-xs font-medium hover:bg-red-50 transition" onClick={handleDeleteLead}>Delete</button>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-gray-500 pb-2">
          &copy; 2026 - BizTrack | <a href="#" className="text-blue-500 hover:underline">Terms of Service</a> | <a href="#" className="text-blue-500 hover:underline">Privacy Policy</a>
        </div>
      </div>

      {/* Floating Help Button */}
      <button className="fixed bottom-6 right-6 bg-blue-500 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 transition text-lg z-50">
        <i className="fa-regular fa-circle-question"></i>
      </button>
    </DashboardLayout>
  );
}
