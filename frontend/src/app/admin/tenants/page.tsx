"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/contexts/AuthContext";
import { apiService } from "@/src/services/ApiService";
import { DashboardLayout } from "../../../components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/src/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
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

interface TenantDetails extends Omit<Tenant, 'subscription'> {
  subscription?: {
    id: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
    plan: {
      id: string;
      name: string;
      description: string;
      planType: string;
      price: number;
      billingCycle: string;
      maxProjects: number;
      maxUsers: number;
      features: string[];
      modules: string[];
    };
  };
  users: Array<{
    id: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    userRole: string;
    isActive: boolean;
    createdAt: string;
    lastLogin: string | null;
  }>;
  statistics: {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    totalCustomers: number;
    totalInvoices: number;
    storageUsed: number;
    lastActivity: string;
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
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetails | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  const fetchTenantDetails = async (tenantId: string) => {
    try {
      const response = await apiService.get(`/admin/tenants/${tenantId}`);
      setSelectedTenant(response);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Error fetching tenant details:", error);
    }
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
      
      // Update stats
      fetchAdminStats();
    } catch (error) {
      console.error("Error updating tenant status:", error);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && tenant.isActive) ||
      (statusFilter === "inactive" && !tenant.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tenants...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tenant Management</h1>
          <p className="text-gray-600">Manage all tenants in the system</p>
        </div>

        {/* Admin Stats */}
        {adminStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  {adminStats.users.tenantAssigned} tenant users, {adminStats.users.systemUsers} system users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminStats.subscriptions.active}</div>
                <p className="text-xs text-muted-foreground">
                  {adminStats.subscriptions.inactive} inactive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {adminStats.planDistribution.reduce((sum, plan) => sum + plan.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {adminStats.planDistribution.length} plan types
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
              <SelectItem value="all">All Tenants</SelectItem>
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
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {tenant.domain || "No domain set"}
                    </CardDescription>
                  </div>
                  <Badge variant={tenant.isActive ? "default" : "secondary"}>
                    {tenant.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tenant.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {tenant.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      {tenant.userCount} users
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(tenant.createdAt)}
                    </div>
                  </div>

                  {tenant.subscription && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{tenant.subscription.plan.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(tenant.subscription.plan.price)}/{tenant.subscription.plan.billingCycle}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {tenant.subscription.plan.planType}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchTenantDetails(tenant.id)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTenantStatus(tenant.id, tenant.isActive)}
                      className="px-3"
                    >
                      {tenant.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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

        {/* Tenant Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedTenant?.name} - Detailed Information
              </DialogTitle>
              <DialogDescription>
                Complete information about this tenant and its usage
              </DialogDescription>
            </DialogHeader>

            {selectedTenant && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="subscription">Subscription</TabsTrigger>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <p className="text-sm">{selectedTenant.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Domain</label>
                          <p className="text-sm">{selectedTenant.domain || "Not set"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <Badge variant={selectedTenant.isActive ? "default" : "secondary"}>
                            {selectedTenant.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Created</label>
                          <p className="text-sm">{formatDate(selectedTenant.createdAt)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Last Updated</label>
                          <p className="text-sm">{formatDate(selectedTenant.updatedAt)}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          {selectedTenant.description || "No description provided"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Users ({selectedTenant.users.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedTenant.users.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium text-sm">
                                {user.firstName} {user.lastName} ({user.userName})
                              </p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-500">Role: {user.userRole}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                Joined: {formatDate(user.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="subscription" className="space-y-4">
                  {selectedTenant.subscription ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Subscription Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Plan</label>
                            <p className="text-sm font-medium">{selectedTenant.subscription.plan.name}</p>
                            <p className="text-xs text-gray-500">{selectedTenant.subscription.plan.description}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Type</label>
                            <Badge variant="outline">{selectedTenant.subscription.plan.planType}</Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Price</label>
                            <p className="text-sm">
                              {formatCurrency(selectedTenant.subscription.plan.price)}/{selectedTenant.subscription.plan.billingCycle}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <Badge variant={selectedTenant.subscription.isActive ? "default" : "secondary"}>
                              {selectedTenant.subscription.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Start Date</label>
                            <p className="text-sm">{formatDate(selectedTenant.subscription.startDate)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">End Date</label>
                            <p className="text-sm">{formatDate(selectedTenant.subscription.endDate)}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Features</label>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {selectedTenant.subscription.plan.features?.map((feature: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Subscription</h3>
                        <p className="text-gray-500">This tenant doesn't have an active subscription.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="statistics" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Users</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTenant.statistics.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                          {selectedTenant.statistics.activeUsers} active
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Projects</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTenant.statistics.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">Total projects</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Customers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTenant.statistics.totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">Total customers</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Invoices</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTenant.statistics.totalInvoices}</div>
                        <p className="text-xs text-muted-foreground">Total invoices</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Storage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTenant.statistics.storageUsed} MB</div>
                        <p className="text-xs text-muted-foreground">Storage used</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Last Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm font-medium">{formatDate(selectedTenant.statistics.lastActivity)}</div>
                        <p className="text-xs text-muted-foreground">Most recent activity</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}
