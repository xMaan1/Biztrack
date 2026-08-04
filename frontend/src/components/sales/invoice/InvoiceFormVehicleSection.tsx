'use client';

import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { VehicleSearch } from '@/src/components/ui/vehicle-search';
import type { InvoiceCreate } from '@/src/models/sales';
import type { Vehicle } from '@/src/models/workshop';
import { COMMERCE_INPUT_CLS } from '../commerce-invoice/constants';
import { InlineField } from '../commerce-invoice/InlineField';

type InvoiceFormVehicleSectionProps = {
  formData: InvoiceCreate;
  selectedVehicle: Vehicle | null;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
};

export function InvoiceFormVehicleSection({
  formData,
  selectedVehicle,
  onVehicleSelect,
  onInputChange,
}: InvoiceFormVehicleSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="mb-2 text-sm font-semibold text-foreground">Vehicle</p>
      <div className="mb-2 [&_label]:sr-only [&>div>div.mt-2]:hidden [&_input]:h-8">
        <VehicleSearch
          label="Vehicle"
          value={selectedVehicle}
          onSelect={(v) => {
            onVehicleSelect(v);
            onInputChange('vehicleReg', v?.registration_number ?? '');
          }}
          placeholder="Search by reg, VIN, make, model..."
        />
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 lg:grid-cols-2">
        <div className="space-y-1.5">
          <InlineField label="Document No:">
            <Input
              id="documentNo"
              value={formData.documentNo}
              onChange={(e) => onInputChange('documentNo', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Labour Total:">
            <Input
              id="labourTotal"
              type="number"
              step="0.01"
              min="0"
              value={formData.labourTotal}
              onChange={(e) => onInputChange('labourTotal', parseFloat(e.target.value) || 0)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Parts Total:">
            <Input
              id="partsTotal"
              type="number"
              step="0.01"
              min="0"
              value={formData.partsTotal}
              onChange={(e) => onInputChange('partsTotal', parseFloat(e.target.value) || 0)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
        </div>
        <div className="space-y-1.5">
          <InlineField label="Job Desc:">
            <Textarea
              id="jobDescription"
              value={formData.jobDescription}
              onChange={(e) => onInputChange('jobDescription', e.target.value)}
              rows={2}
              className="min-h-[56px] resize-none text-sm shadow-none"
            />
          </InlineField>
          <InlineField label="Parts Desc:">
            <Textarea
              id="partsDescription"
              value={formData.partsDescription}
              onChange={(e) => onInputChange('partsDescription', e.target.value)}
              rows={2}
              className="min-h-[56px] resize-none text-sm shadow-none"
            />
          </InlineField>
        </div>
      </div>
    </section>
  );
}
