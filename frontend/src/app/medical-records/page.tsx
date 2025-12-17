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
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  Lock,
} from 'lucide-react';
import {
  MedicalRecord,
  MedicalRecordCreate,
  MedicalRecordStats,
  Patient,
  medicalRecordService,
  patientService,
} from '@/src/services/HealthcareService';
import { apiService } from '@/src/services/ApiService';
import { DashboardLayout } from '../../components/layout';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/src/utils/errorUtils';

export default function MedicalRecordsPage() {
  return (
    <ModuleGuard module="crm" fallback={<div>You don't have access to this module</div>}>
      <MedicalRecordsContent />
    </ModuleGuard>
  );
}

function MedicalRecordsContent() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [stats, setStats] = useState<MedicalRecordStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<MedicalRecordCreate>({
    patient_id: '',
    recordType: '',
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    medications: [],
    vitalSigns: {},
    labResults: {},
    attachments: [],
    visitDate: '',
    doctorId: '',
    isConfidential: false,
  });

  const recordTypes = [
    'Consultation',
    'Diagnosis',
    'Treatment',
    'Lab Report',
    'X-Ray',
    'Prescription',
    'Surgery',
    'Follow-up',
    'Other',
  ];

  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadRecords();
    loadStats();
    loadPatients();
    loadDoctors();
  }, [currentPage, recordTypeFilter, debouncedSearchTerm]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await medicalRecordService.getMedicalRecords(
        skip,
        itemsPerPage,
        debouncedSearchTerm || undefined,
        recordTypeFilter === 'all' ? undefined : recordTypeFilter,
      );
      setRecords(response.records);
      setTotalCount(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load medical records'));
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
      const validDoctors = users.filter(d => {
        const doctorId = d.id || d.userId;
        return doctorId && doctorId !== 'undefined' && doctorId !== 'null' && String(doctorId).trim() !== '';
      });
      setDoctors(validDoctors);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await medicalRecordService.getMedicalRecordStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.patient_id) errors.patient_id = 'Patient is required';
    if (!formData.recordType) errors.recordType = 'Record type is required';
    if (!formData.title) errors.title = 'Title is required';
    if (!formData.visitDate) errors.visitDate = 'Visit date is required';
    if (!formData.doctorId || formData.doctorId === '' || formData.doctorId === 'undefined' || formData.doctorId === 'null') {
      errors.doctorId = 'Doctor is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    
    const payload = {
      ...formData,
      doctorId: formData.doctorId && formData.doctorId !== 'undefined' && formData.doctorId !== 'null' ? formData.doctorId : undefined,
    };
    
    if (!payload.doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    
    try {
      await medicalRecordService.createMedicalRecord(payload);
      toast.success('Medical record created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadRecords();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to create medical record'));
    }
  };

  const handleUpdate = async () => {
    if (!selectedRecord) return;
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    
    const payload = {
      ...formData,
      doctorId: formData.doctorId && formData.doctorId !== 'undefined' && formData.doctorId !== 'null' ? formData.doctorId : undefined,
    };
    
    if (!payload.doctorId) {
      toast.error('Please select a doctor');
      return;
    }
    
    try {
      await medicalRecordService.updateMedicalRecord(selectedRecord.id, payload);
      toast.success('Medical record updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadRecords();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update medical record'));
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await medicalRecordService.deleteMedicalRecord(recordToDelete.id);
      toast.success('Medical record deleted successfully');
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
      loadRecords();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete medical record'));
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      recordType: '',
      title: '',
      description: '',
      diagnosis: '',
      treatment: '',
      medications: [],
      vitalSigns: {},
      labResults: {},
      attachments: [],
      visitDate: '',
      doctorId: '',
      isConfidential: false,
    });
    setSelectedRecord(null);
    setFormErrors({});
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => String(d.id || d.userId) === String(doctorId));
    return doctor ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email : 'Unknown';
  };

  const openEditDialog = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setFormData({
      patient_id: record.patient_id,
      recordType: record.recordType,
      title: record.title,
      description: record.description || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      medications: record.medications || [],
      vitalSigns: record.vitalSigns || {},
      labResults: record.labResults || {},
      attachments: record.attachments || [],
      visitDate: record.visitDate,
      doctorId: record.doctorId ? String(record.doctorId) : '',
      isConfidential: record.isConfidential || false,
    });
    setIsEditDialogOpen(true);
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
            <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
            <p className="text-gray-600">Manage patient medical records</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Medical Record</DialogTitle>
                <DialogDescription>Add a new medical record for a patient</DialogDescription>
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
                  <Label htmlFor="recordType">Record Type *</Label>
                  <Select
                    value={formData.recordType}
                    onValueChange={(value) => {
                      setFormData({ ...formData, recordType: value });
                      if (formErrors.recordType) setFormErrors({ ...formErrors, recordType: '' });
                    }}
                  >
                    <SelectTrigger className={formErrors.recordType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {recordTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.recordType && <p className="text-sm text-red-500 mt-1">{formErrors.recordType}</p>}
                </div>
                <div>
                  <Label htmlFor="visitDate">Visit Date *</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => {
                      setFormData({ ...formData, visitDate: e.target.value });
                      if (formErrors.visitDate) setFormErrors({ ...formErrors, visitDate: '' });
                    }}
                    className={formErrors.visitDate ? 'border-red-500' : ''}
                  />
                  {formErrors.visitDate && <p className="text-sm text-red-500 mt-1">{formErrors.visitDate}</p>}
                </div>
                <div className="col-span-2">
                  <Label htmlFor="doctorId">Doctor *</Label>
                  <Select
                    value={formData.doctorId && formData.doctorId !== 'undefined' && formData.doctorId !== 'null' ? formData.doctorId : ''}
                    onValueChange={(value) => {
                      if (value && value !== 'undefined' && value !== 'null') {
                        setFormData({ ...formData, doctorId: value });
                        if (formErrors.doctorId) setFormErrors({ ...formErrors, doctorId: '' });
                      } else {
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
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                    }}
                    placeholder="Record title"
                    className={formErrors.title ? 'border-red-500' : ''}
                  />
                  {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Record description"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Input
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) =>
                      setFormData({ ...formData, diagnosis: e.target.value })
                    }
                    placeholder="Diagnosis details"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="treatment">Treatment</Label>
                  <Input
                    id="treatment"
                    value={formData.treatment}
                    onChange={(e) =>
                      setFormData({ ...formData, treatment: e.target.value })
                    }
                    placeholder="Treatment details"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isConfidential"
                      checked={formData.isConfidential}
                      onChange={(e) =>
                        setFormData({ ...formData, isConfidential: e.target.checked })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="isConfidential">Confidential Record</Label>
                  </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">By Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span>{type}</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>List of all medical records</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Select
                  value={recordTypeFilter}
                  onValueChange={(value) => {
                    setRecordTypeFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {recordTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No medical records found</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Visit Date</TableHead>
                      <TableHead>Confidential</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{getPatientName(record.patient_id)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.recordType}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{record.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(record.visitDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.isConfidential ? (
                            <Badge className="bg-red-100 text-red-800">
                              <Lock className="w-3 h-3 mr-1" />
                              Confidential
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(record)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setRecordToDelete(record);
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Medical Record</DialogTitle>
              <DialogDescription>Update medical record information</DialogDescription>
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
                <Label htmlFor="edit-recordType">Record Type *</Label>
                <Select
                  value={formData.recordType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, recordType: value });
                    if (formErrors.recordType) setFormErrors({ ...formErrors, recordType: '' });
                  }}
                >
                  <SelectTrigger className={formErrors.recordType ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recordTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.recordType && <p className="text-sm text-red-500 mt-1">{formErrors.recordType}</p>}
              </div>
              <div>
                <Label htmlFor="edit-visitDate">Visit Date *</Label>
                <Input
                  id="edit-visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => {
                    setFormData({ ...formData, visitDate: e.target.value });
                    if (formErrors.visitDate) setFormErrors({ ...formErrors, visitDate: '' });
                  }}
                  className={formErrors.visitDate ? 'border-red-500' : ''}
                />
                {formErrors.visitDate && <p className="text-sm text-red-500 mt-1">{formErrors.visitDate}</p>}
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-doctorId">Doctor *</Label>
                <Select
                  value={formData.doctorId && formData.doctorId !== 'undefined' && formData.doctorId !== 'null' ? formData.doctorId : ''}
                  onValueChange={(value) => {
                    if (value && value !== 'undefined' && value !== 'null') {
                      setFormData({ ...formData, doctorId: value });
                      if (formErrors.doctorId) setFormErrors({ ...formErrors, doctorId: '' });
                    } else {
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
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                  }}
                  className={formErrors.title ? 'border-red-500' : ''}
                />
                {formErrors.title && <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>}
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-diagnosis">Diagnosis</Label>
                <Input
                  id="edit-diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-treatment">Treatment</Label>
                <Input
                  id="edit-treatment"
                  value={formData.treatment}
                  onChange={(e) =>
                    setFormData({ ...formData, treatment: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isConfidential"
                    checked={formData.isConfidential}
                    onChange={(e) =>
                      setFormData({ ...formData, isConfidential: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="edit-isConfidential">Confidential Record</Label>
                </div>
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
              <DialogTitle>Delete Medical Record</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this medical record? This action cannot be undone.
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

