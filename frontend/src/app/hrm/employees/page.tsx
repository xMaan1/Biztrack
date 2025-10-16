'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ModuleGuard } from '../../../components/guards/PermissionGuard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { UserPlus, Filter, Eye, Edit, Save, Trash2 } from 'lucide-react';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import HRMService from '@/src/services/HRMService';
import {
  Employee,
  Department,
  EmploymentStatus,
  EmployeeType,
  EmployeeUpdate,
} from '@/src/models/hrm';
import Link from 'next/link';
import { DashboardLayout } from '@/src/components/layout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { toast } from 'sonner';

export default function HRMEmployeesPage() {
  return (
    <ModuleGuard module="hrm" fallback={<div>You don't have access to HRM module</div>}>
      <HRMEmployeesContent />
    </ModuleGuard>
  );
}

function HRMEmployeesContent() {
  const { getCurrencySymbol } = useCurrency();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    employeeType: '',
    search: '',
  });

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editFormData, setEditFormData] = useState<EmployeeUpdate>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, [filters]);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await HRMService.getEmployees(filters);
      setEmployees(response.employees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  // Modal handlers
  const openViewModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };


  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      dateOfBirth: employee.dateOfBirth,
      hireDate: employee.hireDate,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position,
      employeeType: employee.employeeType,
      employmentStatus: employee.employmentStatus,
      managerId: employee.managerId,
      salary: employee.salary,
      address: employee.address,
      emergencyContact: employee.emergencyContact,
      emergencyPhone: employee.emergencyPhone,
      skills: employee.skills,
      certifications: employee.certifications,
      notes: employee.notes,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
    setEditFormData({});
  };

  const handleEditInputChange = (field: keyof EmployeeUpdate, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      setEditLoading(true);
      await HRMService.updateEmployee(selectedEmployee.id, editFormData);
      toast.success('Employee updated successfully');
      loadEmployees();
      closeEditModal();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to update employee';
      toast.error(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete modal handlers
  const openDeleteModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setDeleteLoading(true);
      await HRMService.deleteEmployee(selectedEmployee.id);
      toast.success('Employee deleted successfully');
      loadEmployees();
      closeDeleteModal();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to delete employee';
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading employees...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <Button onClick={loadEmployees}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-600">Manage your workforce</p>
          </div>
          <Button asChild>
            <Link href="/hrm/employees/new">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search employees..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Department
                </label>
                <Select
                  value={filters.department || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('department', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {Object.values(Department).map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {Object.values(EmploymentStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={filters.employeeType || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('employeeType', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.values(EmployeeType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employees List */}
        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>
              {employees.length} employee{employees.length !== 1 ? 's' : ''}{' '}
              found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-gray-600">{employee.position}</div>
                      <div className="text-sm text-gray-500">
                        {employee.email} • {employee.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">{employee.employeeId}</div>
                      <div className="text-sm text-gray-500">
                        {employee.department}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge
                        className={HRMService.getEmploymentStatusColor(
                          employee.employmentStatus,
                        )}
                      >
                        {employee.employmentStatus}
                      </Badge>
                      <Badge
                        className={HRMService.getEmployeeTypeColor(
                          employee.employeeType,
                        )}
                      >
                        {employee.employeeType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openViewModal(employee)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditModal(employee)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDeleteModal(employee)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* View Employee Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
              <DialogDescription>
                View complete information for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-6 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">First Name</Label>
                      <p className="text-sm">{selectedEmployee.firstName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Last Name</Label>
                      <p className="text-sm">{selectedEmployee.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="text-sm">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="text-sm">{selectedEmployee.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                      <p className="text-sm">{selectedEmployee.dateOfBirth || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Hire Date</Label>
                      <p className="text-sm">{selectedEmployee.hireDate}</p>
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Employment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Employee ID</Label>
                      <p className="text-sm">{selectedEmployee.employeeId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Position</Label>
                      <p className="text-sm">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Department</Label>
                      <p className="text-sm">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Employee Type</Label>
                      <p className="text-sm">{selectedEmployee.employeeType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Employment Status</Label>
                      <p className="text-sm">{selectedEmployee.employmentStatus}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Salary</Label>
                      <p className="text-sm">{selectedEmployee.salary ? `${getCurrencySymbol()}${selectedEmployee.salary.toLocaleString()}` : 'Not set'}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Address</Label>
                      <p className="text-sm">{selectedEmployee.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
                      <p className="text-sm">{selectedEmployee.emergencyContact || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Emergency Phone</Label>
                      <p className="text-sm">{selectedEmployee.emergencyPhone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedEmployee.skills && selectedEmployee.skills.length > 0 ? (
                          selectedEmployee.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No skills listed</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Certifications</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedEmployee.certifications && selectedEmployee.certifications.length > 0 ? (
                          selectedEmployee.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No certifications listed</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Notes</Label>
                      <p className="text-sm">{selectedEmployee.notes || 'No notes'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Employee Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update information for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name *</Label>
                    <Input
                      id="edit-firstName"
                      value={editFormData.firstName || ''}
                      onChange={(e) => handleEditInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name *</Label>
                    <Input
                      id="edit-lastName"
                      value={editFormData.lastName || ''}
                      onChange={(e) => handleEditInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => handleEditInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editFormData.phone || ''}
                      onChange={(e) => handleEditInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                    <Input
                      id="edit-dateOfBirth"
                      type="date"
                      value={editFormData.dateOfBirth || ''}
                      onChange={(e) => handleEditInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hireDate">Hire Date *</Label>
                    <Input
                      id="edit-hireDate"
                      type="date"
                      value={editFormData.hireDate || ''}
                      onChange={(e) => handleEditInputChange('hireDate', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Employment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-employeeId">Employee ID *</Label>
                    <Input
                      id="edit-employeeId"
                      value={editFormData.employeeId || ''}
                      onChange={(e) => handleEditInputChange('employeeId', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-position">Position *</Label>
                    <Input
                      id="edit-position"
                      value={editFormData.position || ''}
                      onChange={(e) => handleEditInputChange('position', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Select
                      value={editFormData.department || ''}
                      onValueChange={(value) => handleEditInputChange('department', value as Department)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Department).map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept.charAt(0).toUpperCase() + dept.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-employeeType">Employee Type</Label>
                    <Select
                      value={editFormData.employeeType || ''}
                      onValueChange={(value) => handleEditInputChange('employeeType', value as EmployeeType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(EmployeeType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-employmentStatus">Employment Status</Label>
                    <Select
                      value={editFormData.employmentStatus || ''}
                      onValueChange={(value) => handleEditInputChange('employmentStatus', value as EmploymentStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(EmploymentStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-salary">Salary</Label>
                    <Input
                      id="edit-salary"
                      type="number"
                      value={editFormData.salary || ''}
                      onChange={(e) => handleEditInputChange('salary', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Textarea
                      id="edit-address"
                      value={editFormData.address || ''}
                      onChange={(e) => handleEditInputChange('address', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-emergencyContact">Emergency Contact</Label>
                      <Input
                        id="edit-emergencyContact"
                        value={editFormData.emergencyContact || ''}
                        onChange={(e) => handleEditInputChange('emergencyContact', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-emergencyPhone">Emergency Phone</Label>
                      <Input
                        id="edit-emergencyPhone"
                        value={editFormData.emergencyPhone || ''}
                        onChange={(e) => handleEditInputChange('emergencyPhone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      value={editFormData.notes || ''}
                      onChange={(e) => handleEditInputChange('notes', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={closeEditModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Employee Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Employee</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{' '}
                <strong>
                  {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                </strong>
                ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteEmployee}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Employee
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
