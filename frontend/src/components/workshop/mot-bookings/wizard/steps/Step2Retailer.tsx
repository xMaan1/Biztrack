'use client';

import { useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Badge } from '@/src/components/ui/badge';
import { ArrowLeft, MapPin, Save, Star } from 'lucide-react';
import type { MotRetailer } from '@/src/models/workshop/MotRetailer';
import type { MotWizardRetailer } from '../wizardTypes';

type Step2RetailerProps = {
  retailer: MotWizardRetailer;
  savedRetailers: MotRetailer[];
  onChange: (patch: Partial<MotWizardRetailer>) => void;
  onSelectSaved: (retailer: MotRetailer) => void;
  onSave: (setAsDefault: boolean) => Promise<void>;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  saving: boolean;
};

export function Step2Retailer({
  retailer,
  savedRetailers,
  onChange,
  onSelectSaved,
  onSave,
  onBack,
  onNext,
  canNext,
  saving,
}: Step2RetailerProps) {
  const [setAsDefault, setSetAsDefault] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Step 02</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Retailer</h2>
        <p className="mt-2 text-muted-foreground">
          Choose or add your preferred workshop retailer. Set a default for faster bookings next time.
        </p>
      </div>

      {savedRetailers.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold uppercase tracking-wide">Saved Retailers</Label>
          <Select
            value={retailer.id || 'new'}
            onValueChange={(value) => {
              if (value === 'new') {
                onChange({
                  id: '',
                  name: '',
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  county: '',
                  postcode: '',
                  phone: '',
                  email: '',
                });
                return;
              }
              const found = savedRetailers.find((r) => r.id === value);
              if (found) onSelectSaved(found);
            }}
          >
            <SelectTrigger className="h-12 rounded-xl border-2">
              <SelectValue placeholder="Select a saved retailer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Add new retailer</SelectItem>
              {savedRetailers.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                  {r.is_default ? ' (Default)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="retailerName" className="text-sm font-semibold uppercase tracking-wide">
            Retailer Name
          </Label>
          <Input
            id="retailerName"
            value={retailer.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Workshop / retailer name"
            className="h-12 rounded-xl border-2"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address1" className="text-sm font-semibold uppercase tracking-wide">
            Address Line 1
          </Label>
          <Input
            id="address1"
            value={retailer.addressLine1}
            onChange={(e) => onChange({ addressLine1: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address2" className="text-sm font-semibold uppercase tracking-wide">
            Address Line 2
          </Label>
          <Input
            id="address2"
            value={retailer.addressLine2}
            onChange={(e) => onChange({ addressLine2: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-semibold uppercase tracking-wide">
            City
          </Label>
          <Input
            id="city"
            value={retailer.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="county" className="text-sm font-semibold uppercase tracking-wide">
            County
          </Label>
          <Input
            id="county"
            value={retailer.county}
            onChange={(e) => onChange({ county: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postcode" className="text-sm font-semibold uppercase tracking-wide">
            Postcode
          </Label>
          <Input
            id="postcode"
            value={retailer.postcode}
            onChange={(e) => onChange({ postcode: e.target.value.toUpperCase() })}
            className="h-12 rounded-xl border-2 uppercase"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-semibold uppercase tracking-wide">
            Phone
          </Label>
          <Input
            id="phone"
            value={retailer.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="h-12 rounded-xl border-2"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="setDefault"
            checked={setAsDefault}
            onCheckedChange={(checked) => setSetAsDefault(checked === true)}
          />
          <Label htmlFor="setDefault" className="flex cursor-pointer items-center gap-1.5 text-sm">
            <Star className="h-4 w-4 text-amber-500" />
            Set as default retailer
          </Label>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={saving || !retailer.name.trim()}
          onClick={() => onSave(setAsDefault)}
          className="gap-2 rounded-xl"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Retailer'}
        </Button>
        {retailer.id && savedRetailers.find((r) => r.id === retailer.id)?.is_default && (
          <Badge className="bg-amber-100 text-amber-800">
            <MapPin className="mr-1 h-3 w-3" />
            Default
          </Badge>
        )}
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
