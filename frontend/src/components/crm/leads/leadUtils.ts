export type LeadUserOption = { id: string; name: string };

export function pipelineClass(stage?: string) {
  if (stage === 'new_lead') return 'bg-blue-100 text-blue-700';
  if (stage === 'tried_to_contact') return 'bg-red-100 text-red-700';
  if (stage === 'made_contact') return 'bg-indigo-100 text-indigo-700';
  if (stage === 'qualified' || stage === 'appointment_set')
    return 'bg-emerald-100 text-emerald-700';
  if (stage === 'lost') return 'bg-gray-200 text-gray-600';
  return 'bg-slate-100 text-slate-700';
}

export function relTime(iso?: string | null) {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} H`;
  const days = Math.floor(hours / 24);
  return `${days} D`;
}

export function ageLabel(createdAt?: string) {
  if (!createdAt) return 'N/A';
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000),
  );
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function money(n?: number | null) {
  if (n == null) return 'Not set';
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

export function mapUrl(
  lat?: number | null,
  lng?: number | null,
  city?: string | null,
  address?: string | null,
): string | null {
  if (lat != null && lng != null) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05}%2C${lat - 0.05}%2C${lng + 0.05}%2C${lat + 0.05}&layer=mapnik&marker=${lat}%2C${lng}`;
  }
  if (city || address) {
    return `https://www.openstreetmap.org/export/embed.html?bbox=-79.5%2C43.5%2C-79.1%2C43.9&layer=mapnik`;
  }
  return null;
}

export function ageDays(createdAt?: string) {
  if (!createdAt) return 0;
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000),
  );
}

export function mapTenantUsers(tenantUsers: unknown[] | null | undefined): LeadUserOption[] {
  return (tenantUsers || []).map((u: any) => ({
    id: String(u.id || u.userId),
    name:
      [u.firstName, u.lastName].filter(Boolean).join(' ') ||
      u.userName ||
      u.email ||
      'User',
  }));
}
