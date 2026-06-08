'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/src/services/ApiService';
import motBookingService from '@/src/services/MotBookingService';
import type {
  MotBooking,
  MotBookingStats,
  MotBookingStatus,
  TenantUserOption,
  WorkOrderOption,
} from '@/src/models/workshop/MotBooking';
import type { Customer } from '@/src/services/CustomerService';
import type { Vehicle } from '@/src/models/workshop';
import type { MotBookingFiltersState, MotBookingFormData } from '@/src/components/workshop/mot-bookings/types';
import {
  applyTimeSlot,
  bookingToFormData,
  customerToFormPatch,
  defaultFilters,
  emptyMotBookingFormData,
  filterBookings,
  formDataToPayload,
  vehicleToFormPatch,
} from '@/src/components/workshop/mot-bookings/motBookingUtils';

export function useMotBookingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [bookings, setBookings] = useState<MotBooking[]>([]);
  const [stats, setStats] = useState<MotBookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<TenantUserOption[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
  const [filters, setFilters] = useState<MotBookingFiltersState>(defaultFilters());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<MotBooking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<MotBooking | null>(null);
  const [viewingBooking, setViewingBooking] = useState<MotBooking | null>(null);
  const [formData, setFormData] = useState<MotBookingFormData>(emptyMotBookingFormData());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await motBookingService.getBookings({ limit: 500 });
      setBookings(response.bookings || []);
    } catch {
      setBookings([]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await motBookingService.getStats();
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  const fetchSupportData = useCallback(async () => {
    try {
      const [usersRes, workOrdersRes] = await Promise.all([
        apiService.get('/tenants/current/users'),
        apiService.get('/work-orders?limit=500'),
      ]);
      const userList = usersRes?.data ?? usersRes ?? [];
      setUsers(Array.isArray(userList) ? userList : []);
      setWorkOrders(Array.isArray(workOrdersRes) ? workOrdersRes : []);
    } catch {
      setUsers([]);
      setWorkOrders([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchStats(), fetchSupportData()]);
      setLoading(false);
    };
    load();
  }, [fetchBookings, fetchStats, fetchSupportData]);

  const filteredBookings = useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters],
  );

  const displayTotalCount = filteredBookings.length;

  const openNewBookingDialog = useCallback(() => {
    setEditingBooking(null);
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setFormData(emptyMotBookingFormData());
    setIsDialogOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get('openAdd') !== 'true') return;
    openNewBookingDialog();
    const params = new URLSearchParams(searchParams.toString());
    params.delete('openAdd');
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/workshop-management/mot-bookings?${nextQuery}` : '/workshop-management/mot-bookings');
  }, [searchParams, router, openNewBookingDialog]);

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setEditingBooking(null);
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      setFormData(emptyMotBookingFormData());
    }
    setIsDialogOpen(open);
  }, []);

  const handleCustomerSelect = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({ ...prev, ...customerToFormPatch(customer) }));
  }, []);

  const handleVehicleSelect = useCallback((vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
    setFormData((prev) => ({ ...prev, ...vehicleToFormPatch(vehicle) }));
  }, []);

  const handleTimeSlotChange = useCallback((slotKey: string) => {
    setFormData((prev) => applyTimeSlot(prev, slotKey));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!formData.customerId && !formData.customerName.trim()) return;
      setSaving(true);
      const payload = formDataToPayload(formData);
      try {
        if (editingBooking?.id) {
          await motBookingService.updateBooking(editingBooking.id, payload);
        } else {
          await motBookingService.createBooking(payload);
        }
        setIsDialogOpen(false);
        setEditingBooking(null);
        setSelectedCustomer(null);
        setSelectedVehicle(null);
        setFormData(emptyMotBookingFormData());
        await Promise.all([fetchBookings(), fetchStats()]);
      } catch {
      } finally {
        setSaving(false);
      }
    },
    [editingBooking, formData, fetchBookings, fetchStats],
  );

  const handleEdit = useCallback(async (booking: MotBooking) => {
    setViewingBooking(null);
    setEditingBooking(booking);
    setFormData(bookingToFormData(booking));
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    if (booking.customer_id) {
      try {
        const customer = await apiService.get(`/invoices/customers/${booking.customer_id}`);
        setSelectedCustomer(customer);
      } catch {
        setSelectedCustomer(null);
      }
    }
    if (booking.vehicle_id) {
      try {
        const vehicle = await apiService.get(`/vehicles/${booking.vehicle_id}`);
        setSelectedVehicle(vehicle);
      } catch {
        setSelectedVehicle(null);
      }
    }
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((booking: MotBooking) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setBookingToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!bookingToDelete) return;
    try {
      await motBookingService.deleteBooking(bookingToDelete.id);
      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
      await Promise.all([fetchBookings(), fetchStats()]);
    } catch {
      handleDeleteCancel();
    }
  }, [bookingToDelete, fetchBookings, fetchStats, handleDeleteCancel]);

  const handleStatusChange = useCallback(
    async (booking: MotBooking, status: MotBookingStatus) => {
      try {
        await motBookingService.updateBookingStatus(booking.id, { status });
        await Promise.all([fetchBookings(), fetchStats()]);
      } catch {
      }
    },
    [fetchBookings, fetchStats],
  );

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters());
  }, []);

  return {
    loading,
    saving,
    bookings,
    filteredBookings,
    totalCount: displayTotalCount,
    stats,
    users,
    workOrders,
    filters,
    setFilters,
    isDialogOpen,
    isDeleteDialogOpen,
    editingBooking,
    bookingToDelete,
    viewingBooking,
    formData,
    setFormData,
    selectedCustomer,
    selectedVehicle,
    openNewBookingDialog,
    handleDialogClose,
    handleCustomerSelect,
    handleVehicleSelect,
    handleTimeSlotChange,
    handleSubmit,
    handleEdit,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleStatusChange,
    setViewingBooking,
    clearFilters,
  };
}
