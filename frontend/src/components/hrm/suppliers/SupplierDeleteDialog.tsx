'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import type { SupplierDeleteDialogProps } from './types';

export function SupplierDeleteDialog({
  open,
  supplier,
  onOpenChange,
  onConfirm,
  onCancel,
}: SupplierDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Supplier</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{supplier?.name}</strong>? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
