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
      <p className="mb-2 text-sm font-semibold text-foreground">Vehicle Details</p>
      <div className="mb-2 [&_label]:sr-only [&>div>div.mt-2]:hidden [&_input]:h-8">
        <VehicleSearch
          label="Vehicle"
          value={selectedVehicle}
          onSelect={(v) => {
            onVehicleSelect(v);
            if (v) {
              onInputChange('vehicleMake', v.make ?? '');
              onInputChange('vehicleModel', v.model ?? '');
              onInputChange('vehicleYear', v.year ?? '');
              onInputChange('vehicleColor', v.color ?? '');
              onInputChange('vehicleVin', v.vin ?? '');
              onInputChange('vehicleReg', v.registration_number ?? '');
              onInputChange('vehicleMileage', v.mileage ?? '');
            }
          }}
          placeholder="Search by reg, VIN, make, model..."
        />
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 lg:grid-cols-3">
        <div className="space-y-1.5">
          <InlineField label="Make:">
            <Input
              id="vehicleMake"
              value={formData.vehicleMake}
              onChange={(e) => onInputChange('vehicleMake', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Model:">
            <Input
              id="vehicleModel"
              value={formData.vehicleModel}
              onChange={(e) => onInputChange('vehicleModel', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Year:">
            <Input
              id="vehicleYear"
              value={formData.vehicleYear}
              onChange={(e) => onInputChange('vehicleYear', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Color:">
            <Input
              id="vehicleColor"
              value={formData.vehicleColor}
              onChange={(e) => onInputChange('vehicleColor', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5">
          <InlineField label="VIN:">
            <Input
              id="vehicleVin"
              value={formData.vehicleVin}
              onChange={(e) => onInputChange('vehicleVin', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Reg No:">
            <Input
              id="vehicleReg"
              value={formData.vehicleReg}
              onChange={(e) => onInputChange('vehicleReg', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Mileage:">
            <Input
              id="vehicleMileage"
              value={formData.vehicleMileage}
              onChange={(e) => onInputChange('vehicleMileage', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
          <InlineField label="Document No:">
            <Input
              id="documentNo"
              value={formData.documentNo}
              onChange={(e) => onInputChange('documentNo', e.target.value)}
              className={COMMERCE_INPUT_CLS}
            />
          </InlineField>
        </div>

        <div className="space-y-1.5">
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
