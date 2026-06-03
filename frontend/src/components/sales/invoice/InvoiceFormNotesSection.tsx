'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import type { InvoiceCreate } from '@/src/models/sales';

type InvoiceFormNotesSectionProps = {
  formData: InvoiceCreate;
  onInputChange: (field: keyof InvoiceCreate, value: string | number) => void;
};

export function InvoiceFormNotesSection({ formData, onInputChange }: InvoiceFormNotesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => onInputChange('notes', e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="terms">Terms & Conditions (Optional)</Label>
          <Textarea
            id="terms"
            value={formData.terms}
            onChange={(e) => onInputChange('terms', e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
