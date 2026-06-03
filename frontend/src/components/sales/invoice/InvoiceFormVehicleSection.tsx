'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { VehicleSearch } from '@/src/components/ui/vehicle-search';
import { Building } from 'lucide-react';
import type { InvoiceCreate } from '@/src/models/sales';
import type { Vehicle } from '@/src/models/workshop';

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-4 w-4" />
          Vehicle Details (Workshop)
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
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
        <div>
          <Label htmlFor="vehicleMake">Vehicle Make</Label>
          <Input
            id="vehicleMake"
            value={formData.vehicleMake}
            onChange={(e) => onInputChange('vehicleMake', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="vehicleModel">Vehicle Model</Label>
          <Input
            id="vehicleModel"
            value={formData.vehicleModel}
            onChange={(e) => onInputChange('vehicleModel', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="vehicleYear">Vehicle Year</Label>
          <Input
            id="vehicleYear"
            value={formData.vehicleYear}
            onChange={(e) => onInputChange('vehicleYear', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="vehicleColor">Vehicle Color</Label>
          <Input
            id="vehicleColor"
            value={formData.vehicleColor}
            onChange={(e) => onInputChange('vehicleColor', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="vehicleVin">VIN Number</Label>
          <Input
            id="vehicleVin"
            value={formData.vehicleVin}
            onChange={(e) => onInputChange('vehicleVin', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="vehicleReg">Registration Number</Label>
          <Input
            id="vehicleReg"
            value={formData.vehicleReg}
            onChange={(e) => onInputChange('vehicleReg', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="vehicleMileage">Mileage</Label>
          <Input
            id="vehicleMileage"
            value={formData.vehicleMileage}
            onChange={(e) => onInputChange('vehicleMileage', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="documentNo">Document No</Label>
          <Input
            id="documentNo"
            value={formData.documentNo}
            onChange={(e) => onInputChange('documentNo', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="jobDescription">Job Description</Label>
          <Textarea
            id="jobDescription"
            value={formData.jobDescription}
            onChange={(e) => onInputChange('jobDescription', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="partsDescription">Parts Description</Label>
          <Textarea
            id="partsDescription"
            value={formData.partsDescription}
            onChange={(e) => onInputChange('partsDescription', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="labourTotal">Labour Total (£)</Label>
          <Input
            id="labourTotal"
            type="number"
            step="0.01"
            min="0"
            value={formData.labourTotal}
            onChange={(e) => onInputChange('labourTotal', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <Label htmlFor="partsTotal">Parts Total (£)</Label>
          <Input
            id="partsTotal"
            type="number"
            step="0.01"
            min="0"
            value={formData.partsTotal}
            onChange={(e) => onInputChange('partsTotal', parseFloat(e.target.value) || 0)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
