'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/src/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { ArrowLeft, Calendar, FileText, Download } from 'lucide-react';
import Link from 'next/link';
import healthcareService from '@/src/services/HealthcareService';
import type { PatientHistoryResponse, Appointment, Prescription, PrescriptionItem } from '@/src/models/healthcare';
import { toast } from 'sonner';

export default function PatientHistoryPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<PatientHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await healthcareService.getPatientHistory(id);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Failed to load patient history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDownloadPrescription = async (prescriptionId: string) => {
    try {
      const blob = await healthcareService.getPrescriptionDownload(prescriptionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescriptionId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to download');
    }
  };

  const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString() : '—');
  const doctorName = (a: Appointment) =>
    [a.doctor_first_name, a.doctor_last_name].filter(Boolean).join(' ') || '—';
  const prescriptionItemsSummary = (items: PrescriptionItem[] | undefined) => {
    if (!items?.length) return '—';
    return items
      .slice(0, 3)
      .map((i) => {
        if (i.type === 'medicine' && i.medicine_name) return i.medicine_name;
        if (i.type === 'vitals' && i.vital_name) return i.vital_name;
        if (i.type === 'test' && i.test_name) return i.test_name;
        return null;
      })
      .filter(Boolean)
      .join(', ') + (items.length > 3 ? '…' : '');
  };

  if (!id) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <p className="text-gray-600">Invalid patient.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/healthcare/patients">Back to Patients</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/healthcare/patients" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Patients
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading patient history...</div>
        ) : !data ? (
          <div className="py-12 text-center text-gray-500">Patient not found.</div>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Patient</CardTitle>
                <CardDescription>Basic information</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full name</p>
                  <p className="text-gray-900">{data.patient.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-gray-900">{data.patient.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{data.patient.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of birth</p>
                  <p className="text-gray-900">{data.patient.date_of_birth ? formatDate(data.patient.date_of_birth) : '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-gray-900">{data.patient.address || '—'}</p>
                </div>
                {data.patient.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-gray-900">{data.patient.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Appointments
                  </CardTitle>
                  <CardDescription>
                    {data.appointments.length} appointment{data.appointments.length !== 1 ? 's' : ''} for this patient
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href="/healthcare/appointments">New appointment</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {data.appointments.length === 0 ? (
                  <p className="py-6 text-center text-gray-500">No appointments yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.appointments.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{formatDate(a.appointment_date)}</TableCell>
                          <TableCell>{a.start_time} – {a.end_time}</TableCell>
                          <TableCell>{doctorName(a)}</TableCell>
                          <TableCell>{a.status}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-gray-600">{a.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Prescriptions
                  </CardTitle>
                  <CardDescription>
                    {data.prescriptions.length} prescription{data.prescriptions.length !== 1 ? 's' : ''} for this patient
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {data.prescriptions.length === 0 ? (
                  <p className="py-6 text-center text-gray-500">No prescriptions yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Appointment</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.prescriptions.map((rx: Prescription) => (
                        <TableRow key={rx.id}>
                          <TableCell>{formatDate(rx.prescription_date)}</TableCell>
                          <TableCell>
                            {[rx.doctor_first_name, rx.doctor_last_name].filter(Boolean).join(' ') || '—'}
                          </TableCell>
                          <TableCell>{rx.appointment_date ? formatDate(rx.appointment_date) : '—'}</TableCell>
                          <TableCell className="max-w-[240px] truncate text-gray-600">
                            {prescriptionItemsSummary(rx.items)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPrescription(rx.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
