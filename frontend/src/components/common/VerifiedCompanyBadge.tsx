'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { COMPANY_REGISTRATION } from '@/src/constants/companyRegistration';

type VerifiedCompanyBadgeProps = {
  className?: string;
  align?: 'left' | 'center';
  tooltipPosition?: 'above' | 'below';
};

export function VerifiedCompanyBadge({
  className,
  align = 'center',
  tooltipPosition = 'above',
}: VerifiedCompanyBadgeProps) {
  return (
    <div
      className={cn(
        'group relative inline-flex max-w-full',
        align === 'center' && 'mx-auto',
        className,
      )}
    >
      <button
        type="button"
        className={cn(
          'inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1.5 text-left shadow-sm transition-colors',
          'hover:border-emerald-300 hover:bg-emerald-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
        )}
        aria-describedby="verified-company-details"
      >
        <ShieldCheck
          className="h-4 w-4 shrink-0 text-emerald-600"
          aria-hidden
        />
        <span className="text-xs font-semibold leading-tight text-emerald-900 sm:text-sm">
          {COMPANY_REGISTRATION.badgeLabel}
        </span>
      </button>

      <div
        id="verified-company-details"
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg',
          'opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
          tooltipPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2',
          align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0',
        )}
      >
        <p className="mb-2 text-xs font-semibold text-slate-900">
          Verified Company
        </p>
        <dl className="space-y-2 text-xs text-slate-600">
          <div>
            <dt className="font-medium text-slate-800">Registered Company</dt>
            <dd>{COMPANY_REGISTRATION.registeredCompany}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">Authority</dt>
            <dd>{COMPANY_REGISTRATION.authority}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">Company Number</dt>
            <dd>{COMPANY_REGISTRATION.companyNumber}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">
              Registered Office Address
            </dt>
            <dd>{COMPANY_REGISTRATION.registeredOfficeAddress}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
