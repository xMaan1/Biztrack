'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  CreditCard,
  Wallet,
  User,
  Building2,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Fingerprint,
  Tags,
  Users,
  FileText,
  Paperclip,
} from 'lucide-react';
import { CustomerService, Customer, CustomerUpdate, Guarantor, CustomerAttachment } from '@/src/services/CRMService';
import crmService from '@/src/services/CRMService';
import fileUploadService from '@/src/services/FileUploadService';
import { getCustomerDisplayName } from '@/src/utils/customerUtils';
import { toast } from 'sonner';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function primaryEmail(customer: Customer): string {
  const ev = (customer.emails || []).filter((e) => e.value.trim());
  if (ev.length > 0) return ev.map((e) => e.value).join(', ');
  return customer.email?.trim() || '';
}

function primaryPhone(customer: Customer): string {
  const pv = (customer.phones || []).filter((p) => p.value.trim());
  if (pv.length > 0) return pv.map((p) => p.value).join(', ');
  return customer.phone?.trim() || customer.mobile?.trim() || '';
}

export default function CustomerDetailPage() {
  return (
    <ModuleGuard module="crm" fallback={<div>You don't have access to CRM module</div>}>
      <CustomerDetailContent />
    </ModuleGuard>
  );
}

function CustomerDetailContent() {
  const params = useParams();
  const router = useRouter();
  const customerId = typeof params.id === 'string' ? params.id : '';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState<CustomerUpdate>({});
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) { router.replace('/crm/customers'); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await CustomerService.getCustomerById(customerId);
      setCustomer(data);
      try {
        const gs = await crmService.getGuarantors(customerId);
        setGuarantors(gs || []);
      } catch { setGuarantors([]); }
    } catch (err) {
      setError('Failed to load customer. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  const openEditDialog = () => {
    if (!customer) return;
    setEditForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      mobile: customer.mobile,
      cnic: customer.cnic,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      postalCode: customer.postalCode,
      customerType: customer.customerType,
      customerStatus: customer.customerStatus,
      creditLimit: customer.creditLimit,
      currentBalance: customer.currentBalance,
      paymentTerms: customer.paymentTerms,
      notes: customer.notes,
      description: customer.description,
    });
    setIsEditOpen(true);
  };

  const handleUpdateCustomer = async () => {
    if (!customer) return;
    try {
      await CustomerService.updateCustomer(customer.id, editForm);
      toast.success('Customer updated!');
      setIsEditOpen(false);
      fetchCustomer();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update customer.');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    try {
      await CustomerService.deleteCustomer(customer.id);
      toast.success('Customer deleted.');
      router.push('/crm/customers');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete customer.');
    }
  };

  const handleAttachmentFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!customer) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachmentUploading(true);
    try {
      const res = await fileUploadService.uploadDocument(file);
      const newAtt: CustomerAttachment = {
        url: res.file_url,
        original_filename: res.original_filename || res.filename,
        s3_key: res.s3_key,
      };
      const updatedAttachments = [...(customer.attachments || []), newAtt];
      await CustomerService.updateCustomer(customer.id, { attachments: updatedAttachments });
      const updated = await CustomerService.getCustomerById(customer.id);
      setCustomer(updated);
      toast.success('Attachment added!');
    } catch (err: any) {
      toast.error(`Upload failed: ${err?.message || 'server error'} (file: ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB)`);
    } finally {
      setAttachmentUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (index: number) => {
    if (!customer) return;
    const list = customer.attachments || [];
    const att = list[index];
    if (!att) return;
    if (!window.confirm(`Delete attachment "${att.original_filename || 'Untitled'}"?`)) return;
    if (att.s3_key) {
      try { await fileUploadService.deleteFile(att.s3_key); } catch {}
    }
    const updatedAttachments = list.filter((_, i) => i !== index);
    await CustomerService.updateCustomer(customer.id, { attachments: updatedAttachments });
    const updated = await CustomerService.getCustomerById(customer.id);
    setCustomer(updated);
    toast.success('Attachment removed.');
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

  if (error || !customer) {
    return (
      <DashboardLayout>
        <div className="flex-1 overflow-y-auto p-4 bg-[#e5e7eb] flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <p className="text-red-500 mb-4">{error || 'Customer not found'}</p>
            <Button onClick={() => router.push('/crm/customers')}>Back to Customers</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      blocked: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { color: string; icon: any }> = {
      individual: { color: 'bg-blue-100 text-blue-800', icon: User },
      business: { color: 'bg-purple-100 text-purple-800', icon: Building2 },
    };
    const config = typeConfig[type] || typeConfig.individual;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {type}
      </Badge>
    );
  };

  const fullName = getCustomerDisplayName(customer);

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5e7eb] font-['Inter',sans-serif]">
        <div className="max-w-[1400px] mx-auto">

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/crm/customers')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
                {getTypeBadge(customer.customerType)}
                {getStatusBadge(customer.customerStatus)}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">
                {customer.customerId} · Created {formatDate(customer.createdAt)}
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

              {/* Customer Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  {customer.image_url ? (
                    <img src={customer.image_url} alt="Profile" className="w-14 h-14 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-semibold text-blue-600 shrink-0">
                      {customer.firstName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">{fullName}</div>
                    <div className="text-xs text-gray-500">{customer.customerId}</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700"><Phone className="w-3.5 h-3.5 text-green-500" /> Phone</div>
                    <span className="text-gray-900 font-medium">{primaryPhone(customer) || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700"><Mail className="w-3.5 h-3.5 text-green-500" /> Email</div>
                    <span className="text-gray-900 font-medium truncate max-w-[55%]">{primaryEmail(customer) || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700"><Fingerprint className="w-3.5 h-3.5 text-blue-500" /> CNIC</div>
                    <span className="text-gray-900 font-medium">{customer.cnic || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2 text-gray-700"><MapPin className="w-3.5 h-3.5 text-red-400" /> Address</div>
                    <span className="text-gray-900 font-medium text-right max-w-[55%]">
                      {[customer.address, customer.city, customer.state].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>
                </div>
                {customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    {customer.tags.map((tag, i) => (
                      <span key={i} className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                        <Tags className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Financial Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Credit Limit</div>
                  <div className="text-lg font-bold text-gray-900">Rs. {customer.creditLimit.toLocaleString()}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Payment: {customer.paymentTerms}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> Current Balance</div>
                  <div className={`text-lg font-bold ${customer.currentBalance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    Rs. {customer.currentBalance.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">{customer.currentBalance > 0 ? 'Outstanding' : 'Clear'}</div>
                </div>
              </div>

              {/* Attachments */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-medium text-gray-800 text-sm flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> Attachments ({(customer.attachments || []).length})
                  </div>
                  <div className="flex gap-1">
                    <input
                      ref={attachmentFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt"
                      className="hidden"
                      onChange={handleAttachmentFile}
                    />
                    <button
                      className="text-blue-500 border border-blue-500 rounded px-2 py-1 text-xs font-medium hover:bg-blue-50 transition disabled:opacity-50"
                      onClick={() => attachmentFileInputRef.current?.click()}
                      disabled={attachmentUploading}
                    >
                      <i className="fa-solid fa-upload mr-1"></i>
                      {attachmentUploading ? 'Uploading…' : 'Upload'}
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-2">
                  {(customer.attachments || []).length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-4">No attachments yet.</div>
                  ) : (
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {(customer.attachments || []).map((att: CustomerAttachment, idx) => (
                        <div key={`${att.url}-${idx}`} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-gray-50 text-xs">
                          <span className="truncate flex-1 text-gray-700" title={att.original_filename || att.url}>
                            <FileText className="w-3 h-3 inline mr-1.5 text-blue-400" />
                            {att.original_filename || 'Untitled'}
                          </span>
                          <div className="flex gap-1 shrink-0">
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 p-0.5" title="View"><i className="fa-regular fa-eye text-[11px]"></i></a>
                            <button className="text-red-400 hover:text-red-600 p-0.5" title="Delete" onClick={() => handleDeleteAttachment(idx)}><i className="fa-regular fa-trash-can text-[11px]"></i></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">

              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex gap-6 border-b border-gray-100 pb-2 mb-4 text-sm text-gray-500">
                  <button
                    className={`cursor-pointer pb-2 -mb-2 border-b-2 transition ${activeTab === 'overview' ? 'text-blue-600 font-medium border-blue-600' : 'hover:text-gray-800 border-transparent'}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`cursor-pointer pb-2 -mb-2 border-b-2 transition ${activeTab === 'guarantors' ? 'text-blue-600 font-medium border-blue-600' : 'hover:text-gray-800 border-transparent'}`}
                    onClick={() => setActiveTab('guarantors')}
                  >
                    Guarantors ({guarantors.length})
                  </button>
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <div className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1.5">Description</div>
                      {customer.description || customer.notes || (
                        <span className="text-gray-400">No description provided.</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500">Created</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(customer.createdAt)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Last Updated</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(customer.updatedAt)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Country</div>
                        <div className="text-sm font-medium text-gray-900">{customer.country || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Postal Code</div>
                        <div className="text-sm font-medium text-gray-900">{customer.postalCode || '—'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'guarantors' && (
                  <div>
                    {guarantors.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <div className="text-gray-400 text-sm">No guarantors added for this customer.</div>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {guarantors.map((g) => (
                          <div key={g.id} className="py-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 text-sm">{g.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                                {g.relation && <div>Relation: {g.relation}</div>}
                                {g.mobile && <div>Mobile: {g.mobile}</div>}
                                {g.cnic && <div>CNIC: {g.cnic}</div>}
                                {g.occupation && <div>Occupation: {g.occupation}</div>}
                                {g.residential_address && <div>Address: {g.residential_address}</div>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>First Name / Business Name</Label>
              <Input
                value={editForm.firstName || ''}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              />
            </div>
            {editForm.customerType !== 'business' && (
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={editForm.lastName || ''}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input
                value={editForm.mobile || ''}
                onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CNIC</Label>
              <Input
                value={editForm.cnic || ''}
                onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Credit Limit (Rs.)</Label>
              <Input
                type="number"
                value={editForm.creditLimit ?? 0}
                onChange={(e) => setEditForm({ ...editForm, creditLimit: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select
                value={editForm.paymentTerms || 'Cash'}
                onValueChange={(v) => setEditForm({ ...editForm, paymentTerms: v as Customer['paymentTerms'] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Due Payments">Due Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.customerStatus || 'active'}
                onValueChange={(v) => setEditForm({ ...editForm, customerStatus: v as Customer['customerStatus'] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.description || editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCustomer}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-gray-900">{fullName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
