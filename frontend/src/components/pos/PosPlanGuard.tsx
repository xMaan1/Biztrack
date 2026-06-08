'use client';

import { useLayoutEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePlanInfo } from '@/src/hooks/usePlanInfo';
import { PLAN_TYPE_AGENCY } from '@/src/constants/planTypes';

type PosPlanGuardProps = {
  children: ReactNode;
};

export function PosPlanGuard({ children }: PosPlanGuardProps) {
  const router = useRouter();
  const { planInfo, loading } = usePlanInfo();
  const [redirecting, setRedirecting] = useState(false);

  useLayoutEffect(() => {
    if (loading || !planInfo) return;
    if (planInfo.planType !== PLAN_TYPE_AGENCY) return;
    setRedirecting(true);
    router.replace('/dashboard');
  }, [planInfo, loading, router]);

  if (loading || redirecting) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground text-sm">
        Redirecting
      </div>
    );
  }

  if (planInfo?.planType === PLAN_TYPE_AGENCY) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground text-sm">
        Redirecting
      </div>
    );
  }

  return <>{children}</>;
}
