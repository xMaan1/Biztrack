"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { apiService } from "@/src/services/ApiService";
import { DashboardLayout } from "../../../components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign, 
  Activity, 
  Search, 
  Filter,
  Eye,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  TrendingUp,
  Package,
  FileText,
  CreditCard,
  Settings
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings: any;
  userCount: number;
  subscription?: {
    id: string;
    isActive: boolean;
    status: string;
    startDate: string;
    endDate: string;
    plan: {
      id: string;
      name: string;
      description: string;
      planType: string;
      price: number;
      billingCycle: string;
      features: string[];
    };
  };
}

interface AdminStats {
  tenants: {
    total: number;
    active: number;
    inactive: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    superAdmins: number;
    tenantAssigned: number;
    systemUsers: number;
  };
  subscriptions: {
    total: number;
    active: number;
    inactive: number;
  };
  planDistribution: Array<{
    planName: string;
    planType: string;
    count: number;
  }>;
}

export default function AdminTenantsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Check if user is super admin
  if (user?.userRole !== "super_admin") {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <Card className="w-96 mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
              <CardDescription className="text-center">
                You need super admin privileges to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
    fetchTenants();
    fetchAdminStats();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await apiService.get("/admin/tenants");
      setTenants(response);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const response = await apiService.get("/admin/stats");
      setAdminStats(response);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    }
  };

  const viewTenantDetails = (tenantId: string) => {
    router.push(`/admin/tenants/${tenantId}`);
  };

  const toggleTenantStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      await apiService.put(`/admin/tenants/${tenantId}/status`, {
        is_active: !currentStatus
      });
      
      // Update local state
      setTenants(prev => prev.map(tenant => 
        tenant.id === tenantId 
          ? { ...tenant, isActive: !currentStatus }
          : tenant
      ));
      
      // Update admin stats
      if (adminStats) {
        setAdminStats(prev => prev ? {
          ...prev,
          tenants: {
            ...prev.tenants,
            active: currentStatus ? prev.tenants.active - 1 : prev.tenants.active + 1,
            inactive: currentStatus ? prev.tenants.inactive + 1 : prev.tenants.inactive - 1
          }
        } : null);
      }
    } catch (error) {
      console.error("Error updating tenant status:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && tenant.isActive) ||
                         (statusFilter === "inactive" && !tenant.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tenants...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
            <p className="text-gray-600 mt-2">Manage all tenants and their subscriptions</p>
          </div>
        </div>

        {/* Statistics Cards */}
        {adminStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.tenants.total}</div>
                <p className="text-xs text-muted-foreground">
                  {adminStats.tenants.active} active, {adminStats.tenants.inactive} inactive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.users.total}</div>
                <p className="text-xs text-muted-foreground">
                  {adminStats.users.active} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.subscriptions.total}</div>
                <p className="text-xs text-muted-foreground">
                  {adminStats.subscriptions.active} active subscriptions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.planDistribution.length}</div>
                <p className="text-xs text-muted-foreground">
                  Different plan types
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tenants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  <Badge variant={tenant.isActive ? "default" : "secondary"}>
                    {tenant.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>{tenant.domain}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Users:</span>
                    <span className="font-medium">{tenant.userCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Plan:</span>
                    <span className="font-medium">
                      {tenant.subscription?.plan?.name || "No Plan"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{formatDate(tenant.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewTenantDetails(tenant.id)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTenantStatus(tenant.id, tenant.isActive)}
                    className="flex-1"
                  >
                    {tenant.isActive ? (
                      <ToggleLeft className="h-4 w-4 mr-1" />
                    ) : (
                      <ToggleRight className="h-4 w-4 mr-1" />
                    )}
                    {tenant.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No tenants have been created yet."
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}