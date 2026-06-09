'use client';

import { Suspense } from 'react';
import { MotPublicLayout } from '@/src/components/mot/MotPublicLayout';
import { MotBookingWizardShell } from '@/src/components/mot/MotBookingWizardShell';
import { useMotBookingWizard } from '@/src/hooks/useMotBookingWizard';

function MotBookContent() {
  const wizard = useMotBookingWizard();

  if (wizard.loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <MotBookingWizardShell wizard={wizard} />;
}

export default function MotBookPage() {
  return (
    <MotPublicLayout>
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <MotBookContent />
      </Suspense>
    </MotPublicLayout>
  );
}
