'use client';

import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import type { InvoiceFormMode } from '@/src/types/sales/invoiceForm';

type InvoiceFormActionsProps = {
  mode: InvoiceFormMode;
  loading: boolean;
  error?: string | null;
  onCancel: () => void;
};

export function InvoiceFormActions({ mode, loading, error, onCancel }: InvoiceFormActionsProps) {
  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {mode === 'view' ? 'Close' : 'Cancel'}
        </Button>
        {mode !== 'view' && (
          <Button type="submit" disabled={loading} className="modern-button">
            {loading ? 'Saving...' : mode === 'create' ? 'Create Invoice' : 'Update Invoice'}
          </Button>
        )}
      </div>
    </>
  );
}
