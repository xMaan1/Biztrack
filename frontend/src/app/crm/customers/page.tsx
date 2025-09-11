"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

import { Separator } from "@/src/components/ui/separator";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  User,
  Building2,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  CustomerService,
  Customer,
  CustomerCreate,
  CustomerUpdate,
  CustomerStats,
} from "@/src/services/CRMService";
import { DashboardLayout } from "../../../components/layout";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [formData, setFormData] = useState<CustomerCreate>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobile: "",
    cnic: "",
    customerType: "individual",
    customerStatus: "active",
    creditLimit: 0,
    currentBalance: 0,
      paymentTerms: "Cash",
    tags: [],
  });

  const itemsPerPage = 10;

  useEffect(() => {
    loadCustomers();
    loadStats();
  }, [currentPage, searchTerm, statusFilter, typeFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await CustomerService.getCustomers(
        skip,
        itemsPerPage,
        searchTerm || undefined,
        statusFilter === "all" ? undefined : statusFilter,
        typeFilter === "all" ? undefined : typeFilter,
      );
      const customersData = response.customers || response;
      setCustomers(customersData);
      setTotalPages(
        Math.ceil((response.total || customersData.length) / itemsPerPage),
      );
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await CustomerService.getCustomerStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error("Please fill in all required fields (First Name, Last Name, Email)");
        return;
      }

      console.log("Creating customer with data:", formData);
      const result = await CustomerService.createCustomer(formData);
      console.log("Customer created successfully:", result);
      toast.success("Customer created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      loadCustomers();
      loadStats();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      await CustomerService.updateCustomer(selectedCustomer.id, formData);
      toast.success("Customer updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      loadCustomers();
      loadStats();
    } catch (error) {
      console.error("Error updating customer:", error);
      toast.error("Failed to update customer");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await CustomerService.deleteCustomer(customerId);
      toast.success("Customer deleted successfully");
      loadCustomers();
      loadStats();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      mobile: "",
      cnic: "",
      customerType: "individual",
      customerStatus: "active",
      creditLimit: 0,
      currentBalance: 0,
      paymentTerms: "Cash",
      tags: [],
    });
    setSelectedCustomer(null);
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone || "",
      mobile: customer.mobile || "",
      cnic: customer.cnic || "",
      customerType: customer.customerType,
      customerStatus: customer.customerStatus,
      creditLimit: customer.creditLimit,
      currentBalance: customer.currentBalance,
      paymentTerms: customer.paymentTerms,
      tags: customer.tags,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      inactive: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      blocked: { color: "bg-red-100 text-red-800", icon: AlertCircle },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.inactive;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      individual: { color: "bg-blue-100 text-blue-800", icon: User },
      business: { color: "bg-purple-100 text-purple-800", icon: Building2 },
    };
    const config =
      typeConfig[type as keyof typeof typeConfig] || typeConfig.individual;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {type}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">
              Manage your customer relationships and information
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>
                  Add a new customer to your CRM system
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile: e.target.value })
                    }
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div>
                  <Label htmlFor="cnic">CNIC</Label>
                  <Input
                    id="cnic"
                    value={formData.cnic}
                    onChange={(e) =>
                      setFormData({ ...formData, cnic: e.target.value })
                    }
                    placeholder="12345-1234567-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerType">Customer Type</Label>
                  <Select
                    value={formData.customerType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        customerType: value as "individual" | "business",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customerStatus">Status</Label>
                  <Select
                    value={formData.customerStatus}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        customerStatus: value as
                          | "active"
                          | "inactive"
                          | "blocked",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="creditLimit">Credit Limit</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        creditLimit: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select
                    value={formData.paymentTerms}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        paymentTerms: value as "Credit" | "Card" | "Cash" | "Due Payments",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Credit">Credit</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Due Payments">Due Payments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags?.join(", ") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="vip, regular, premium"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomer}>Create Customer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.total_customers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.active_customers} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Customers
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active_customers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (stats.active_customers / stats.total_customers) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Individual Customers
                </CardTitle>
                <User className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.individual_customers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (stats.individual_customers / stats.total_customers) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Business Customers
                </CardTitle>
                <Building2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.business_customers}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (stats.business_customers / stats.total_customers) *
                    100
                  ).toFixed(1)}
                  % of total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, phone, CNIC..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>
              {customers.length} customers found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No customers found. Create your first customer to get started.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Credit Limit</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-mono text-sm">
                          {customer.customerId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {customer.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="w-3 h-3 mr-1" />
                                {customer.phone}
                              </div>
                            )}
                            {customer.mobile && (
                              <div className="flex items-center text-sm">
                                <Phone className="w-3 h-3 mr-1" />
                                {customer.mobile}
                              </div>
                            )}
                            {customer.cnic && (
                              <div className="text-sm text-muted-foreground">
                                CNIC: {customer.cnic}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(customer.customerType)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(customer.customerStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-medium">
                              Rs. {customer.creditLimit.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Balance: Rs.{" "}
                              {customer.currentBalance.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(customer)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Customer</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete this
                                      customer? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end space-x-2 mt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => {}}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleDeleteCustomer(customer.id)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
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

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer information</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Doe"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john.doe@example.com"
                />
              </div>
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+92 300 1234567"
                />
              </div>
              <div>
                <Label htmlFor="editMobile">Mobile</Label>
                <Input
                  id="editMobile"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  placeholder="+92 300 1234567"
                />
              </div>
              <div>
                <Label htmlFor="editCnic">CNIC</Label>
                <Input
                  id="editCnic"
                  value={formData.cnic}
                  onChange={(e) =>
                    setFormData({ ...formData, cnic: e.target.value })
                  }
                  placeholder="12345-1234567-1"
                />
              </div>
              <div>
                <Label htmlFor="editCustomerType">Customer Type</Label>
                <Select
                  value={formData.customerType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      customerType: value as "individual" | "business",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editCustomerStatus">Status</Label>
                <Select
                  value={formData.customerStatus}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      customerStatus: value as
                        | "active"
                        | "inactive"
                        | "blocked",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editCreditLimit">Credit Limit</Label>
                <Input
                  id="editCreditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditLimit: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="editPaymentTerms">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      paymentTerms: value as "Credit" | "Card" | "Cash" | "Due Payments",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Credit">Credit</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Due Payments">Due Payments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="editTags">Tags (comma separated)</Label>
                <Input
                  id="editTags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="vip, regular, premium"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateCustomer}>Update Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
