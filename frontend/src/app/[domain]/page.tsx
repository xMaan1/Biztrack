'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import motBookingService from '@/src/services/MotBookingService';
import { getTenantMotBookingUrl } from '@/src/models/mot/MotSettings';

export default function TenantLandingPage() {
  const params = useParams();
  const router = useRouter();
  const tenantDomain = params.domain as string;
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    motBookingService
      .getPublicSettings(tenantDomain)
      .then((settings) => {
        setTenantName(settings.tenant_name);
        setAvailable(true);
        router.replace(getTenantMotBookingUrl(tenantDomain));
      })
      .catch(() => {
        setAvailable(false);
      })
      .finally(() => setLoading(false));
  }, [router, tenantDomain]);

  if (loading) {
    return (
      <MotPublicLayout tenantName={tenantDomain}>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </MotPublicLayout>
    );
  }

  if (available) {
    return (
      <MotPublicLayout tenantName={tenantName || tenantDomain}>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </MotPublicLayout>
    );
  }

  return (
    <MotPublicLayout tenantName={tenantDomain}>
      <div className="mx-auto max-w-lg rounded-3xl border bg-card p-8 text-center shadow-sm">
        <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">MOT booking unavailable</h1>
        <p className="mt-2 text-muted-foreground">
          This workshop has not enabled public MOT booking yet.
        </p>
      </div>
    </MotPublicLayout>
  );
}
