import {
  Contact,
  ContactAddressRow,
  ContactSocialLinks,
  ContactType,
} from '@/src/models/crm';

export function contactTypeDisplayLabel(contact: Contact): string {
  const raw = contact.contactType ?? ContactType.CUSTOMER;
  const s = String(raw);
  if (!s) return 'Customer';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function emptyAddressRow(): ContactAddressRow {
  return {
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  };
}

export function defaultSocialLinks(): ContactSocialLinks {
  return {
    facebook: '',
    instagram: '',
    x: '',
    linkedin: '',
    skype: '',
    tiktok: '',
    threads: '',
  };
}

export function mergeSocialFromApi(
  s?: ContactSocialLinks | null,
): ContactSocialLinks {
  return { ...defaultSocialLinks(), ...(s || {}) };
}

export function birthdayInputFromApi(iso?: string | null): string {
  if (!iso) return '';
  const d = String(iso).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}

export function nonEmptyAddressRows(
  rows: ContactAddressRow[] | undefined | null,
): ContactAddressRow[] {
  return (rows || []).filter((a) => {
    const blob = [
      a.label,
      a.line1,
      a.line2,
      a.city,
      a.state,
      a.postalCode,
      a.country,
    ]
      .map((x) => (x || '').trim())
      .join('');
    return blob.length > 0;
  });
}

export function buildAddressesPayload(rows: ContactAddressRow[] | undefined) {
  return nonEmptyAddressRows(rows);
}

export const CONTACT_SOCIAL_LABELS = [
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['x', 'X'],
  ['linkedin', 'LinkedIn'],
  ['skype', 'Skype'],
  ['tiktok', 'TikTok'],
  ['threads', 'Threads'],
] as const;
