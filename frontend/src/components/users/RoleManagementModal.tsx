'use client';

import React, { useState, useEffect } from 'react';
import { useRBAC, CreateRoleData, UpdateRoleData } from '@/src/contexts/RBACContext';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Badge } from '@/src/components/ui/badge';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { Checkbox } from '@/src/components/ui/checkbox';

interface RoleManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

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

export function RoleManagementModal({ open, onOpenChange, onSuccess }: RoleManagementModalProps) {
  const { roles, createRole, updateRole, loading } = useRBAC();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [formData, setFormData] = useState<CreateRoleData>({
    name: '',
    display_name: '',
    description: '',
    permissions: [],
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setShowCreateForm(false);
      setEditingRole(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        permissions: [],
        isActive: true,
      });
      setError('');
    }
  }, [open]);

  const handleCreateRole = () => {
    setShowCreateForm(true);
    setEditingRole(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      permissions: [],
      isActive: true,
    });
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setShowCreateForm(false);
    setFormData({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
      permissions: role.permissions || [],
      isActive: role.isActive,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.display_name) {
      setError('Name and display name are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingRole) {
        const updateData: UpdateRoleData = {
          display_name: formData.display_name,
          description: formData.description,
          permissions: formData.permissions,
          isActive: formData.isActive,
        };
        await updateRole(editingRole.id, updateData);
      } else {
        await createRole(formData);
      }
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleModuleToggle = (modulePermissions: string[]) => {
    const allSelected = modulePermissions.every(p => formData.permissions.includes(p));
    
    if (allSelected) {
      // Remove all permissions for this module
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => !modulePermissions.includes(p))
      }));
    } else {
      // Add all permissions for this module
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...modulePermissions])]
      }));
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    return roleName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Role Management</DialogTitle>
          <DialogDescription>
            Create and manage roles with specific permissions for your organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showCreateForm && !editingRole ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Existing Roles</h3>
                <Button onClick={handleCreateRole} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </div>
              
              <div className="space-y-2">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{role.display_name}</div>
                      <div className="text-sm text-muted-foreground">{role.description}</div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {role.permissions.length} permissions
                        </Badge>
                        <Badge variant={role.isActive ? "default" : "secondary"} className="text-xs">
                          {role.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="crm_manager"
                    disabled={!!editingRole}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="CRM Manager"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Manages CRM operations and customer data"
                />
              </div>

              <div className="space-y-4">
                <Label>Permissions</Label>
                {MODULE_PERMISSIONS.map((module) => (
                  <div key={module.module} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={module.permissions.every(p => formData.permissions.includes(p))}
                        onCheckedChange={() => handleModuleToggle(module.permissions)}
                      />
                      <Label className="font-medium">{module.module}</Label>
                    </div>
                    <div className="ml-6 space-y-1">
                      {module.permissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData.permissions.includes(permission)}
                            onCheckedChange={() => handlePermissionToggle(permission)}
                          />
                          <Label className="text-sm">{permission}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRole(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
