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
    
    console.log('Available roles:', roles);
    
    const role = roles.find((r: any) => r.name === roleName);
    if (role) {
      console.log(`Found role ${roleName} with ID:`, role.id);
      return role.id;
    }
    
    console.log(`Role ${roleName} not found, trying team_member`);
    const defaultRole = roles.find((r: any) => r.name === 'team_member');
    if (defaultRole) {
      console.log('Using team_member role with ID:', defaultRole.id);
      return defaultRole.id;
    }
    
    console.log('No roles found at all');
    return null;
  } catch (error) {
    console.error('Failed to fetch roles:', error);
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

      console.log('Creating team member with data:', formData);

      // Generate unique username to avoid conflicts
      const baseUsername = formData.email.split('@')[0];
      const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
      const uniqueUsername = `${baseUsername}_${timestamp}`;
      
      console.log('Generated unique username:', uniqueUsername);

      const userData = {
        userName: uniqueUsername,
        email: formData.email,
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        password: 'TempPassword123!',
        userRole: formData.role
      };

      console.log('User data to send:', userData);

      const roleId = await getRoleId(formData.role);
      
      if (!roleId) {
        setError('Failed to find role. Please try again.');
        return;
      }
      
      console.log('Using role ID:', roleId);
      
      const response = await apiService.post(`/rbac/create-user?role_id=${roleId}`, userData);
      console.log('User creation response:', response);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating team member:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create team member');
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
