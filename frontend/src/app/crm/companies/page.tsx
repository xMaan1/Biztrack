import React, { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/src/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Globe,
  Phone,
  MapPin,
} from 'lucide-react';
import CRMService from '@/src/services/CRMService';
import {
  Company,
  Industry,
  CompanySize,
  CRMCompanyFilters,
  CompanyCreate,
} from '@/src/models/crm';
import { DashboardLayout } from '../../../components/layout';
import { useCustomOptions } from '../../../hooks/useCustomOptions';
import { CustomOptionDialog } from '../../../components/common/CustomOptionDialog';
import {
  PageHeader,
  SearchFilterBar,
  DeleteConfirmationModal,
  ErrorHandlerProvider,
  useAsyncErrorHandler
} from '../../../components/common';

function CRMCompaniesPageContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CRMCompanyFilters>({});
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCustomIndustryDialog, setShowCustomIndustryDialog] = useState(false);

  const { handleAsync, showSuccess } = useAsyncErrorHandler();

  const {
    customIndustries,
    createCustomIndustry,
    loading: customOptionsLoading,
  } = useCustomOptions();

  const [formData, setFormData] = useState<CompanyCreate>({
    name: '',
    industry: undefined,
    size: undefined,
    website: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    description: '',
    notes: '',
    tags: [],
    isActive: true,
    annualRevenue: undefined,
    employeeCount: undefined,
    foundedYear: undefined,
  });

  const loadCompanies = useCallback(async () => {
    await handleAsync(async () => {
      setLoading(true);
      const response = await CRMService.getCompanies(filters, 1, 100);
      setCompanies(response.companies);
    }, 'Failed to load companies. Please try again.');
    
    setLoading(false);
  }, [filters, handleAsync]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleSearch = () => {
    setFilters((prev: CRMCompanyFilters) => ({ ...prev, search }));
  };

  const resetFilters = () => {
    setFilters({});
    setSearch('');
  };

  const handleCreateCustomIndustry = async (
    name: string,
    description: string,
  ) => {
    await handleAsync(async () => {
      await createCustomIndustry(name, description);
    }, 'Failed to create custom industry. Please try again.');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      industry: undefined,
      size: undefined,
      website: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      description: '',
      notes: '',
      tags: [],
      isActive: true,
      annualRevenue: undefined,
      employeeCount: undefined,
      foundedYear: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Company name is required');
      return;
    }

    await handleAsync(async () => {
      setSubmitting(true);
      if (editingCompany) {
        await CRMService.updateCompany(editingCompany.id, formData);
        showSuccess('Company updated successfully!');
        setShowCreateDialog(false);
        setEditingCompany(null);
        resetForm();
        loadCompanies();
      } else {
        await CRMService.createCompany(formData);
        showSuccess('Company created successfully!');
        setShowCreateDialog(false);
        resetForm();
        loadCompanies();
      }
    }, 'Error saving company. Please try again.');
    
    setSubmitting(false);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry,
      size: company.size,
      website: company.website || '',
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      country: company.country || '',
      postalCode: company.postalCode || '',
      description: company.description || '',
      notes: company.notes || '',
      tags: company.tags || [],
      isActive: company.isActive,
      annualRevenue: company.annualRevenue,
      employeeCount: company.employeeCount,
      foundedYear: company.foundedYear,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (company: Company) => {
    setDeletingCompany(company);
  };

  const confirmDelete = async () => {
    if (!deletingCompany) return;

    await handleAsync(async () => {
      setDeleting(true);
      await CRMService.deleteCompany(deletingCompany.id);
      showSuccess('Company deleted successfully!');
      setDeletingCompany(null);
      loadCompanies();
    }, 'Error deleting company. Please try again.');
    
    setDeleting(false);
  };

  const handleView = (company: Company) => {
    setViewingCompany(company);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading Companies...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <PageHeader
          title="CRM Companies"
          description="Manage your company database and relationships"
          actions={[
            {
              label: 'New Company',
              onClick: () => {
                setEditingCompany(null);
                resetForm();
                setShowCreateDialog(true);
              },
              icon: <Plus className="w-4 h-4" />
            }
          ]}
        />

        <SearchFilterBar
          searchTerm={search}
          onSearchChange={setSearch}
          onSearch={handleSearch}
          searchPlaceholder="Search companies..."
          filters={[
            {
              key: 'industry',
              label: 'Industry',
              options: [
                { value: 'all', label: 'All Industries' },
                ...Object.values(Industry).map((industry) => ({
                  value: industry,
                  label: industry.charAt(0).toUpperCase() + industry.slice(1)
                }))
              ]
            },
            {
              key: 'size',
              label: 'Size',
              options: [
                { value: 'all', label: 'All Sizes' },
                ...Object.values(CompanySize).map((size) => ({
                  value: size,
                  label: size.charAt(0).toUpperCase() + size.slice(1)
                }))
              ]
            }
          ]}
          onFilterChange={(key, value) => {
            setFilters((prev: CRMCompanyFilters) => ({
              ...prev,
              [key]: value === 'all' ? undefined : value
            }));
          }}
          onClearFilters={resetFilters}
        />

        {/* Companies List */}
        <Card>
          <CardHeader>
            <CardTitle>Companies ({companies.length})</CardTitle>
            <CardDescription>
              Manage your company database and track business relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-500">
                            {company.industry && (
                              <span className="mr-2">{company.industry}</span>
                            )}
                            {company.size && <span>• {company.size}</span>}
                          </div>
                        </div>
                      </div>
                      {company.website && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Globe className="w-4 h-4" />
                          <span>{company.website}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      {company.industry && (
                        <Badge variant="outline">
                          {company.industry.charAt(0).toUpperCase() +
                            company.industry.slice(1)}
                        </Badge>
                      )}
                      {company.size && (
                        <Badge variant="secondary">
                          {company.size.charAt(0).toUpperCase() +
                            company.size.slice(1)}
                        </Badge>
                      )}
                      <Badge
                        variant={company.isActive ? 'default' : 'secondary'}
                      >
                        {company.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {company.description && (
                      <div className="text-sm text-gray-600 mt-2">
                        {company.description}
                      </div>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>
                        Created: {CRMService.formatDate(company.createdAt)}
                      </span>
                      {company.city && company.state && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {company.city}, {company.state}
                          </span>
                        </div>
                      )}
                      {company.employeeCount && (
                        <span>{company.employeeCount} employees</span>
                      )}
                      {company.annualRevenue && (
                        <span>
                          Revenue:{' '}
                          {CRMService.formatCurrency(company.annualRevenue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(company)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(company)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(company)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Company Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? 'Edit Company' : 'Create New Company'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry || 'all'}
                    onValueChange={(value) => {
                      if (value === 'create_new') {
                        setShowCustomIndustryDialog(true);
                      } else {
                        setFormData({
                          ...formData,
                          industry:
                            value === 'all' ? undefined : (value as Industry),
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select Industry</SelectItem>
                      {Object.values(Industry).map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry.charAt(0).toUpperCase() + industry.slice(1)}
                        </SelectItem>
                      ))}

                      {/* Custom Industries */}
                      {customIndustries &&
                        customIndustries.length > 0 &&
                        customIndustries.map((customIndustry) => (
                          <SelectItem
                            key={customIndustry.id}
                            value={customIndustry.id}
                          >
                            {customIndustry.name}
                          </SelectItem>
                        ))}

                      <SelectItem
                        value="create_new"
                        className="font-semibold text-blue-600"
                      >
                        + Create New Industry
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="size">Company Size</Label>
                  <Select
                    value={formData.size || 'all'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        size:
                          value === 'all' ? undefined : (value as CompanySize),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Select Size</SelectItem>
                      {Object.values(CompanySize).map((size) => (
                        <SelectItem key={size} value={size}>
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://example.com"
                    type="url"
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
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Business St"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="State"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="Country"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    placeholder="12345"
                  />
                </div>

                <div>
                  <Label htmlFor="annualRevenue">Annual Revenue</Label>
                  <Input
                    id="annualRevenue"
                    value={formData.annualRevenue || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        annualRevenue: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="1000000"
                    type="number"
                    min="0"
                    step="1000"
                  />
                </div>

                <div>
                  <Label htmlFor="employeeCount">Employee Count</Label>
                  <Input
                    id="employeeCount"
                    value={formData.employeeCount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employeeCount: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="50"
                    type="number"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="foundedYear">Founded Year</Label>
                  <Input
                    id="foundedYear"
                    value={formData.foundedYear || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        foundedYear: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="2020"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the company"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Additional notes about the company"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value
                          ? e.target.value.split(',').map((tag) => tag.trim())
                          : [],
                      })
                    }
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="isActive">Status</Label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value === 'active' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    setEditingCompany(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? 'Saving...'
                    : editingCompany
                      ? 'Update Company'
                      : 'Create Company'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Company Dialog */}
        <Dialog
          open={!!viewingCompany}
          onOpenChange={() => setViewingCompany(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Company Details</DialogTitle>
            </DialogHeader>

            {viewingCompany && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Company Name
                    </Label>
                    <p className="text-lg font-semibold">
                      {viewingCompany.name}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Industry
                    </Label>
                    <p>
                      {viewingCompany.industry
                        ? viewingCompany.industry.charAt(0).toUpperCase() +
                          viewingCompany.industry.slice(1)
                        : 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Company Size
                    </Label>
                    <p>
                      {viewingCompany.size
                        ? viewingCompany.size.charAt(0).toUpperCase() +
                          viewingCompany.size.slice(1)
                        : 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Website
                    </Label>
                    <p>{viewingCompany.website || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Phone
                    </Label>
                    <p>{viewingCompany.phone || 'Not specified'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Address
                    </Label>
                    <p>{viewingCompany.address || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      City
                    </Label>
                    <p>{viewingCompany.city || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      State/Province
                    </Label>
                    <p>{viewingCompany.state || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Country
                    </Label>
                    <p>{viewingCompany.country || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Postal Code
                    </Label>
                    <p>{viewingCompany.postalCode || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Annual Revenue
                    </Label>
                    <p>
                      {viewingCompany.annualRevenue
                        ? CRMService.formatCurrency(
                            viewingCompany.annualRevenue,
                          )
                        : 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Employee Count
                    </Label>
                    <p>{viewingCompany.employeeCount || 'Not specified'}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Founded Year
                    </Label>
                    <p>{viewingCompany.foundedYear || 'Not specified'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Description
                    </Label>
                    <p>{viewingCompany.description || 'Not specified'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Notes
                    </Label>
                    <p>{viewingCompany.notes || 'Not specified'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Tags
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {viewingCompany.tags && viewingCompany.tags.length > 0 ? (
                        viewingCompany.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <p>No tags</p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <Badge
                      variant={
                        viewingCompany.isActive ? 'default' : 'secondary'
                      }
                    >
                      {viewingCompany.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Created
                    </Label>
                    <p>{CRMService.formatDate(viewingCompany.createdAt)}</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Last Updated
                    </Label>
                    <p>{CRMService.formatDate(viewingCompany.updatedAt)}</p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setViewingCompany(null)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setViewingCompany(null);
                      handleEdit(viewingCompany);
                    }}
                  >
                    Edit Company
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <DeleteConfirmationModal
          open={!!deletingCompany}
          onOpenChange={() => setDeletingCompany(null)}
          onConfirm={confirmDelete}
          title="Delete Company"
          description={`Are you sure you want to delete "${deletingCompany?.name}"? This action cannot be undone.`}
          itemName={deletingCompany?.name}
          loading={deleting}
        />

        {/* Custom Industry Dialog */}
        <CustomOptionDialog
          open={showCustomIndustryDialog}
          onOpenChange={setShowCustomIndustryDialog}
          title="Create New Industry"
          description="Create a custom industry that will be available for your tenant."
          optionName="Industry"
          placeholder="e.g., Fintech, EdTech"
          onSubmit={handleCreateCustomIndustry}
          loading={customOptionsLoading.industry}
        />
      </div>
    </DashboardLayout>
  );
}

export default function CRMCompaniesPage() {
  return (
    <ErrorHandlerProvider defaultErrorType="toast">
      <CRMCompaniesPageContent />
    </ErrorHandlerProvider>
  );
}
