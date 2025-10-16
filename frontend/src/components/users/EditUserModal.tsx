'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC, UpdateTenantUserData } from '@/src/contexts/RBACContext';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Label } from '@/src/components/ui/label';
import { Switch } from '@/src/components/ui/switch';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess: () => void;
}

export function EditUserModal({ open, onOpenChange, user, onSuccess }: EditUserModalProps) {
  const { updateTenantUser, roles, loading } = useRBAC();
  const [formData, setFormData] = useState<UpdateTenantUserData>({
    role_id: '',
    custom_permissions: [],
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user) {
      setFormData({
        role_id: user.role_id || '',
        custom_permissions: user.custom_permissions || [],
        isActive: user.isActive,
      });
      setError('');
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.role_id) {
      setError('Please select a role');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await updateTenantUser(user.id, formData);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (roleId: string) => {
    setFormData(prev => ({ ...prev, role_id: roleId }));
  };

  const handleActiveChange = (isActive: boolean) => {
    setFormData(prev => ({ ...prev, isActive }));
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user role and permissions for {user.userName}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>User Information</Label>
            <div className="p-3 bg-muted rounded-md">
              <div className="font-medium">{user.userName}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role_id} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={handleActiveChange}
            />
            <Label htmlFor="isActive">Active User</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
