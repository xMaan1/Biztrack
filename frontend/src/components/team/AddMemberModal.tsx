'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, UserPlus, Mail } from 'lucide-react';
import { apiService } from '../../services/ApiService';
import { extractErrorMessage } from '../../utils/errorUtils';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

interface MemberData {
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

const roles = [
  { value: 'admin', label: 'Administrator' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'team_member', label: 'Team Member' },
  { value: 'client', label: 'Client' },
  { value: 'viewer', label: 'Viewer' },
];

const getRoleId = async (roleName: string) => {
  try {
    const response = await apiService.get('/rbac/roles');
    const roles = response.roles || [];
    
    const role = roles.find((r: any) => r.name === roleName);
    if (role) {
      return role.id;
    }
    
    const defaultRole = roles.find((r: any) => r.name === 'team_member');
    if (defaultRole) {
      return defaultRole.id;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

export default function AddMemberModal({
  open,
  onClose,
  onSuccess,
}: AddMemberModalProps) {
  const [formData, setFormData] = useState<MemberData>({
    email: '',
    role: 'team_member',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        role: 'team_member',
        firstName: '',
        lastName: '',
      });
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Generate unique username to avoid conflicts
      const baseUsername = formData.email.split('@')[0];
      const timestamp = Date.now().toString().slice(-4);
      const uniqueUsername = `${baseUsername}_${timestamp}`;

      const userData = {
        userName: uniqueUsername,
        email: formData.email,
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        password: 'TempPassword123!',
        userRole: formData.role
      };

      const roleId = await getRoleId(formData.role);
      
      if (!roleId) {
        setError('Failed to find role. Please try again.');
        return;
      }
      
      await apiService.post(`/rbac/create-user?role_id=${roleId}`, userData);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to create team member'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MemberData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Create a new team member and add them to your workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="member@example.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.email.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
