'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/src/components/layout';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Label } from '@/src/components/ui/label';
import { ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import CRMService from '@/src/services/CRMService';
import fileUploadService from '@/src/services/FileUploadService';
import { Contact, ContactUpdate, ContactAttachment, Company } from '@/src/models/crm';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import agentPortalService from '@/src/services/AgentPortalService';
import {
  contactTypeDisplayLabel,
  mergeSocialFromApi,
  nonEmptyAddressRows,
  CONTACT_SOCIAL_LABELS,
  defaultSocialLinks,
  birthdayInputFromApi,
  buildAddressesPayload,
} from '@/src/components/crm/contacts/contactUtils';
import { ContactFormCoreFields } from '@/src/components/crm/contacts/contact-form/ContactFormCoreFields';
import { ContactFormNotesSection } from '@/src/components/crm/contacts/contact-form/ContactFormNotesSection';
import { ContactFormAdditionalSection } from '@/src/components/crm/contacts/contact-form/ContactFormAdditionalSection';
import { ContactFormAddressesSection } from '@/src/components/crm/contacts/contact-form/ContactFormAddressesSection';
import { ContactFormSocialSection } from '@/src/components/crm/contacts/contact-form/ContactFormSocialSection';
import { ContactFormAttachmentsSection } from '@/src/components/crm/contacts/contact-form/ContactFormAttachmentsSection';
import { ContactCreate, ContactType } from '@/src/models/crm';
import { User } from '@/src/models';
import { toast } from 'sonner';
import { useAuth } from '@/src/contexts/AuthContext';
import { apiService } from '@/src/services/ApiService';
import { type UserSearchItem } from '@/src/components/ui/user-search';
import { Alert, AlertDescription } from '@/src/components/ui/alert';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = typeof params.id === 'string' ? params.id : '';
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showFullWebsite, setShowFullWebsite] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [ledger, setLedger] = useState<any>(null);

  const [openAdditional, setOpenAdditional] = useState(false);
  const [openAddresses, setOpenAddresses] = useState(false);
  const [openContactDetails, setOpenContactDetails] = useState(false);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);

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

  useEffect(() => {
    if (!contactId) {
      router.replace('/crm/contacts');
      return;
    }

    (async () => {
      try {
        const [contactData, companiesData] = await Promise.all([
          CRMService.getContact(contactId),
          CRMService.getCompanies({}, 1, 100),
        ]);
        setContact(contactData);
        setCompanies(companiesData.companies || []);
        agentPortalService.getContactLedger(contactId).then(setLedger).catch(() => setLedger(null));
      } catch {
        toast.error('Contact not found');
        router.replace('/crm/contacts');
      } finally {
        setLoading(false);
      }
    })();
  }, [contactId, router]);

  const fetchUsers = useCallback(async () => {
    try {
      let tenantId: string | null = null;
      const selectedTenant = localStorage.getItem('selectedTenant');
      if (selectedTenant) {
        try {
          const parsed = JSON.parse(selectedTenant);
          tenantId = parsed.id || parsed.tenantId;
        } catch {}
      }
      if (!tenantId) tenantId = localStorage.getItem('currentTenantId');
      if (tenantId) {
        const response = await apiService.getTenantUsers(tenantId);
        const uniqueUsers = (response.users || []).reduce((acc: User[], u: User) => {
          const existing = acc.find((x) => x.userId === u.userId || x.id === u.userId);
          if (!existing) acc.push(u);
          return acc;
        }, []);
        setUsers(uniqueUsers);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const selectedAssignee = React.useMemo((): UserSearchItem | null => {
    if (!formData.assignedTo) return null;
    const found = users.find((u) => (u.id || u.userId) === formData.assignedTo);
    if (found) return found;
    return { id: formData.assignedTo, userId: formData.assignedTo, userName: formData.assignedTo };
  }, [users, formData.assignedTo]);

  const startEditing = () => {
    if (!contact) return;
    setEditing(true);
    setErrorMessage('');
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      emails: (contact.emails || []).length > 0 ? contact.emails : [{ value: '', label: 'personal' }],
      phones: (contact.phones || []).length > 0 ? contact.phones : [{ value: '', label: 'work' }],
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
  };

  const handleSave = async () => {
    if (!contact) return;
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    setSubmitting(true);
    try {
      const addressesPayload = buildAddressesPayload(formData.addresses);
      const socialPayload = mergeSocialFromApi(formData.socialLinks);
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
        birthday: formData.birthday?.trim() ? `${formData.birthday.trim()}T00:00:00` : null,
        website: formData.website?.trim() || null,
        assignedTo: formData.assignedTo || undefined,
      };
      const updated = await CRMService.updateContact(contact.id, payload);
      setContact(updated);
      setEditing(false);
      toast.success('Contact updated successfully');
    } catch {
      setErrorMessage('Error saving contact. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setErrorMessage('');
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
          { url: res.file_url, original_filename: res.original_filename, s3_key: res.s3_key },
        ],
      }));
    } catch {
      setErrorMessage('File upload failed. Please try again.');
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
        }
      }
    }
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!contact) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">Contact not found.</p>
          <Button variant="outline" onClick={() => router.push('/crm/contacts')} className="mt-4">
            Back to Contacts
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push('/crm/contacts')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">
              {editing ? 'Edit Contact' : `${contact.firstName} ${contact.lastName}`}
            </h1>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit} disabled={submitting}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <Button onClick={startEditing}>Edit</Button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContactFormCoreFields
              formData={formData}
              setFormData={setFormData}
              companies={companies}
              customContactTypes={[]}
              onRequestCustomContactType={() => {}}
              users={users}
              selectedAssignee={selectedAssignee}
            />
            <ContactFormNotesSection formData={formData} setFormData={setFormData} />
            <ContactFormAdditionalSection
              formData={formData}
              setFormData={setFormData}
              open={openAdditional}
              onToggle={() => setOpenAdditional((o) => !o)}
            />
            <ContactFormAddressesSection
              formData={formData}
              setFormData={setFormData}
              open={openAddresses}
              onToggle={() => setOpenAddresses((o) => !o)}
            />
            <ContactFormSocialSection
              formData={formData}
              setFormData={setFormData}
              open={openContactDetails}
              onToggle={() => setOpenContactDetails((o) => !o)}
            />
            <ContactFormAttachmentsSection
              formData={formData}
              attachmentFileInputRef={attachmentFileInputRef}
              onAttachmentFile={handleAttachmentFile}
              attachmentUploading={attachmentUploading}
              onRemoveAttachment={removeAttachmentAt}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">First Name</Label>
                <p className="text-lg font-semibold">{contact.firstName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Last Name</Label>
                <p className="text-lg font-semibold">{contact.lastName}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Email addresses</Label>
                <div className="mt-1 space-y-1">
                  {(() => {
                    const ev = (contact.emails || []).filter((e) => e.value.trim());
                    const list = ev.length > 0 ? ev : contact.email?.trim() ? [{ value: contact.email.trim(), label: 'personal' as const }] : [];
                    if (list.length === 0) return <p className="text-muted-foreground">Not specified</p>;
                    return list.map((e, i) => (
                      <p key={i}>{e.value} <span className="text-muted-foreground text-sm">({e.label})</span></p>
                    ));
                  })()}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Phone numbers</Label>
                <div className="mt-1 space-y-1">
                  {(() => {
                    const pv = (contact.phones || []).filter((p) => p.value.trim());
                    const list = pv.length > 0 ? pv : [...(contact.phone ? [{ value: contact.phone, label: 'work' as const }] : []), ...(contact.mobile ? [{ value: contact.mobile, label: 'personal' as const }] : [])];
                    if (list.length === 0) return <p className="text-muted-foreground">Not specified</p>;
                    return list.map((p, i) => (
                      <p key={i}>{p.value} <span className="text-muted-foreground text-sm">({p.label})</span></p>
                    ));
                  })()}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Job Title</Label>
                <p>{contact.jobTitle || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Department</Label>
                <p>{contact.department || 'Not specified'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Website</Label>
                {(() => {
                  const wv = contact.website?.trim() || '';
                  const wh = wv ? (/^https?:\/\//i.test(wv) ? wv : `https://${wv}`) : '';
                  const isLong = wv.length > 48;
                  if (!wv) return <p>Not specified</p>;
                  return (
                    <div className="mt-1 space-y-1.5">
                      <button type="button" onClick={() => isLong && setShowFullWebsite((p) => !p)}
                        className={`block text-left text-blue-600 hover:underline ${!showFullWebsite ? 'max-w-[320px] truncate' : 'break-all'}`}
                        title={wv}>
                        {wv}
                      </button>
                      <div className="flex items-center gap-3 text-sm">
                        {isLong && (
                          <button type="button" onClick={() => setShowFullWebsite((p) => !p)}
                            className="text-muted-foreground hover:text-foreground">
                            {showFullWebsite ? 'Show less' : 'Show full'}
                          </button>
                        )}
                        <a href={wh} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1">
                          Open link <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Company</Label>
                <p>{contact.companyId ? companies.find((c) => c.id === contact.companyId)?.name || 'Company ID: ' + contact.companyId : 'Not specified'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Contact Type</Label>
                <p>{contactTypeDisplayLabel(contact)}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge variant={contact.isActive ? 'default' : 'secondary'}>{contact.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Client Value</Label>
                <p>{contact.clientValue != null ? formatCurrency(contact.clientValue) : '—'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Deal Closed Value</Label>
                <p>{contact.dealClosedValue != null ? formatCurrency(contact.dealClosedValue) : '—'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Remaining Payable</Label>
                <p>{contact.remainingPayable != null ? formatCurrency(contact.remainingPayable) : '—'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Lifetime Value</Label>
                <p className="font-semibold">{contact.lifetimeValue != null ? formatCurrency(contact.lifetimeValue) : '—'}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Notes</Label>
                <p>{contact.notes || 'No notes'}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="whitespace-pre-wrap">{contact.description?.trim() ? contact.description : '—'}</p>
              </div>

              {ledger && ledger.entries?.length > 0 && (
                <div className="md:col-span-2 border-t pt-4">
                  <p className="text-sm font-semibold mb-2">Payment Ledger</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Paid {formatCurrency(ledger.totalPaid)} · Pending {formatCurrency(ledger.totalPending)}
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {ledger.entries.map((e: any) => (
                      <div key={e.id} className="flex justify-between text-sm border rounded px-3 py-2">
                        <span>{e.description || e.entryType}</span>
                        <span className={e.revenueType === 'realized' ? 'text-green-600' : 'text-amber-600'}>{formatCurrency(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-sm font-semibold mb-2">Additional</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Initials</span>
                    <p>{contact.initials?.trim() || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Full name</span>
                    <p>{contact.fullName?.trim() || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Birthday</span>
                    <p>{contact.birthday ? CRMService.formatDate(contact.birthday) : '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Business tax ID</span>
                    <p>{contact.businessTaxId?.trim() || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-sm font-semibold mb-2">Addresses</p>
                {nonEmptyAddressRows(contact.addresses).length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  <div className="space-y-3">
                    {nonEmptyAddressRows(contact.addresses).map((a, idx) => (
                      <div key={idx} className="rounded-md border p-3 text-sm space-y-1">
                        {a.label?.trim() && <p className="font-medium">{a.label}</p>}
                        {[a.line1, a.line2].filter((x) => x?.trim()).map((line, i) => <p key={i}>{line}</p>)}
                        <p className="text-muted-foreground">{[a.city, a.state, a.postalCode, a.country].filter((x) => x?.trim()).join(', ')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-sm font-semibold mb-2">Contact details</p>
                {(() => {
                  const s = mergeSocialFromApi(contact.socialLinks);
                  const rows = CONTACT_SOCIAL_LABELS.filter(([k]) => (s[k] || '').trim());
                  if (rows.length === 0) return <p className="text-sm text-muted-foreground">—</p>;
                  return (
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {rows.map(([k, label]) => (
                        <div key={k}>
                          <dt className="text-gray-500">{label}</dt>
                          <dd className="break-all">{s[k]}</dd>
                        </div>
                      ))}
                    </dl>
                  );
                })()}
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Attachments</Label>
                {(contact.attachments || []).length > 0 ? (
                  <ul className="mt-1 border rounded-md divide-y text-sm">
                    {(contact.attachments || []).map((att, idx) => (
                      <li key={`${att.url}-${idx}`} className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="truncate">{att.original_filename || 'File'}</span>
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center shrink-0">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : <p>None</p>}
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {contact.tags && contact.tags.length > 0 ? (
                    contact.tags.map((tag, index) => <Badge key={index} variant="outline">{tag}</Badge>)
                  ) : <p>No tags</p>}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p>{CRMService.formatDate(contact.createdAt)}</p>
              </div>

              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                <p>{CRMService.formatDate(contact.updatedAt)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => router.push('/crm/contacts')}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={startEditing}>Edit</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
