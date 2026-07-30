import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { ChevronDown, Phone, Mail, MoreHorizontal, Flag } from 'lucide-react';
import { Contact, Company } from '@/src/models/crm';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import {
  contactTypeDisplayLabel,
  contactAddressCountriesDisplay,
} from './contactUtils';

type ContactsListCardProps = {
  contacts: Contact[];
  companies: Company[];
  totalCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  listLoading?: boolean;
  selectedIds: Set<string>;
  onSelectContact: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onPageChange: (page: number) => void;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
};

function primaryEmail(contact: Contact): string {
  const ev = (contact.emails || []).filter((e) => e.value.trim());
  if (ev.length > 0) return ev.map((e) => e.value).join(', ');
  return contact.email?.trim() || '';
}

function primaryPhone(contact: Contact): string {
  const pv = (contact.phones || []).filter((p) => p.value.trim());
  if (pv.length > 0) return pv[0].value;
  return contact.phone?.trim() || contact.mobile?.trim() || '';
}

function typeBadge(contactType?: string): { color: string; label: string } {
  switch (contactType) {
    case 'customer': return { color: 'bg-blue-500 text-white', label: 'Customer' };
    case 'lead': return { color: 'bg-purple-500 text-white', label: 'Lead' };
    case 'partner': return { color: 'bg-sky-400 text-white', label: 'Partner' };
    case 'vendor': return { color: 'bg-orange-500 text-white', label: 'Vendor' };
    default: return { color: 'bg-green-500 text-white', label: 'Other' };
  }
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

export function ContactsListCard({
  contacts,
  companies,
  totalCount,
  page,
  totalPages,
  pageSize,
  listLoading = false,
  selectedIds,
  onSelectContact,
  onSelectAll,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: ContactsListCardProps) {
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));
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
                  <div className="flex items-center gap-1">Type / Status / Company <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Created / Source <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Client Value <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Deal Closed <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Remaining <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Lifetime Value <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center gap-1">Country <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="px-3 py-4 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">Added By <ChevronDown className="w-3 h-3" /></div>
                </th>
                <th className="w-10 px-3 py-4" />
              </tr>
            </thead>
            <tbody>
              {!listLoading && contacts.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-gray-400 py-16 text-sm">
                    No contacts found
                  </td>
                </tr>
              )}
              {contacts.map((contact) => {
                const isSelected = selectedIds.has(contact.id);
                const tBadge = typeBadge(contact.contactType);
                const co = contact.companyId
                  ? companies.find((c) => c.id === contact.companyId)
                  : undefined;
                return (
                  <tr
                    key={contact.id}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onView(contact)}
                  >
                    <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectContact(contact.id, !!checked)}
                        aria-label={`Select ${contact.firstName} ${contact.lastName}`}
                      />
                    </td>

                    {/* INFO */}
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        {contact.image_url ? (
                          <img src={contact.image_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-semibold text-blue-600 shrink-0">
                            {contact.firstName?.charAt(0)?.toUpperCase() || '?'}{contact.lastName?.charAt(0)?.toUpperCase() || ''}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm text-gray-900 leading-tight">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-[12px] text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                              {primaryPhone(contact) || '—'}
                            </span>
                            <span className="text-[12px] text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 shrink-0 text-gray-400" />
                              {primaryEmail(contact) || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* TYPE / STATUS / COMPANY */}
                    <td className="px-3 py-4">
                      <div className="flex flex-col gap-1.5 min-w-[130px]">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-block w-fit ${tBadge.color}`}>
                          {tBadge.label}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full inline-block w-fit ${contact.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                          {contact.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {co?.name || contact.jobTitle || '—'}
                        </span>
                      </div>
                    </td>

                    {/* CREATED / SOURCE */}
                    <td className="px-3 py-4">
                      <div className="min-w-[140px]">
                        <div className="text-[12px] text-gray-700 font-medium">
                          {formatDateTime(contact.createdAt)}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {co?.name || 'Direct'}
                        </div>
                      </div>
                    </td>

                    {/* CLIENT VALUE */}
                    <td className="px-3 py-4">
                      <div className="text-[12px] text-gray-700 font-medium min-w-[90px]">
                        {formatPrice(contact.clientValue)}
                      </div>
                    </td>

                    {/* DEAL CLOSED */}
                    <td className="px-3 py-4">
                      <div className="text-[12px] text-gray-700 font-medium min-w-[90px]">
                        {formatPrice(contact.dealClosedValue)}
                      </div>
                    </td>

                    {/* REMAINING */}
                    <td className="px-3 py-4">
                      <div className="text-[12px] text-gray-700 font-medium min-w-[90px]">
                        {formatPrice(contact.remainingPayable)}
                      </div>
                    </td>

                    {/* LIFETIME VALUE */}
                    <td className="px-3 py-4">
                      <div className="text-[12px] text-gray-700 font-medium min-w-[90px]">
                        {formatPrice(contact.lifetimeValue)}
                      </div>
                    </td>

                    {/* COUNTRY */}
                    <td className="px-3 py-4 text-center">
                      <div className="text-[12px] text-gray-500 min-w-[80px]">
                        {contactAddressCountriesDisplay(contact) || '—'}
                      </div>
                    </td>

                    {/* ADDED BY */}
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2 min-w-[100px]" onClick={(e) => e.stopPropagation()}>
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-semibold text-blue-600 shrink-0">
                          {getInitials(contact.createdBy)}
                        </div>
                        <span className="text-[12px] font-medium text-gray-700">
                          {contact.createdBy || 'System'}
                        </span>
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
                          <DropdownMenuItem onClick={() => onView(contact)}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(contact)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => onDelete(contact.id)}>
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