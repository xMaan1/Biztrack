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
  CheckCircle,
  X,
} from 'lucide-react';
import {
  LabReport,
  LabReportCreate,
  LabReportStats,
  Patient,
  labReportService,
  patientService,
} from '@/src/services/HealthcareService';
import { apiService } from '@/src/services/ApiService';
import { DashboardLayout } from '../../components/layout';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/src/utils/errorUtils';

export default function LabReportsPage() {
  return (
    <ModuleGuard module="crm" fallback={<div>You don't have access to this module</div>}>
      <LabReportsContent />
    </ModuleGuard>
  );
}

function LabReportsContent() {
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [stats, setStats] = useState<LabReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [testCategoryFilter, setTestCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isVerifiedFilter, setIsVerifiedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [labReportToDelete, setLabReportToDelete] = useState<LabReport | null>(null);
  const [selectedLabReport, setSelectedLabReport] = useState<LabReport | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Array<{testName: string; value: string; unit: string; referenceRange: string; status: string}>>([]);
  const [formData, setFormData] = useState<LabReportCreate>({
    patient_id: '',
    reportNumber: '',
    reportDate: '',
    orderedBy: '',
    testName: '',
    testCategory: '',
    testResults: [],
    labName: '',
    labAddress: '',
    technicianName: '',
    notes: '',
    attachments: [],
    isVerified: false,
  });

  const testCategories = ['Blood Test', 'Urine Test', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Biopsy', 'Culture', 'Other'];
  const testStatuses = ['Normal', 'Abnormal', 'Critical', 'Pending'];

  const itemsPerPage = 10;

  useEffect(() => {
    loadLabReports();
    loadStats();
    loadPatients();
    loadDoctors();
  }, [currentPage, patientFilter, doctorFilter, testCategoryFilter, dateFrom, dateTo, isVerifiedFilter]);

  const loadLabReports = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await labReportService.getLabReports(
        skip,
        itemsPerPage,
        patientFilter === 'all' ? undefined : patientFilter,
        doctorFilter === 'all' ? undefined : doctorFilter,
        testCategoryFilter === 'all' ? undefined : testCategoryFilter,
        dateFrom || undefined,
        dateTo || undefined,
        isVerifiedFilter === 'all' ? undefined : isVerifiedFilter === 'verified',
      );
      setLabReports(response.labReports);
      setTotalCount(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load lab reports'));
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
      setDoctors(response.users || []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await labReportService.getLabReportStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.patient_id) errors.patient_id = 'Patient is required';
    if (!formData.reportNumber) errors.reportNumber = 'Report number is required';
    if (!formData.reportDate) errors.reportDate = 'Report date is required';
    if (!formData.orderedBy) errors.orderedBy = 'Ordered by is required';
    if (!formData.testName) errors.testName = 'Test name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    try {
      const dataToSend = {
        ...formData,
        testResults: testResults,
      };
      await labReportService.createLabReport(dataToSend);
      toast.success('Lab report created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      loadLabReports();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to create lab report'));
    }
  };

  const handleUpdate = async () => {
    if (!selectedLabReport) return;
    if (!validateForm()) {
      toast.error('Please fix form errors');
      return;
    }
    try {
      const dataToSend = {
        ...formData,
        testResults: testResults,
      };
      await labReportService.updateLabReport(selectedLabReport.id, dataToSend);
      toast.success('Lab report updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      loadLabReports();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to update lab report'));
    }
  };

  const handleDelete = async () => {
    if (!labReportToDelete) return;
    try {
      await labReportService.deleteLabReport(labReportToDelete.id);
      toast.success('Lab report deleted successfully');
      setIsDeleteDialogOpen(false);
      setLabReportToDelete(null);
      loadLabReports();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to delete lab report'));
    }
  };

  const handleVerify = async (labReport: LabReport) => {
    try {
      await labReportService.verifyLabReport(labReport.id);
      toast.success('Lab report verified successfully');
      loadLabReports();
      loadStats();
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to verify lab report'));
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      reportNumber: '',
      reportDate: '',
      orderedBy: '',
      testName: '',
      testCategory: '',
      testResults: [],
      labName: '',
      labAddress: '',
      technicianName: '',
      notes: '',
      attachments: [],
      isVerified: false,
    });
    setTestResults([]);
    setSelectedLabReport(null);
    setFormErrors({});
  };

  const openEditDialog = (labReport: LabReport) => {
    setSelectedLabReport(labReport);
    setFormData({
      patient_id: labReport.patient_id,
      appointment_id: labReport.appointment_id,
      reportNumber: labReport.reportNumber,
      reportDate: labReport.reportDate,
      orderedBy: labReport.orderedBy,
      testName: labReport.testName,
      testCategory: labReport.testCategory || '',
      testResults: labReport.testResults || [],
      labName: labReport.labName || '',
      labAddress: labReport.labAddress || '',
      technicianName: labReport.technicianName || '',
      notes: labReport.notes || '',
      attachments: labReport.attachments || [],
      isVerified: labReport.isVerified,
    });
    setTestResults(labReport.testResults || []);
    setIsEditDialogOpen(true);
  };

  const addTestResult = () => {
    setTestResults([...testResults, { testName: '', value: '', unit: '', referenceRange: '', status: 'Normal' }]);
  };

  const removeTestResult = (index: number) => {
    setTestResults(testResults.filter((_, i) => i !== index));
  };

  const updateTestResult = (index: number, field: string, value: string) => {
    const updated = [...testResults];
    updated[index] = { ...updated[index], [field]: value };
    setTestResults(updated);
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email : 'Unknown';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lab Reports</h1>
            <p className="text-gray-600">Manage laboratory test reports</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                New Lab Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Lab Report</DialogTitle>
                <DialogDescription>Create a new lab report</DialogDescription>
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
                  <Label htmlFor="reportNumber">Report Number *</Label>
                  <Input
                    id="reportNumber"
                    value={formData.reportNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, reportNumber: e.target.value });
                      if (formErrors.reportNumber) setFormErrors({ ...formErrors, reportNumber: '' });
                    }}
                    className={formErrors.reportNumber ? 'border-red-500' : ''}
                  />
                  {formErrors.reportNumber && <p className="text-sm text-red-500 mt-1">{formErrors.reportNumber}</p>}
                </div>
                <div>
                  <Label htmlFor="reportDate">Report Date *</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => {
                      setFormData({ ...formData, reportDate: e.target.value });
                      if (formErrors.reportDate) setFormErrors({ ...formErrors, reportDate: '' });
                    }}
                    className={formErrors.reportDate ? 'border-red-500' : ''}
                  />
                  {formErrors.reportDate && <p className="text-sm text-red-500 mt-1">{formErrors.reportDate}</p>}
                </div>
                <div className="col-span-2">
                  <Label htmlFor="orderedBy">Ordered By *</Label>
                  <Select
                    value={formData.orderedBy}
                    onValueChange={(value) => {
                      setFormData({ ...formData, orderedBy: value });
                      if (formErrors.orderedBy) setFormErrors({ ...formErrors, orderedBy: '' });
                    }}
                  >
                    <SelectTrigger className={formErrors.orderedBy ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.firstName || doctor.lastName ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() : doctor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.orderedBy && <p className="text-sm text-red-500 mt-1">{formErrors.orderedBy}</p>}
                </div>
                <div>
                  <Label htmlFor="testName">Test Name *</Label>
                  <Input
                    id="testName"
                    value={formData.testName}
                    onChange={(e) => {
                      setFormData({ ...formData, testName: e.target.value });
                      if (formErrors.testName) setFormErrors({ ...formErrors, testName: '' });
                    }}
                    className={formErrors.testName ? 'border-red-500' : ''}
                  />
                  {formErrors.testName && <p className="text-sm text-red-500 mt-1">{formErrors.testName}</p>}
                </div>
                <div>
                  <Label htmlFor="testCategory">Test Category</Label>
                  <Select
                    value={formData.testCategory}
                    onValueChange={(value) => setFormData({ ...formData, testCategory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {testCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Test Results</Label>
                  <div className="space-y-2 border rounded-lg p-4">
                    {testResults.map((result, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-3">
                          <Input
                            placeholder="Test Name"
                            value={result.testName}
                            onChange={(e) => updateTestResult(index, 'testName', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Value"
                            value={result.value}
                            onChange={(e) => updateTestResult(index, 'value', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Unit"
                            value={result.unit}
                            onChange={(e) => updateTestResult(index, 'unit', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Reference Range"
                            value={result.referenceRange}
                            onChange={(e) => updateTestResult(index, 'referenceRange', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Select
                            value={result.status}
                            onValueChange={(value) => updateTestResult(index, 'status', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {testStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTestResult(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addTestResult} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Test Result
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="labName">Lab Name</Label>
                  <Input
                    id="labName"
                    value={formData.labName}
                    onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="technicianName">Technician Name</Label>
                  <Input
                    id="technicianName"
                    value={formData.technicianName}
                    onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="labAddress">Lab Address</Label>
                  <Textarea
                    id="labAddress"
                    value={formData.labAddress}
                    onChange={(e) => setFormData({ ...formData, labAddress: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
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
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Unverified</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.unverified}</div>
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
                <CardTitle className="text-sm font-medium">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Lab Reports</CardTitle>
                <CardDescription>List of all lab reports</CardDescription>
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
                      <SelectItem key={patient.id} value={patient.id}>
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
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.firstName || doctor.lastName ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() : doctor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={testCategoryFilter}
                  onValueChange={(value) => {
                    setTestCategoryFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {testCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={isVerifiedFilter}
                  onValueChange={(value) => {
                    setIsVerifiedFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
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
            ) : labReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No lab reports found</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Ordered By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.reportNumber}</TableCell>
                        <TableCell>{getPatientName(report.patient_id)}</TableCell>
                        <TableCell>{report.testName}</TableCell>
                        <TableCell>{report.testCategory || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(report.reportDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{getDoctorName(report.orderedBy)}</TableCell>
                        <TableCell>
                          {report.isVerified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Unverified</Badge>
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
                              <DropdownMenuItem onClick={() => openEditDialog(report)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {!report.isVerified && (
                                <DropdownMenuItem onClick={() => handleVerify(report)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Verify
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setLabReportToDelete(report);
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} reports
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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lab Report</DialogTitle>
              <DialogDescription>Update lab report details</DialogDescription>
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
                        {patient.firstName} {patient.lastName} ({patient.patientId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.patient_id && <p className="text-sm text-red-500 mt-1">{formErrors.patient_id}</p>}
              </div>
              <div>
                <Label htmlFor="edit-reportNumber">Report Number *</Label>
                <Input
                  id="edit-reportNumber"
                  value={formData.reportNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, reportNumber: e.target.value });
                    if (formErrors.reportNumber) setFormErrors({ ...formErrors, reportNumber: '' });
                  }}
                  className={formErrors.reportNumber ? 'border-red-500' : ''}
                />
                {formErrors.reportNumber && <p className="text-sm text-red-500 mt-1">{formErrors.reportNumber}</p>}
              </div>
              <div>
                <Label htmlFor="edit-reportDate">Report Date *</Label>
                <Input
                  id="edit-reportDate"
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => {
                    setFormData({ ...formData, reportDate: e.target.value });
                    if (formErrors.reportDate) setFormErrors({ ...formErrors, reportDate: '' });
                  }}
                  className={formErrors.reportDate ? 'border-red-500' : ''}
                />
                {formErrors.reportDate && <p className="text-sm text-red-500 mt-1">{formErrors.reportDate}</p>}
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-orderedBy">Ordered By *</Label>
                <Select
                  value={formData.orderedBy}
                  onValueChange={(value) => {
                    setFormData({ ...formData, orderedBy: value });
                    if (formErrors.orderedBy) setFormErrors({ ...formErrors, orderedBy: '' });
                  }}
                >
                  <SelectTrigger className={formErrors.orderedBy ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.firstName || doctor.lastName ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() : doctor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.orderedBy && <p className="text-sm text-red-500 mt-1">{formErrors.orderedBy}</p>}
              </div>
              <div>
                <Label htmlFor="edit-testName">Test Name *</Label>
                <Input
                  id="edit-testName"
                  value={formData.testName}
                  onChange={(e) => {
                    setFormData({ ...formData, testName: e.target.value });
                    if (formErrors.testName) setFormErrors({ ...formErrors, testName: '' });
                  }}
                  className={formErrors.testName ? 'border-red-500' : ''}
                />
                {formErrors.testName && <p className="text-sm text-red-500 mt-1">{formErrors.testName}</p>}
              </div>
              <div>
                <Label htmlFor="edit-testCategory">Test Category</Label>
                <Select
                  value={formData.testCategory}
                  onValueChange={(value) => setFormData({ ...formData, testCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {testCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Test Results</Label>
                <div className="space-y-2 border rounded-lg p-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-3">
                        <Input
                          placeholder="Test Name"
                          value={result.testName}
                          onChange={(e) => updateTestResult(index, 'testName', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Value"
                          value={result.value}
                          onChange={(e) => updateTestResult(index, 'value', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Unit"
                          value={result.unit}
                          onChange={(e) => updateTestResult(index, 'unit', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Reference Range"
                          value={result.referenceRange}
                          onChange={(e) => updateTestResult(index, 'referenceRange', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={result.status}
                          onValueChange={(value) => updateTestResult(index, 'status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {testStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestResult(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addTestResult} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Test Result
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-labName">Lab Name</Label>
                <Input
                  id="edit-labName"
                  value={formData.labName}
                  onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-technicianName">Technician Name</Label>
                <Input
                  id="edit-technicianName"
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-labAddress">Lab Address</Label>
                <Textarea
                  id="edit-labAddress"
                  value={formData.labAddress}
                  onChange={(e) => setFormData({ ...formData, labAddress: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
              <DialogTitle>Delete Lab Report</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this lab report? This action cannot be undone.
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

