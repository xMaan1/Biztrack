'use client';

import { Building2, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/src/lib/utils';

const PLAN_MODULES: {
  icon: LucideIcon;
  title: string;
  planType: string;
  description: string;
  accent: 'indigo';
}[] = [
  {
    icon: Building2,
    title: 'Agency Module',
    planType: 'agency',
    description:
      'CRM, sales, POS, and inventory for agencies managing clients and campaigns.',
    accent: 'indigo',
  },
];

const accentStyles = {
  indigo: {
    card: 'border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white hover:border-indigo-300',
    icon: 'bg-indigo-600 text-white',
    badge: 'bg-indigo-100 text-indigo-800',
  },
};

export function LandingPlanModulesSection() {
  return (
    <section
      id="modules"
      className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50/80 to-white"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700 mb-3">
            One workspace
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Everything your agency needs
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A dedicated workspace with its own navigation, dashboard, and
            workflows. Start a free trial on the plan below.
          </p>
        </div>

        <div className="mx-auto grid max-w-md grid-cols-1 gap-5 sm:gap-6">
          {PLAN_MODULES.map((mod) => {
            const styles = accentStyles[mod.accent];
            return (
              <Card
                key={mod.planType}
                className={cn(
                  'h-full border shadow-sm transition-all duration-300 hover:shadow-md',
                  styles.card,
                )}
              >
                <CardHeader className="pb-2">
                  <div
                    className={cn(
                      'mb-3 flex h-11 w-11 items-center justify-center rounded-xl',
                      styles.icon,
                    )}
                  >
                    <mod.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <span
                    className={cn(
                      'mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      styles.badge,
                    )}
                  >
                    {mod.planType}
                  </span>
                  <CardTitle className="text-lg text-slate-900">
                    {mod.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {mod.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
