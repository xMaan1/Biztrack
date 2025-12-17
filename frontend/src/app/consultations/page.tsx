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
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
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
  Consultation,
  ConsultationCreate,
  ConsultationStats,
  Patient,
  consultationService,
  patientService,
} from '@/src/services/HealthcareService';
import { apiService } from '@/src/services/ApiService';
import { DashboardLayout } from '../../components/layout';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/src/utils/errorUtils';

export default function ConsultationsPage() {
  return (
    <ModuleGuard module="crm" fallback={<div>You don't have access to this module</div>}>
      <ConsultationsContent />
    </ModuleGuard>
  );
}

function ConsultationsContent() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [stats, setStats] = useState<ConsultationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<Consultation | null>(null);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ConsultationCreate>({
    patient_id: '',
    consultationDate: '',
    consultationTime: '',
    doctorId: '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    physicalExamination: '',
    assessment: '',
    plan: '',
    prescriptions: [],
    followUpDate: '',
    followUpNotes: '',
    vitalSigns: {},
  });

  const itemsPerPage = 10;

  useEffect(() => {
    loadConsultations();
    loadStats();
    loadPatients();
    loadDoctors();
  }, [currentPage, patientFilter, doctorFilter, dateFrom, dateTo]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await consultationService.getConsultations(
        skip,
        itemsPerPage,
        patientFilter === 'all' ? undefined : patientFilter,
        doctorFilter === 'all' ? undefined : doctorFilter,
        dateFrom || undefined,
        dateTo || undefined,
      );
      setConsultations(response.consultations);
      setTotalCount(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load consultations'));
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

  const loadDoctors = async () => {
    try {
      const response = await apiService.getUsers();
      const users = response.users || [];
      console.log('[Consultation] Loaded doctors:', users);
      console.log('[Consultation] Doctor IDs:', users.map(d => ({ 
        id: d.id, 
        userId: d.userId,
        actualId: d.id || d.userId,
        name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email 
      })));
      const validDoctors = users.filter(d => {
        const doctorId = d.id || d.userId;
        return doctorId && doctorId !== 'undefined' && doctorId !== 'null' && String(doctorId).trim() !== '';
      });
      console.log('[Consultation] Valid doctors after filtering:', validDoctors.length);
      setDoctors(validDoctors); 
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await consultationService.getConsultationStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.patient_id) errors.patient_id = 'Patient is required';
    if (!formData.consultationDate) errors.consultationDate = 'Date is required';
    if (!formData.consultationTime) errors.consultationTime = 'Time is required';
    if (!formData.doctorId) errors.doctorId = 'Doctor is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    console.log('[Consultation] handleCreate called');
    console.log('[Consultation] Form data:', formData);
    
    if (!validateForm()) {
      console.log('[Consultation] Form validation failed');
      toast.error('Please fix form errors');
      return;
    }
    
    if (!formData.patient_id || !formData.doctorId || !formData.consultationDate || !formData.consultationTime) {
      console.log('[Consultation] Required fields missing');
      toast.error('Please fill in all required fields');
      return;
    }
    
    const patientId = formData.patient_id.trim();
    let doctorId = formData.doctorId.trim();
    
    if (doctorId === 'undefined' || doctorId === 'null' || !doctorId) {
      console.log('[Consultation] Doctor not selected or invalid:', doctorId);
      toast.error('Please select a valid doctor');
      setFormErrors({ ...formErrors, doctorId: 'Doctor is required' });
      return;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(patientId)) {
      console.log('[Consultation] Invalid patient ID format:', patientId);
      toast.error('Invalid patient ID format');
      return;
    }
    if (!uuidRegex.test(doctorId)) {
      console.log('[Consultation] Invalid doctor ID format:', doctorId);
      toast.error('Invalid doctor ID format. Please select a doctor from the list.');
      setFormErrors({ ...formErrors, doctorId: 'Please select a valid doctor' });
      return;
    }
    
    try {
      const payload: ConsultationCreate = {
        patient_id: patientId,
        consultationDate: formData.consultationDate,
        consultationTime: formData.consultationTime,
        doctorId: doctorId,
        chiefComplaint: formData.chiefComplaint?.trim() || undefined,
        historyOfPresentIllness: formData.historyOfPresentIllness?.trim() || undefined,
        physicalExamination: formData.physicalExamination?.trim() || undefined,
        assessment: formData.assessment?.trim() || undefined,
        plan: formData.plan?.trim() || undefined,
        prescriptions: formData.prescriptions || [],
        followUpDate: formData.followUpDate || undefined,
        followUpNotes: formData.followUpNotes?.trim() || undefined,
        vitalSigns: formData.vitalSigns || {},
      };
      console.log('[Consultation] Sending consultation payload:', JSON.stringify(payload, null, 2));
      console.log('[Consultation] Calling consultationService.createConsultation...');
      const result = await consultationService.createConsultation(payload);
      console.log('[Consultation] Success! Response:', result);
      toast.success('Consultation created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadConsultations();
      loadStats();
    } catch (error: any) {
      console.error('[Consultation] === CREATION ERROR ===');
      console.error('[Consultation] Error object:', error);
      console.error('[Consultation] Error message:', error?.message);
      console.error('[Consultation] Error response:', error?.response);
      console.error('[Consultation] Error response data:', error?.response?.data);
      console.error('[Consultation] Error response status:', error?.response?.status);
      console.error('[Consultation] Error response headers:', error?.response?.headers);
      console.error('[Consultation] Error config:', error?.config);
      if (error?.response) {
        console.error('[Consultation] Full error response:', JSON.stringify(error.response.data, null, 2));
      }
      const errorMessage = extractErrorMessage(error, 'Failed to create consultation');
      console.error('[Consultation] Extracted error message:', errorMessage);
      toast.error(errorMessage, { duration: 10000 });
    }
  };

  const handleUpdate = async () => {
    if (!selectedConsultation) return;
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    try {
      await consultationService.updateConsultation(selectedConsultation.id, formData);
      toast.success('Consultation updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadConsultations();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update consultation'));
    }
  };

  const handleDelete = async () => {
    if (!consultationToDelete) return;
    try {
      await consultationService.deleteConsultation(consultationToDelete.id);
      toast.success('Consultation deleted successfully');
      setIsDeleteDialogOpen(false);
      setConsultationToDelete(null);
      loadConsultations();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete consultation'));
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      consultationDate: '',
      consultationTime: '',
      doctorId: '',
      chiefComplaint: '',
      historyOfPresentIllness: '',
      physicalExamination: '',
      assessment: '',
      plan: '',
      prescriptions: [],
      followUpDate: '',
      followUpNotes: '',
      vitalSigns: {},
    });
    setSelectedConsultation(null);
    setFormErrors({});
  };

  const openEditDialog = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setFormData({
      patient_id: String(consultation.patient_id),
      appointment_id: consultation.appointment_id ? String(consultation.appointment_id) : undefined,
      consultationDate: consultation.consultationDate,
      consultationTime: consultation.consultationTime,
      doctorId: String(consultation.doctorId),
      chiefComplaint: consultation.chiefComplaint || '',
      historyOfPresentIllness: consultation.historyOfPresentIllness || '',
      physicalExamination: consultation.physicalExamination || '',
      assessment: consultation.assessment || '',
      plan: consultation.plan || '',
      prescriptions: consultation.prescriptions || [],
      followUpDate: consultation.followUpDate || '',
      followUpNotes: consultation.followUpNotes || '',
      vitalSigns: consultation.vitalSigns || {},
    });
    setIsEditDialogOpen(true);
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => String(d.id || d.userId) === String(doctorId));
    return doctor ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email : 'Unknown';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Doctor Consultations</h1>
            <p className="text-gray-600">Manage patient consultations</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                New Consultation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Consultation</DialogTitle>
                <DialogDescription>Create a new consultation record</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="patient_id">Patient *</Label>
                  <Select
                    value={formData.patient_id || ''}
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
                        <SelectItem key={String(patient.id)} value={String(patient.id)}>
                          {patient.firstName} {patient.lastName} ({patient.patientId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.patient_id && <p className="text-sm text-red-500 mt-1">{formErrors.patient_id}</p>}
                </div>
                <div>
                  <Label htmlFor="consultationDate">Date *</Label>
                  <Input
                    id="consultationDate"
                    type="date"
                    value={formData.consultationDate}
                    onChange={(e) => {
                      setFormData({ ...formData, consultationDate: e.target.value });
                      if (formErrors.consultationDate) setFormErrors({ ...formErrors, consultationDate: '' });
                    }}
                    className={formErrors.consultationDate ? 'border-red-500' : ''}
                  />
                  {formErrors.consultationDate && <p className="text-sm text-red-500 mt-1">{formErrors.consultationDate}</p>}
                </div>
                <div>
                  <Label htmlFor="consultationTime">Time *</Label>
                  <Input
                    id="consultationTime"
                    type="time"
                    value={formData.consultationTime}
                    onChange={(e) => {
                      setFormData({ ...formData, consultationTime: e.target.value });
                      if (formErrors.consultationTime) setFormErrors({ ...formErrors, consultationTime: '' });
                    }}
                    className={formErrors.consultationTime ? 'border-red-500' : ''}
                  />
                  {formErrors.consultationTime && <p className="text-sm text-red-500 mt-1">{formErrors.consultationTime}</p>}
                </div>
                <div className="col-span-2">
                  <Label htmlFor="doctorId">Doctor *</Label>
                  <Select
                    value={formData.doctorId && formData.doctorId !== 'undefined' && formData.doctorId !== 'null' ? formData.doctorId : ''}
                    onValueChange={(value) => {
                      console.log('[Consultation] Doctor selected:', value);
                      if (value && value !== 'undefined' && value !== 'null') {
                        setFormData({ ...formData, doctorId: value });
                        if (formErrors.doctorId) setFormErrors({ ...formErrors, doctorId: '' });
                      } else {
                        console.warn('[Consultation] Invalid doctor value selected:', value);
                        setFormData({ ...formData, doctorId: '' });
                        setFormErrors({ ...formErrors, doctorId: 'Please select a valid doctor' });
                      }
                    }}
                  >
                    <SelectTrigger className={formErrors.doctorId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.length === 0 ? (
                        <SelectItem value="no-doctors" disabled>No doctors available</SelectItem>
                      ) : (
                        doctors.map((doctor) => {
                          const doctorId = String(doctor.id || doctor.userId || '');
                          if (!doctorId || doctorId === 'undefined' || doctorId === 'null' || doctorId === '') {
                            return null;
                          }
                          return (
                            <SelectItem key={doctorId} value={doctorId}>
                              {doctor.firstName || doctor.lastName ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() : doctor.email}
                            </SelectItem>
                          );
                        }).filter(Boolean)
                      )}
                    </SelectContent>
                  </Select>
                  {formErrors.doctorId && <p className="text-sm text-red-500 mt-1">{formErrors.doctorId}</p>}
                </div>
                <div className="col-span-2">
                  <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                  <Textarea
                    id="chiefComplaint"
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="historyOfPresentIllness">History of Present Illness</Label>
                  <Textarea
                    id="historyOfPresentIllness"
                    value={formData.historyOfPresentIllness}
                    onChange={(e) => setFormData({ ...formData, historyOfPresentIllness: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="physicalExamination">Physical Examination</Label>
                  <Textarea
                    id="physicalExamination"
                    value={formData.physicalExamination}
                    onChange={(e) => setFormData({ ...formData, physicalExamination: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="assessment">Assessment</Label>
                  <Textarea
                    id="assessment"
                    value={formData.assessment}
                    onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Textarea
                    id="plan"
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="followUpNotes">Follow-up Notes</Label>
                  <Textarea
                    id="followUpNotes"
                    value={formData.followUpNotes}
                    onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[Consultation] Create button clicked');
                    handleCreate();
                  }}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.thisMonth}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Consultations</CardTitle>
                <CardDescription>List of all consultations</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select
                  value={patientFilter}
                  onValueChange={(value) => {
                    setPatientFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Patients" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Patients</SelectItem>
                      {patients.map((patient) => (
                        <SelectItem key={String(patient.id)} value={String(patient.id)}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
                <Select
                  value={doctorFilter}
                  onValueChange={(value) => {
                    setDoctorFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Doctors" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={String(doctor.id)} value={String(doctor.id)}>
                          {doctor.firstName || doctor.lastName ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() : doctor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                </Select>
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No consultations found</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Chief Complaint</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((consultation) => (
                      <TableRow key={consultation.id}>
                        <TableCell>{getPatientName(consultation.patient_id)}</TableCell>
                        <TableCell>{getDoctorName(consultation.doctorId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(consultation.consultationDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {consultation.consultationTime}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{consultation.chiefComplaint || '-'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(consultation)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setConsultationToDelete(consultation);
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} consultations
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Consultation</DialogTitle>
              <DialogDescription>Update consultation details</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-patient_id">Patient *</Label>
                <Select
                  value={formData.patient_id || ''}
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
                      <SelectItem key={String(patient.id)} value={String(patient.id)}>
                        {patient.firstName} {patient.lastName} ({patient.patientId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.patient_id && <p className="text-sm text-red-500 mt-1">{formErrors.patient_id}</p>}
              </div>
              <div>
                <Label htmlFor="edit-consultationDate">Date *</Label>
                <Input
                  id="edit-consultationDate"
                  type="date"
                  value={formData.consultationDate}
                  onChange={(e) => {
                    setFormData({ ...formData, consultationDate: e.target.value });
                    if (formErrors.consultationDate) setFormErrors({ ...formErrors, consultationDate: '' });
                  }}
                  className={formErrors.consultationDate ? 'border-red-500' : ''}
                />
                {formErrors.consultationDate && <p className="text-sm text-red-500 mt-1">{formErrors.consultationDate}</p>}
              </div>
              <div>
                <Label htmlFor="edit-consultationTime">Time *</Label>
                <Input
                  id="edit-consultationTime"
                  type="time"
                  value={formData.consultationTime}
                  onChange={(e) => {
                    setFormData({ ...formData, consultationTime: e.target.value });
                    if (formErrors.consultationTime) setFormErrors({ ...formErrors, consultationTime: '' });
                  }}
                  className={formErrors.consultationTime ? 'border-red-500' : ''}
                />
                {formErrors.consultationTime && <p className="text-sm text-red-500 mt-1">{formErrors.consultationTime}</p>}
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-doctorId">Doctor *</Label>
                <Select
                  value={formData.doctorId && formData.doctorId !== 'undefined' && formData.doctorId !== 'null' ? formData.doctorId : ''}
                  onValueChange={(value) => {
                    console.log('[Consultation] Doctor selected (edit):', value);
                    if (value && value !== 'undefined' && value !== 'null') {
                      setFormData({ ...formData, doctorId: value });
                      if (formErrors.doctorId) setFormErrors({ ...formErrors, doctorId: '' });
                    } else {
                      console.warn('[Consultation] Invalid doctor value selected (edit):', value);
                      setFormData({ ...formData, doctorId: '' });
                      setFormErrors({ ...formErrors, doctorId: 'Please select a valid doctor' });
                    }
                  }}
                >
                  <SelectTrigger className={formErrors.doctorId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.length === 0 ? (
                      <SelectItem value="no-doctors" disabled>No doctors available</SelectItem>
                    ) : (
                      doctors.map((doctor) => {
                        const doctorId = String(doctor.id || doctor.userId || '');
                        if (!doctorId || doctorId === 'undefined' || doctorId === 'null' || doctorId === '') {
                          return null;
                        }
                        return (
                          <SelectItem key={doctorId} value={doctorId}>
                            {doctor.firstName || doctor.lastName ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() : doctor.email}
                          </SelectItem>
                        );
                      }).filter(Boolean)
                    )}
                  </SelectContent>
                </Select>
                {formErrors.doctorId && <p className="text-sm text-red-500 mt-1">{formErrors.doctorId}</p>}
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-chiefComplaint">Chief Complaint</Label>
                <Textarea
                  id="edit-chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-historyOfPresentIllness">History of Present Illness</Label>
                <Textarea
                  id="edit-historyOfPresentIllness"
                  value={formData.historyOfPresentIllness}
                  onChange={(e) => setFormData({ ...formData, historyOfPresentIllness: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-physicalExamination">Physical Examination</Label>
                <Textarea
                  id="edit-physicalExamination"
                  value={formData.physicalExamination}
                  onChange={(e) => setFormData({ ...formData, physicalExamination: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-assessment">Assessment</Label>
                <Textarea
                  id="edit-assessment"
                  value={formData.assessment}
                  onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-plan">Plan</Label>
                <Textarea
                  id="edit-plan"
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-followUpDate">Follow-up Date</Label>
                <Input
                  id="edit-followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-followUpNotes">Follow-up Notes</Label>
                <Textarea
                  id="edit-followUpNotes"
                  value={formData.followUpNotes}
                  onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                  rows={2}
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
              <DialogTitle>Delete Consultation</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this consultation? This action cannot be undone.
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

