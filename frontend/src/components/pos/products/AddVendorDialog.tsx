'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';

type AddVendorDialogProps = {
  open: boolean;
  vendorName: string;
  vendorCode: string;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorNameChange: (name: string) => void;
  onVendorCodeChange: (code: string) => void;
  onSubmit: () => void;
};

export function AddVendorDialog({
  open,
  vendorName,
  vendorCode,
  loading,
  onOpenChange,
  onVendorNameChange,
  onVendorCodeChange,
  onSubmit,
}: AddVendorDialogProps) {
  const resetAndClose = () => {
    onOpenChange(false);
    onVendorNameChange('');
    onVendorCodeChange('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor for your products. It will be available only for your tenant.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-vendor-name">Vendor name</Label>
            <Input
              id="new-vendor-name"
              value={vendorName}
              onChange={(e) => onVendorNameChange(e.target.value)}
              placeholder="e.g. Acme Supplies"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-vendor-code">Vendor code</Label>
            <Input
              id="new-vendor-code"
              value={vendorCode}
              onChange={(e) => onVendorCodeChange(e.target.value)}
              placeholder="e.g. ACME-001"
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!vendorName.trim() || !vendorCode.trim() || loading}
          >
            {loading ? 'Adding...' : 'Add Vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
