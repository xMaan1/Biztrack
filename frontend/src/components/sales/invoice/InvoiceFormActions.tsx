"use client";

import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import type { InvoiceFormMode } from "@/src/types/sales/invoiceForm";

type InvoiceFormActionsProps = {
  mode: InvoiceFormMode;
  loading: boolean;
  error?: string | null;
  onCancel: () => void;
};

export function InvoiceFormActions({
  mode,
  loading,
  error,
  onCancel,
}: InvoiceFormActionsProps) {
  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onCancel}
        >
          {mode === "view" ? "Close" : "Cancel"}
        </Button>
        {mode !== "view" && (
          <Button
            type="submit"
            variant="gradient"
            size="sm"
            disabled={loading}
            className="h-8"
          >
            {loading
              ? "Saving..."
              : mode === "create"
                ? "Generate Invoice"
                : "Update Invoice"}
          </Button>
        )}
      </div>
    </>
  );
}
