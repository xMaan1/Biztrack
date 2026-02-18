'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ModuleGuard } from '../../../components/guards/PermissionGuard';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Plus, Search, Edit, ClipboardList } from 'lucide-react';
import { apiService } from '../../../services/ApiService';
import { DashboardLayout } from '../../../components/layout';
import { JobCard } from '../../../models/workshop';
import JobCardDialog from '../../../components/workshop/JobCardDialog';

function JobCardsContent() {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState<JobCard | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  const fetchJobCards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/job-cards?limit=500');
      setJobCards(Array.isArray(data) ? data : []);
    } catch {
      setJobCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobCards();
  }, [fetchJobCards]);

  const filtered = jobCards.filter((jc) => {
    const matchStatus = statusFilter === 'all' || jc.status === statusFilter;
    const matchSearch =
      !searchTerm ||
      jc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (jc.job_card_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (jc.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openCreate = () => {
    setSelectedJobCard(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const openEdit = (jc: JobCard) => {
    setSelectedJobCard(jc);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const formatDate = (d: string | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '–';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const vehicleSummary = (vi: Record<string, unknown> | undefined) => {
    if (!vi) return '–';
    const parts = [vi.make, vi.model, vi.year].filter(Boolean);
    return parts.length ? parts.join(' ') : '–';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="h-8 w-8" />
              Job Cards
            </h1>
            <p className="text-gray-600">Manage workshop job cards.</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Job Card
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Job Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by title, number, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-gray-500">No job cards found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Number</th>
                      <th className="text-left py-2">Title</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Customer</th>
                      <th className="text-left py-2">Vehicle</th>
                      <th className="text-left py-2">Planned</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((jc) => (
                      <tr key={jc.id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{jc.job_card_number}</td>
                        <td className="py-2">{jc.title}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(jc.status)}`}>
                            {jc.status}
                          </span>
                        </td>
                        <td className="py-2">{jc.customer_name || '–'}</td>
                        <td className="py-2">{vehicleSummary(jc.vehicle_info)}</td>
                        <td className="py-2">{formatDate(jc.planned_date)}</td>
                        <td className="py-2 text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(jc)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <JobCardDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          jobCard={selectedJobCard}
          onSuccess={fetchJobCards}
        />
      </div>
    </DashboardLayout>
  );
}

export default function JobCardsPage() {
  return (
    <ModuleGuard module="production" fallback={<div>You don&apos;t have access to this module</div>}>
      <JobCardsContent />
    </ModuleGuard>
  );
}
