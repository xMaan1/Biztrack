import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { Trash2, MoreHorizontal, Flag, ChevronDown, Phone, Mail, MessageSquare } from 'lucide-react';
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
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayEmail(email?: string | null): string {
  if (!email) return '—';
  if (email.endsWith('@noemail.crm')) return '—';
  return email;
}

function priorityConfig(priority?: string): { color: string; label: string } {
  switch (priority ?? 'medium') {
    case 'urgent': return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'URGENT' };
    case 'high': return { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', label: 'HIGH' };
    case 'low': return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'LOW' };
    default: return { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'MEDIUM' };
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'new': return 'bg-blue-500';
    case 'contacted': return 'bg-yellow-500';
    case 'qualified': return 'bg-purple-500';
    case 'proposal': return 'bg-indigo-500';
    case 'won': return 'bg-emerald-500';
    case 'lost': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return '—';
  const now = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
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

  return (
    <div className="space-y-4">
      <div className={`relative ${listLoading ? 'opacity-60 pointer-events-none' : ''}`}>
        {listLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => onSelectAll(!!checked)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-14" />
                <TableHead>INFO</TableHead>
                <TableHead className="w-[180px]">STATUS</TableHead>
                <TableHead className="w-[150px]">SOURCE</TableHead>
                <TableHead className="w-[100px]">PRICE</TableHead>
                <TableHead className="w-[90px]">TIMELINE</TableHead>
                <TableHead className="w-[120px]">ACTIVITY</TableHead>
                <TableHead className="w-[140px]">LAST CONTACT</TableHead>
                <TableHead className="w-[80px]">TASKS</TableHead>
                <TableHead className="w-[130px]">ASSIGNED</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!listLoading && leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                    No leads found
                  </TableCell>
                </TableRow>
              )}
              {leads.map((lead) => {
                const { color: priorityColor, label: priorityLabel } = priorityConfig(lead.priority);
                const isSelected = selectedIds.has(lead.id);
                return (
                  <TableRow
                    key={lead.id}
                    className={`cursor-pointer hover:bg-muted/30 ${isSelected ? 'bg-muted/20' : ''}`}
                    onClick={() => onView(lead)}
                  >
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectLead(lead.id, !!checked)}
                        aria-label={`Select ${lead.firstName} ${lead.lastName}`}
                      />
                    </TableCell>
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(lead.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col gap-1 min-w-[180px]">
                        <span className="font-semibold text-sm leading-tight">
                          {lead.firstName} {lead.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {lead.phone?.trim() || '—'} • {displayEmail(lead.email)}
                        </span>
                        {lead.tags && lead.tags.length > 0 && lead.tags[0] !== '' && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {lead.tags.filter(Boolean).slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block w-fit ${priorityColor}`}>
                          {priorityLabel}
                        </span>
                        <Badge className={`text-white text-[10px] px-2 py-0 h-5 ${statusColor(lead.status ?? 'new')}`}>
                          {(lead.status ?? 'new').charAt(0).toUpperCase() + (lead.status ?? 'new').slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col gap-1 text-xs">
                        <Badge variant="outline" className="font-normal text-[10px] px-1.5 py-0 w-fit">
                          {leadSourceLabel(lead)}
                        </Badge>
                        {lead.company && (
                          <span className="text-muted-foreground">{lead.company}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-sm font-medium">
                      {lead.budget && lead.budget > 0
                        ? `$${lead.budget.toLocaleString()}`
                        : '—'}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <span>{relativeTime(lead.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />0</span>
                        <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" />0</span>
                        <span className="flex items-center gap-0.5"><MessageSquare className="w-3 h-3" />0</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {lead.lastContactDate ? (
                          <>
                            <span>Calls: 0 | Emails: 0</span>
                            <span>SMS: 0</span>
                            <span className="text-[10px] text-muted-foreground/60">
                              {relativeTime(lead.lastContactDate)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); }}>
                          <Flag className="w-3.5 h-3.5" />
                        </Button>
                        <Checkbox
                          aria-label="Task complete"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {lead.assignedTo
                            ? (() => {
                                const name = lead.assignedTo;
                                const parts = name.split(' ');
                                return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
                              })()
                            : '—'}
                        </div>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">{lead.assignedTo || 'Unassigned'}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" className="h-4 p-0 text-[10px] text-muted-foreground hover:text-foreground gap-0.5">
                                Change <ChevronDown className="w-3 h-3" />
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
                    </TableCell>
                    <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => onView(lead)}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(lead)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(lead.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startRecord}-{endRecord} of {totalCount} leads
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || listLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || listLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
