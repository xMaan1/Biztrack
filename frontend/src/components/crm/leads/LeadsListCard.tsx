import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { ChevronDown, Phone, Mail, MoreHorizontal, Flag } from 'lucide-react';
import { Lead } from '@/src/models/crm';

type LeadsListCardProps = {
  leads: Lead[];
  totalCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  listLoading?: boolean;
  selectedIds: Set<string>;
  onSelectLead: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onPageChange: (page: number) => void;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onAssign?: (lead: Lead) => void;
};

function leadSourceLabel(lead: Lead): string {
  const raw = (lead.leadSource ?? lead.source) ?? '';
  if (!raw) return '—';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayEmail(email?: string | null): string {
  if (!email) return '—';
  if (email.endsWith('@noemail.crm')) return '—';
  return email;
}

function priorityBadge(priority?: string): { color: string; label: string } {
  switch (priority ?? 'medium') {
    case 'urgent': return { color: 'bg-blue-500 text-white', label: 'New Lead' };
    case 'high': return { color: 'bg-purple-500 text-white', label: '2nd Priority' };
    case 'low': return { color: 'bg-sky-400 text-white', label: '3rd Priority' };
    default: return { color: 'bg-green-500 text-white', label: 'Medium' };
  }
}

function statusBadgeColor(status: string): string {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-700';
    case 'contacted': return 'bg-yellow-100 text-yellow-700';
    case 'qualified': return 'bg-purple-100 text-purple-700';
    case 'proposal': return 'bg-indigo-100 text-indigo-700';
    case 'won': return 'bg-emerald-100 text-emerald-700';
    case 'lost': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function formatTimeline(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const now = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ` at ${time}`;
}

function formatPrice(price?: number): string {
  if (!price || price <= 0) return '—';
  return `$${price.toLocaleString()}`;
}

function getInitials(assignedTo?: string): string {
  if (!assignedTo) return '—';
  const parts = assignedTo.split(' ');
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : assignedTo.slice(0, 2).toUpperCase();
}

export function LeadsListCard({
  leads,
  totalCount,
  page,
  totalPages,
  pageSize,
  listLoading = false,
  selectedIds,
  onSelectLead,
  onSelectAll,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onAssign,
}: LeadsListCardProps) {
  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  const visiblePages: number[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) visiblePages.push(i);
  } else {
    visiblePages.push(1);
    if (page > 3) visiblePages.push(-1);
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      visiblePages.push(i);
    }
    if (page < totalPages - 2) visiblePages.push(-1);
    visiblePages.push(totalPages);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className={`relative ${listLoading ? 'opacity-60 pointer-events-none' : ''}`}>
        {listLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="w-10 px-3 py-4 text-left">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => onSelectAll(!!checked)}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Info</th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Pipeline / Status / Type <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Reg / Source <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Price / City <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Timeline <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Activity <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Last Contact <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">Tasks <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Assigned <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="w-10 px-3 py-4" />
              </tr>
            </thead>
            <tbody>
              {!listLoading && leads.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-gray-400 py-16 text-sm">
                    No leads found
                  </td>
                </tr>
              )}
              {leads.map((lead) => {
                const isSelected = selectedIds.has(lead.id);
                const pBadge = priorityBadge(lead.priority);
                return (
                  <tr
                    key={lead.id}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onView(lead)}
                  >
                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectLead(lead.id, !!checked)}
                        aria-label={`Select ${lead.firstName} ${lead.lastName}`}
                      />
                    </td>

                    {/* INFO */}
                    <td className="px-3 py-4">
                      <div className="min-w-[180px]">
                        <div className="font-semibold text-sm text-gray-900 leading-tight">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className="text-[12px] text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                            {lead.phone?.trim() || '—'}
                          </span>
                          <span className="text-[12px] text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0 text-gray-400" />
                            {displayEmail(lead.email)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* PIPELINE / STATUS / TYPE */}
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1.5 min-w-[130px]">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-block w-fit ${pBadge.color}`}>
                          {pBadge.label}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full inline-block w-fit ${statusBadgeColor(lead.status ?? 'new')}`}>
                          {(lead.status ?? 'new').charAt(0).toUpperCase() + (lead.status ?? 'new').slice(1)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {lead.jobTitle || lead.company || '—'}
                        </span>
                      </div>
                    </td>

                    {/* REG / SOURCE */}
                    <td className="px-3 py-4">
                      <div className="min-w-[140px]">
                        <div className="text-[12px] text-gray-700 font-medium">
                          {formatDateTime(lead.createdAt)}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {lead.company ? (
                            <span className="text-blue-500">{lead.company}</span>
                          ) : (
                            leadSourceLabel(lead)
                          )}
                        </div>
                      </div>
                    </td>

                    {/* PRICE / CITY */}
                    <td className="px-3 py-4">
                      <div className="text-[12px] text-gray-700 space-y-0.5 min-w-[110px]">
                        <div><span className="text-gray-400">Min:</span> {lead.budget ? formatPrice(lead.budget) : '—'}</div>
                        <div><span className="text-gray-400">Max:</span> —</div>
                        <div><span className="text-gray-400">Buy:</span> —</div>
                        <div><span className="text-gray-400">Sell:</span> —</div>
                      </div>
                    </td>

                    {/* TIMELINE */}
                    <td className="px-3 py-4">
                      <div className="text-[12px] text-gray-700 min-w-[80px]">
                        {lead.timeline || 'N/A'}
                      </div>
                    </td>

                    {/* ACTIVITY */}
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3 text-[12px] text-gray-500 min-w-[80px]">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> 0</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> 0</span>
                      </div>
                    </td>

                    {/* LAST CONTACT */}
                    <td className="px-3 py-4">
                      <div className="flex flex-col text-[12px] text-gray-500 min-w-[100px]">
                        {lead.lastContactDate ? (
                          <>
                            <span>Calls: 0</span>
                            <span>Mails: 0</span>
                            <span>Chat: 0</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">{formatTimeline(lead.lastContactDate)}</span>
                          </>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                    </td>

                    {/* TASKS */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
                          <Flag className="w-3.5 h-3.5" />
                        </Button>
                        <Checkbox aria-label="Task complete" />
                      </div>
                    </td>

                    {/* ASSIGNED */}
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2 min-w-[120px]" onClick={(e) => e.stopPropagation()}>
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-semibold text-blue-600 shrink-0">
                          {getInitials(lead.assignedTo)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] font-medium text-gray-700">
                            {lead.assignedTo || 'Unassigned'}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-4 p-0 text-[10px] text-gray-400 hover:text-gray-600 gap-0.5">
                                Change <ChevronDown className="w-2.5 h-2.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-40">
                              <DropdownMenuItem onClick={() => onAssign?.(lead)}>
                                Assign to someone
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </td>

                    {/* MORE */}
                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => onView(lead)}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(lead)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(lead.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <p className="text-[12px] text-gray-500">
          Showing {startRecord}–{endRecord} of {totalCount}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[12px] text-gray-500 hover:text-gray-700"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || listLoading}
            >
              &lt; PREV
            </Button>
            {visiblePages.map((p, i) =>
              p === -1 ? (
                <span key={`ellipsis-${i}`} className="px-1 text-gray-300 text-[12px]">…</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-7 min-w-[28px] px-1 text-[12px] ${
                    p === page ? 'bg-blue-500 text-white hover:bg-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => onPageChange(p)}
                  disabled={listLoading}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[12px] text-gray-500 hover:text-gray-700"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || listLoading}
            >
              NEXT &gt;
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
