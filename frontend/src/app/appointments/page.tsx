'use client';

import React, { useState, useEffect } from 'react';
import { ModuleGuard } from '../../components/guards/PermissionGuard';
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
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  Appointment,
  AppointmentCreate,
  AppointmentStats,
  Patient,
  appointmentService,
  patientService,
} from '@/src/services/HealthcareService';
import { DashboardLayout } from '../../components/layout';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/src/utils/errorUtils';

export default function AppointmentsPage() {
  return (
    <ModuleGuard module="crm" fallback={<div>You don't have access to this module</div>}>
      <AppointmentsContent />
    </ModuleGuard>
  );
}

function AppointmentsContent() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<AppointmentCreate>({
    patient_id: '',
    appointmentDate: '',
    appointmentTime: '',
    duration: 30,
    type: '',
    status: 'scheduled',
    reason: '',
    notes: '',
  });

  const itemsPerPage = 10;

  useEffect(() => {
    loadAppointments();
    loadStats();
    loadPatients();
  }, [currentPage, statusFilter, dateFrom, dateTo]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await appointmentService.getAppointments(
        skip,
        itemsPerPage,
        undefined,
        undefined,
        statusFilter === 'all' ? undefined : statusFilter,
        dateFrom || undefined,
        dateTo || undefined,
      );
      setAppointments(response.appointments);
      setTotalCount(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load appointments'));
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientService.getPatients(0, 1000);
      setPatients(response.patients);
    } catch (error) {
      console.error('Failed to load patients:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await appointmentService.getAppointmentStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.patient_id) errors.patient_id = 'Patient is required';
    if (!formData.appointmentDate) errors.appointmentDate = 'Date is required';
    if (!formData.appointmentTime) errors.appointmentTime = 'Time is required';
    if (!formData.type) errors.type = 'Type is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    try {
      await appointmentService.createAppointment(formData);
      toast.success('Appointment created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadAppointments();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to create appointment'));
    }
  };

  const handleUpdate = async () => {
    if (!selectedAppointment) return;
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    try {
      await appointmentService.updateAppointment(selectedAppointment.id, formData);
      toast.success('Appointment updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadAppointments();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update appointment'));
    }
  };

  const handleDelete = async () => {
    if (!appointmentToDelete) return;
    try {
      await appointmentService.deleteAppointment(appointmentToDelete.id);
      toast.success('Appointment deleted successfully');
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
      loadAppointments();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete appointment'));
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      appointmentDate: '',
      appointmentTime: '',
      duration: 30,
      type: '',
      status: 'scheduled',
      reason: '',
      notes: '',
    });
    setSelectedAppointment(null);
    setFormErrors({});
  };

  const openEditDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      patient_id: appointment.patient_id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      duration: appointment.duration,
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason || '',
      notes: appointment.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string }> = {
      scheduled: { color: 'bg-blue-100 text-blue-800' },
      confirmed: { color: 'bg-green-100 text-green-800' },
      completed: { color: 'bg-gray-100 text-gray-800' },
      cancelled: { color: 'bg-red-100 text-red-800' },
      no_show: { color: 'bg-yellow-100 text-yellow-800' },
    };
    const config = statusConfig[status] || statusConfig.scheduled;
    return <Badge className={config.color}>{status}</Badge>;
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600">Manage patient appointments</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
                <DialogDescription>Create a new appointment</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="patient_id">Patient *</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, patient_id: value });
                    if (formErrors.patient_id) setFormErrors({ ...formErrors, patient_id: '' });
                  }}
                >
                  <SelectTrigger className={formErrors.patient_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} ({patient.patientId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.patient_id && <p className="text-sm text-red-500 mt-1">{formErrors.patient_id}</p>}
              </div>
                <div>
                  <Label htmlFor="appointmentDate">Date *</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => {
                      setFormData({ ...formData, appointmentDate: e.target.value });
                      if (formErrors.appointmentDate) setFormErrors({ ...formErrors, appointmentDate: '' });
                    }}
                    className={formErrors.appointmentDate ? 'border-red-500' : ''}
                  />
                  {formErrors.appointmentDate && <p className="text-sm text-red-500 mt-1">{formErrors.appointmentDate}</p>}
                </div>
                <div>
                  <Label htmlFor="appointmentTime">Time *</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => {
                      setFormData({ ...formData, appointmentTime: e.target.value });
                      if (formErrors.appointmentTime) setFormErrors({ ...formErrors, appointmentTime: '' });
                    }}
                    className={formErrors.appointmentTime ? 'border-red-500' : ''}
                  />
                  {formErrors.appointmentTime && <p className="text-sm text-red-500 mt-1">{formErrors.appointmentTime}</p>}
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({ ...formData, type: e.target.value });
                      if (formErrors.type) setFormErrors({ ...formErrors, type: '' });
                    }}
                    placeholder="Consultation, Checkup, etc."
                    className={formErrors.type ? 'border-red-500' : ''}
                  />
                  {formErrors.type && <p className="text-sm text-red-500 mt-1">{formErrors.type}</p>}
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.today}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>List of all appointments</CardDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="From Date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-40"
                />
                <Input
                  type="date"
                  placeholder="To Date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-40"
                />
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No appointments found</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{getPatientName(appointment.patient_id)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {appointment.appointmentTime}
                          </div>
                        </TableCell>
                        <TableCell>{appointment.type}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(appointment)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setAppointmentToDelete(appointment);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} appointments
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={currentPage >= totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Appointment</DialogTitle>
              <DialogDescription>Update appointment information</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-patient_id">Patient *</Label>
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, patient_id: value });
                    if (formErrors.patient_id) setFormErrors({ ...formErrors, patient_id: '' });
                  }}
                >
                  <SelectTrigger className={formErrors.patient_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.patient_id && <p className="text-sm text-red-500 mt-1">{formErrors.patient_id}</p>}
              </div>
              <div>
                <Label htmlFor="edit-appointmentDate">Date *</Label>
                <Input
                  id="edit-appointmentDate"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => {
                    setFormData({ ...formData, appointmentDate: e.target.value });
                    if (formErrors.appointmentDate) setFormErrors({ ...formErrors, appointmentDate: '' });
                  }}
                  className={formErrors.appointmentDate ? 'border-red-500' : ''}
                />
                {formErrors.appointmentDate && <p className="text-sm text-red-500 mt-1">{formErrors.appointmentDate}</p>}
              </div>
              <div>
                <Label htmlFor="edit-appointmentTime">Time *</Label>
                <Input
                  id="edit-appointmentTime"
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) => {
                    setFormData({ ...formData, appointmentTime: e.target.value });
                    if (formErrors.appointmentTime) setFormErrors({ ...formErrors, appointmentTime: '' });
                  }}
                  className={formErrors.appointmentTime ? 'border-red-500' : ''}
                />
                {formErrors.appointmentTime && <p className="text-sm text-red-500 mt-1">{formErrors.appointmentTime}</p>}
              </div>
              <div>
                <Label htmlFor="edit-type">Type *</Label>
                <Input
                  id="edit-type"
                  value={formData.type}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value });
                    if (formErrors.type) setFormErrors({ ...formErrors, type: '' });
                  }}
                  className={formErrors.type ? 'border-red-500' : ''}
                />
                {formErrors.type && <p className="text-sm text-red-500 mt-1">{formErrors.type}</p>}
              </div>
              <div>
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-reason">Reason</Label>
                <Input
                  id="edit-reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Appointment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

