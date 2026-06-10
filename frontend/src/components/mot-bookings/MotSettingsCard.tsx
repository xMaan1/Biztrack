'use client';

import { useEffect, useState } from 'react';
import { PoundSterling, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import motBookingService from '@/src/services/MotBookingService';
import { MOT_INSPECTION_PRICE } from '@/src/components/mot-bookings/wizard/wizardTypes';

type MotSettingsCardProps = {
  onSaved?: (price: number) => void;
};

export function MotSettingsCard({ onSaved }: MotSettingsCardProps) {
  const [price, setPrice] = useState(String(MOT_INSPECTION_PRICE));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    motBookingService
      .getSettings()
      .then((settings) => {
        setPrice(String(Number(settings.inspection_price)));
      })
      .catch(() => {
        setPrice(String(MOT_INSPECTION_PRICE));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const parsed = Number(price);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Enter a valid price');
      return;
    }

    setSaving(true);
    try {
      const settings = await motBookingService.updateSettings({ inspection_price: parsed });
      const savedPrice = Number(settings.inspection_price);
      setPrice(String(savedPrice));
      onSaved?.(savedPrice);
      toast.success('MOT inspection price updated');
    } catch {
      toast.error('Failed to update MOT price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PoundSterling className="h-5 w-5 text-primary" />
          MOT Inspection Price
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="mot-inspection-price">Price shown on public booking</Label>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                £
              </span>
              <Input
                id="mot-inspection-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                disabled={loading || saving}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Button onClick={handleSave} disabled={loading || saving} className="sm:mb-0.5">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Price'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
