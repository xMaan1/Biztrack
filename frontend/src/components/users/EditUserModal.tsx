'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC, UpdateTenantUserData } from '@/src/contexts/RBACContext';
import { extractErrorMessage } from '@/src/utils/errorUtils';
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
import { Checkbox } from '@/src/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

const MODULE_PERMISSIONS = [
  { module: 'CRM', permissions: ['crm:view', 'crm:create', 'crm:update', 'crm:delete'] },
  { module: 'HRM', permissions: ['hrm:view', 'hrm:create', 'hrm:update', 'hrm:delete'] },
  { module: 'Inventory', permissions: ['inventory:view', 'inventory:create', 'inventory:update', 'inventory:delete'] },
  { module: 'Finance', permissions: ['finance:view', 'finance:create', 'finance:update', 'finance:delete'] },
  { module: 'Projects', permissions: ['projects:view', 'projects:create', 'projects:update', 'projects:delete'] },
  { module: 'Production', permissions: ['production:view', 'production:create', 'production:update', 'production:delete'] },
  { module: 'Quality', permissions: ['quality:view', 'quality:create', 'quality:update', 'quality:delete'] },
  { module: 'Maintenance', permissions: ['maintenance:view', 'maintenance:create', 'maintenance:update', 'maintenance:delete'] },
  { module: 'Users', permissions: ['users:view', 'users:create', 'users:update', 'users:delete'] },
  { module: 'Reports', permissions: ['reports:view', 'reports:export'] },
];

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess: () => void;
}

export function EditUserModal({ open, onOpenChange, user, onSuccess }: EditUserModalProps) {
  const { updateTenantUser, roles } = useRBAC();
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
      const tenantUserId = (user as any).tenant_user_id || user.id;
      await updateTenantUser(tenantUserId, formData);
      onSuccess();
    } catch (error: any) {
      setError(extractErrorMessage(error, 'Failed to update user'));
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

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => {
      const currentPerms = prev.custom_permissions || [];
      return {
        ...prev,
        custom_permissions: currentPerms.includes(permission)
          ? currentPerms.filter(p => p !== permission)
          : [...currentPerms, permission]
      };
    });
  };

  const handleModuleToggle = (modulePermissions: string[]) => {
    const currentPerms = formData.custom_permissions || [];
    const allSelected = modulePermissions.every(p => currentPerms.includes(p));
    
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        custom_permissions: (prev.custom_permissions || []).filter(p => !modulePermissions.includes(p))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        custom_permissions: Array.from(new Set([...(prev.custom_permissions || []), ...modulePermissions]))
      }));
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user role and permissions for {user.userName}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] flex flex-col">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 flex-shrink-0">
            <div className="space-y-2">
              <Label htmlFor="userInfo">User</Label>
              <div className="text-sm text-muted-foreground">
                {user.userName} ({user.email})
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

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleActiveChange}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <Label>Custom Permissions</Label>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {MODULE_PERMISSIONS.map((module) => (
                <div key={module.module} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={module.permissions.every(p => (formData.custom_permissions || []).includes(p))}
                      onCheckedChange={() => handleModuleToggle(module.permissions)}
                    />
                    <Label className="font-medium cursor-pointer">{module.module}</Label>
                  </div>
                  <div className="ml-6 space-y-1">
                    {module.permissions.map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          checked={(formData.custom_permissions || []).includes(permission)}
                          onCheckedChange={() => handlePermissionToggle(permission)}
                        />
                        <Label className="text-sm cursor-pointer">{permission}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-shrink-0">
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
