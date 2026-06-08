'use client';

import { Textarea } from '@/src/components/ui/textarea';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import type { MotWizardServices } from '../wizardTypes';
import { MOT_INSPECTION_PRICE } from '../wizardTypes';

type Step3ServicesProps = {
  services: MotWizardServices;
  onChange: (patch: Partial<MotWizardServices>) => void;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
};

export function Step3Services({
  services,
  onChange,
  onBack,
  onNext,
  canNext,
}: Step3ServicesProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Step 03</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Services</h2>
        <p className="mt-2 text-muted-foreground">
          Select the services you need for your MOT appointment.
        </p>
      </div>

      <div className="space-y-4">
        <div
          className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${
            services.motInspection
              ? 'border-primary bg-gradient-to-br from-blue-50/80 to-purple-50/80 shadow-md dark:from-blue-950/30 dark:to-purple-950/30'
              : 'border-border hover:border-primary/40'
          }`}
          onClick={() => onChange({ motInspection: !services.motInspection })}
        >
          <Checkbox
            checked={services.motInspection}
            onCheckedChange={(checked) => onChange({ motInspection: checked === true })}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <Label className="cursor-pointer text-base font-semibold">
                Carry Out MOT Inspection
              </Label>
              <span className="text-lg font-bold text-primary">
                £{MOT_INSPECTION_PRICE.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Standard MOT test including emissions and safety checks
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otherServices" className="text-sm font-semibold uppercase tracking-wide">
            Other Services
          </Label>
          <Textarea
            id="otherServices"
            value={services.otherServices}
            onChange={(e) => onChange({ otherServices: e.target.value })}
            placeholder="Please let us know which other services you require"
            rows={4}
            className="rounded-xl border-2 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onBack} className="h-12 rounded-xl gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-sm font-bold uppercase tracking-wider hover:from-blue-700 hover:to-purple-700"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
