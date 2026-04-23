'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Plus,
  Trash2,
  Calculator,
  User,
  Building,
  FileText,
} from 'lucide-react';
import {
  Invoice,
  InvoiceCreate,
  InvoiceItemCreate,
  InstallmentPlanCreate,
} from '../../models/sales';
import InvoiceService from '../../services/InvoiceService';
import { useCurrency } from '../../contexts/CurrencyContext';
import { CustomerSearch } from '../ui/customer-search';
import { VehicleSearch } from '../ui/vehicle-search';
import { Customer } from '../../services/CustomerService';
import { Vehicle } from '../../models/workshop';
import { Product } from '../../models/pos';
import { apiService } from '../../services/ApiService';
import { usePlanInfo } from '../../hooks/usePlanInfo';

export type InstallmentPlanCreateOption = Omit<InstallmentPlanCreate, 'invoice_id'>;

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceCreate, options?: { installmentPlan?: InstallmentPlanCreateOption }) => void;
  mode: 'create' | 'edit' | 'view';
  invoice?: Invoice | null;
  error?: string | null;
}

export function InvoiceDialog({
  open,
  onOpenChange,
  onSubmit,
  mode,
  invoice,
  error,
}: InvoiceDialogProps) {
  const { currency, formatCurrency } = useCurrency();
  const { planInfo } = usePlanInfo();
  const isWorkshop = planInfo?.planType === 'workshop';
  const isCommerce = planInfo?.planType === 'commerce';
  const [createInstallmentPlan, setCreateInstallmentPlan] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(3);
  const [installmentFrequency, setInstallmentFrequency] = useState('monthly');
  const [installmentFirstDueDate, setInstallmentFirstDueDate] = useState('');
  const [formData, setFormData] = useState<InvoiceCreate>({
    customerId: '',
    customerName: '',
    customerEmail: '',
    shippingAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    orderNumber: '', // New field
    orderTime: new Date().toISOString().slice(0, 16), // New field - current date/time
    paymentTerms: 'Cash',
    currency: currency,
    taxRate: 0,
    discount: 0,
    notes: '',
    terms: '',
    items: [],
    opportunityId: '',
    quoteId: '',
    projectId: '',
    // Vehicle details for workshop invoices
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
    vehicleVin: '',
    vehicleReg: '',
    vehicleMileage: '',
    documentNo: '',
    // Workshop specific fields
    jobDescription: '',
    partsDescription: '',
    labourTotal: 0,
    partsTotal: 0,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [items, setItems] = useState<InvoiceItemCreate[]>([]);
  const [newItem, setNewItem] = useState<InvoiceItemCreate>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    taxRate: 0,
    productId: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Update currency when global currency changes
  useEffect(() => {
    if (mode === 'create') {
      setFormData(prev => ({
        ...prev,
        currency: currency,
      }));
    }
  }, [currency, mode]);

  // Fetch products when dialog opens
  useEffect(() => {
    if (open && mode === 'create' && !installmentFirstDueDate) {
      setInstallmentFirstDueDate(formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
  }, [open, mode, formData.dueDate]);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      const response = await apiService.get('/pos/products');
      setProducts(response.products || []);
    } catch (error) {
      setProducts([]);
    }
  };

  useEffect(() => {
    if (invoice && (mode === 'edit' || mode === 'view')) {
      setFormData({
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        shippingAddress: invoice.shippingAddress || '',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        orderNumber: invoice.orderNumber || '',
        orderTime: invoice.orderTime || new Date().toISOString().slice(0, 16),
        paymentTerms: invoice.paymentTerms,
        currency: invoice.currency,
        taxRate: invoice.taxRate,
        discount: invoice.discount,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        items: [],
        opportunityId: invoice.opportunityId || '',
        quoteId: invoice.quoteId || '',
        projectId: invoice.projectId || '',
        // Vehicle details for workshop invoices
        vehicleMake: invoice.vehicleMake || '',
        vehicleModel: invoice.vehicleModel || '',
        vehicleYear: invoice.vehicleYear || '',
        vehicleColor: invoice.vehicleColor || '',
        vehicleVin: invoice.vehicleVin || '',
        vehicleReg: invoice.vehicleReg || '',
        vehicleMileage: invoice.vehicleMileage || '',
        documentNo: invoice.documentNo || '',
        // Workshop specific fields
        jobDescription: invoice.jobDescription || '',
        partsDescription: invoice.partsDescription || '',
        labourTotal: invoice.labourTotal || 0,
        partsTotal: invoice.partsTotal || 0,
      });
      setItems(
        invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          productId: item.productId,
          projectId: item.projectId,
          taskId: item.taskId,
        })),
      );

      // Fetch customer data if customerId exists
      if (invoice.customerId) {
        InvoiceService.getCustomerById(invoice.customerId)
          .then((customer) => {
            setSelectedCustomer(customer);
          })
          .catch(() => {
            // If customer fetch fails, create a mock customer object
            setSelectedCustomer({
              id: invoice.customerId,
              customerId: invoice.customerId,
              firstName: invoice.customerName.split(' ')[0] || '',
              lastName: invoice.customerName.split(' ').slice(1).join(' ') || '',
              email: invoice.customerEmail,
              phone: invoice.customerPhone || '',
              customerType: 'individual' as const,
              customerStatus: 'active' as const,
              creditLimit: 0,
              currentBalance: 0,
              paymentTerms: 'Cash' as const,
              tags: [],
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
      }
      setSelectedVehicle(null);
    } else {
      // Reset form for create mode
      setFormData({
        customerId: '',
        customerName: '',
        customerEmail: '',
        shippingAddress: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        orderNumber: '',
        orderTime: new Date().toISOString().slice(0, 16),
        paymentTerms: 'Cash',
        currency: 'USD',
        taxRate: 0,
        discount: 0,
        notes: '',
        terms: '',
        items: [],
        opportunityId: '',
        quoteId: '',
        projectId: '',
        // Vehicle details for workshop invoices
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: '',
        vehicleColor: '',
        vehicleVin: '',
        vehicleReg: '',
        vehicleMileage: '',
        documentNo: '',
        // Workshop specific fields
        jobDescription: '',
        partsDescription: '',
        labourTotal: 0,
        partsTotal: 0,
      });
      setItems([]);
      setSelectedCustomer(null);
      setSelectedVehicle(null);
    }
    setErrors({});
  }, [invoice, mode, open]);

  const handleInputChange = (
    field: keyof InvoiceCreate,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);

    if (customer) {
      // Update form data with customer information
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
      }));

      // Clear customer-related errors
      setErrors((prev) => ({
        ...prev,
        customer: '',
        customerName: '',
        customerEmail: '',
      }));
    } else {
      // Clear customer data when no customer is selected
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerEmail: '',
      }));
    }
  };

  const addItem = () => {
    const itemErrors: { [key: string]: string } = {};
    if (isCommerce && !newItem.productId) {
      itemErrors.newItemProduct = 'Please select a product';
    }
    if (!newItem.description.trim()) {
      itemErrors.newItemDescription = 'Description is required';
    }
    if (newItem.quantity <= 0) {
      itemErrors.newItemQuantity = 'Quantity must be greater than 0';
    }
    if (newItem.unitPrice < 0) {
      itemErrors.newItemUnitPrice = 'Unit price cannot be negative';
    }
    if (Object.keys(itemErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...itemErrors }));
      return;
    }
    setItems((prev) => [...prev, { ...newItem }]);
    setNewItem({
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0,
      productId: '',
    });
  };


  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (1 - item.discount / 100),
      0,
    );
    const discountAmount = subtotal * (formData.discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (formData.taxRate / 100);
    const total = taxableAmount + taxAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedCustomer) {
      newErrors.customer = 'Please select a customer';
    }
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    if (items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    // Validate items
    items.forEach((item, index) => {
      if (isCommerce && !item.productId) {
        newErrors[`item_${index}_productId`] = 'Product is required';
      }
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Item description is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'view') {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData: InvoiceCreate = {
        ...formData,
        items: items,
      };
      const totals = calculateTotals();
      const options =
        mode === 'create' && createInstallmentPlan && totals.total > 0
          ? {
              installmentPlan: {
                total_amount: totals.total,
                number_of_installments: installmentCount,
                frequency: installmentFrequency,
                first_due_date: (installmentFirstDueDate || formData.dueDate) + 'T00:00:00Z',
                currency: formData.currency,
              } as InstallmentPlanCreateOption,
            }
          : undefined;
      await onSubmit(submitData, options);
      onOpenChange(false);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();
  const hasWorkshopData = Boolean(
    invoice?.vehicleMake ||
      invoice?.vehicleModel ||
      invoice?.vehicleYear ||
      invoice?.vehicleColor ||
      invoice?.vehicleVin ||
      invoice?.vehicleReg ||
      invoice?.vehicleMileage ||
      invoice?.documentNo ||
      invoice?.jobDescription ||
      invoice?.partsDescription ||
      invoice?.labourTotal ||
      invoice?.partsTotal,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'create' ? 'Create New Invoice' : mode === 'edit' ? 'Edit Invoice' : 'View Invoice'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'view' && invoice ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{invoice.invoiceNumber}</span>
                  <span className={`px-2 py-1 rounded text-xs ${InvoiceService.getStatusColor(invoice.status)}`}>
                    {InvoiceService.getStatusLabel(invoice.status)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold text-lg">{formatCurrency(invoice.total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paid</p>
                  <p className="font-medium text-green-600">{formatCurrency(invoice.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className={`font-medium ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(invoice.balance)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer Name</p>
                  <p className="font-medium">{invoice.customerName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer ID</p>
                  <p>{invoice.customerId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer Email</p>
                  <p>{invoice.customerEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer Phone</p>
                  <p>{invoice.customerPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Billing Address</p>
                  <p>{invoice.billingAddress || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p>{invoice.shippingAddress || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Issue Date</p>
                  <p>{InvoiceService.formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p>{InvoiceService.formatDate(invoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Terms</p>
                  <p>{invoice.paymentTerms || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Currency</p>
                  <p>{invoice.currency || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p>{invoice.orderNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Time</p>
                  <p>{invoice.orderTime ? InvoiceService.formatDate(invoice.orderTime) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Opportunity ID</p>
                  <p>{invoice.opportunityId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quote ID</p>
                  <p>{invoice.quoteId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Project ID</p>
                  <p>{invoice.projectId || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {hasWorkshopData && (
              <Card>
                <CardHeader>
                  <CardTitle>Workshop Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Vehicle Make</p><p>{invoice.vehicleMake || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Vehicle Model</p><p>{invoice.vehicleModel || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Vehicle Year</p><p>{invoice.vehicleYear || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Vehicle Color</p><p>{invoice.vehicleColor || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">VIN</p><p>{invoice.vehicleVin || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Registration</p><p>{invoice.vehicleReg || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Mileage</p><p>{invoice.vehicleMileage || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Document No</p><p>{invoice.documentNo || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Labour Total</p><p>{formatCurrency(invoice.labourTotal || 0)}</p></div>
                  <div><p className="text-sm text-gray-500">Parts Total</p><p>{formatCurrency(invoice.partsTotal || 0)}</p></div>
                  <div className="md:col-span-2"><p className="text-sm text-gray-500">Job Description</p><p>{invoice.jobDescription || '-'}</p></div>
                  <div className="md:col-span-2"><p className="text-sm text-gray-500">Parts Description</p><p>{invoice.partsDescription || '-'}</p></div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Invoice Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoice.items.length > 0 ? (
                  invoice.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded-lg p-3">
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="font-medium">{item.description || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p>{item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Unit Price</p>
                        <p>{formatCurrency(item.unitPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Discount</p>
                        <p>{item.discount}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tax</p>
                        <p>{item.taxRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Line Total</p>
                        <p className="font-medium">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No invoice items.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><p className="text-sm text-gray-500">Subtotal</p><p>{formatCurrency(invoice.subtotal)}</p></div>
                <div><p className="text-sm text-gray-500">Discount ({invoice.discount}%)</p><p>-{formatCurrency((invoice.subtotal * invoice.discount) / 100)}</p></div>
                <div><p className="text-sm text-gray-500">Tax ({invoice.taxRate}%)</p><p>{formatCurrency(invoice.taxAmount)}</p></div>
                <div><p className="text-sm text-gray-500">Total</p><p className="font-semibold">{formatCurrency(invoice.total)}</p></div>
                <div><p className="text-sm text-gray-500">Total Paid</p><p>{formatCurrency(invoice.totalPaid)}</p></div>
                <div><p className="text-sm text-gray-500">Balance</p><p>{formatCurrency(invoice.balance)}</p></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p>{invoice.notes || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Terms & Conditions</p>
                  <p>{invoice.terms || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><p className="text-sm text-gray-500">Created At</p><p>{InvoiceService.formatDate(invoice.createdAt)}</p></div>
                <div><p className="text-sm text-gray-500">Updated At</p><p>{InvoiceService.formatDate(invoice.updatedAt)}</p></div>
                <div><p className="text-sm text-gray-500">Sent At</p><p>{invoice.sentAt ? InvoiceService.formatDate(invoice.sentAt) : '-'}</p></div>
                <div><p className="text-sm text-gray-500">Viewed At</p><p>{invoice.viewedAt ? InvoiceService.formatDate(invoice.viewedAt) : '-'}</p></div>
                <div><p className="text-sm text-gray-500">Paid At</p><p>{invoice.paidAt ? InvoiceService.formatDate(invoice.paidAt) : '-'}</p></div>
                <div><p className="text-sm text-gray-500">Overdue At</p><p>{invoice.overdueAt ? InvoiceService.formatDate(invoice.overdueAt) : '-'}</p></div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerSearch
                value={selectedCustomer}
                onSelect={handleCustomerSelect}
                placeholder="Search for existing customers..."
                label="Select Customer"
                required={true}
                error={errors.customer}
              />
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) =>
                    handleInputChange('issueDate', e.target.value)
                  }
                  className={errors.issueDate ? 'border-red-500' : ''}
                />
                {errors.issueDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.issueDate}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className={errors.dueDate ? 'border-red-500' : ''}
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="orderNumber">Order Number (Optional)</Label>
                <Input
                  id="orderNumber"
                  value={formData.orderNumber}
                  onChange={(e) =>
                    handleInputChange('orderNumber', e.target.value)
                  }
                  placeholder="Enter order number"
                />
              </div>

              <div>
                <Label htmlFor="orderTime">Order Time (Optional)</Label>
                <Input
                  id="orderTime"
                  type="datetime-local"
                  value={formData.orderTime}
                  onChange={(e) =>
                    handleInputChange('orderTime', e.target.value)
                  }
                  placeholder="Select order time"
                />
              </div>

              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select
                  value={formData.paymentTerms}
                  onValueChange={(value) =>
                    handleInputChange('paymentTerms', value)
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

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    handleInputChange('currency', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="PKR">PKR (Rs)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) =>
                    handleInputChange(
                      'taxRate',
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) =>
                    handleInputChange(
                      'discount',
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {isWorkshop && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Vehicle Details (Workshop)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <VehicleSearch
                  label="Vehicle"
                  value={selectedVehicle}
                  onSelect={(v) => {
                    setSelectedVehicle(v);
                    if (v) {
                      handleInputChange('vehicleMake', v.make ?? '');
                      handleInputChange('vehicleModel', v.model ?? '');
                      handleInputChange('vehicleYear', v.year ?? '');
                      handleInputChange('vehicleColor', v.color ?? '');
                      handleInputChange('vehicleVin', v.vin ?? '');
                      handleInputChange('vehicleReg', v.registration_number ?? '');
                      handleInputChange('vehicleMileage', v.mileage ?? '');
                    }
                  }}
                  placeholder="Search by reg, VIN, make, model..."
                />
              </div>
              <div>
                <Label htmlFor="vehicleMake">Vehicle Make</Label>
                <Input
                  id="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={(e) =>
                    handleInputChange('vehicleMake', e.target.value)
                  }
                  placeholder="e.g., VW, BMW, Ford"
                />
              </div>

              <div>
                <Label htmlFor="vehicleModel">Vehicle Model</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) =>
                    handleInputChange('vehicleModel', e.target.value)
                  }
                  placeholder="e.g., Golf, 3 Series, Focus"
                />
              </div>

              <div>
                <Label htmlFor="vehicleYear">Vehicle Year</Label>
                <Input
                  id="vehicleYear"
                  value={formData.vehicleYear}
                  onChange={(e) =>
                    handleInputChange('vehicleYear', e.target.value)
                  }
                  placeholder="e.g., 2014, 2020"
                />
              </div>

              <div>
                <Label htmlFor="vehicleColor">Vehicle Color</Label>
                <Input
                  id="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={(e) =>
                    handleInputChange('vehicleColor', e.target.value)
                  }
                  placeholder="e.g., Blue, Red, Silver"
                />
              </div>

              <div>
                <Label htmlFor="vehicleVin">VIN Number</Label>
                <Input
                  id="vehicleVin"
                  value={formData.vehicleVin}
                  onChange={(e) =>
                    handleInputChange('vehicleVin', e.target.value)
                  }
                  placeholder="Vehicle Identification Number"
                />
              </div>

              <div>
                <Label htmlFor="vehicleReg">Registration Number</Label>
                <Input
                  id="vehicleReg"
                  value={formData.vehicleReg}
                  onChange={(e) =>
                    handleInputChange('vehicleReg', e.target.value)
                  }
                  placeholder="e.g., KU14 MGV"
                />
              </div>

              <div>
                <Label htmlFor="vehicleMileage">Mileage</Label>
                <Input
                  id="vehicleMileage"
                  value={formData.vehicleMileage}
                  onChange={(e) =>
                    handleInputChange('vehicleMileage', e.target.value)
                  }
                  placeholder="e.g., 50,000 miles"
                />
              </div>

              <div>
                <Label htmlFor="documentNo">Document No</Label>
                <Input
                  id="documentNo"
                  value={formData.documentNo}
                  onChange={(e) =>
                    handleInputChange('documentNo', e.target.value)
                  }
                  placeholder="e.g., DOC-001"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) =>
                    handleInputChange('jobDescription', e.target.value)
                  }
                  placeholder="Describe the work performed"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="partsDescription">Parts Description</Label>
                <Textarea
                  id="partsDescription"
                  value={formData.partsDescription}
                  onChange={(e) =>
                    handleInputChange('partsDescription', e.target.value)
                  }
                  placeholder="Describe the parts used"
                />
              </div>

              <div>
                <Label htmlFor="labourTotal">Labour Total (£)</Label>
                <Input
                  id="labourTotal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.labourTotal}
                  onChange={(e) =>
                    handleInputChange(
                      'labourTotal',
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="partsTotal">Parts Total (£)</Label>
                <Input
                  id="partsTotal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.partsTotal}
                  onChange={(e) =>
                    handleInputChange(
                      'partsTotal',
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>
          )}

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Invoice Items
              </CardTitle>
              {errors.items && (
                <p className="text-red-500 text-sm">{errors.items}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Item Form */}
              <div className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="productId">Product *</Label>
                  <Select
                    value={newItem.productId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      setNewItem((prev) => ({
                        ...prev,
                        productId: value,
                        description: product?.name || '',
                        unitPrice: product?.unitPrice || 0,
                      }));
                      if (errors.newItemProduct || errors.newItemDescription) {
                        setErrors((prev) => ({
                          ...prev,
                          newItemProduct: '',
                          newItemDescription: '',
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="no-products" disabled>
                          No products available
                        </SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.newItemProduct && (
                    <p className="text-red-500 text-sm">{errors.newItemProduct}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                    <Input
                    id="description"
                    value={newItem.description}
                      onChange={(e) =>
                      {
                        setNewItem((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                        if (errors.newItemDescription) {
                          setErrors((prev) => ({ ...prev, newItemDescription: '' }));
                        }
                      }
                      }
                      placeholder="Item description"
                    />
                  {errors.newItemDescription && (
                    <p className="text-red-500 text-sm">{errors.newItemDescription}</p>
                  )}
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                    id="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                    value={newItem.quantity}
                      onChange={(e) =>
                      {
                        setNewItem((prev) => ({
                          ...prev,
                          quantity: parseFloat(e.target.value) || 0,
                        }));
                        if (errors.newItemQuantity) {
                          setErrors((prev) => ({ ...prev, newItemQuantity: '' }));
                        }
                      }
                    }
                    placeholder="Qty"
                  />
                  {errors.newItemQuantity && (
                    <p className="text-red-500 text-sm">{errors.newItemQuantity}</p>
                  )}
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price *</Label>
                    <Input
                    id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                    value={newItem.unitPrice}
                      onChange={(e) =>
                      {
                        setNewItem((prev) => ({
                          ...prev,
                          unitPrice: parseFloat(e.target.value) || 0,
                        }));
                        if (errors.newItemUnitPrice) {
                          setErrors((prev) => ({ ...prev, newItemUnitPrice: '' }));
                        }
                      }
                      }
                      placeholder="0.00"
                    />
                  {errors.newItemUnitPrice && (
                    <p className="text-red-500 text-sm">{errors.newItemUnitPrice}</p>
                  )}
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                    <Input
                    id="discount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                    value={newItem.discount}
                      onChange={(e) =>
                      setNewItem((prev) => ({
                        ...prev,
                        discount: parseFloat(e.target.value) || 0,
                      }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                <div className="space-y-2">
                    <Label>Total</Label>
                    <div className="text-sm font-medium p-2 bg-gray-50 rounded">
                    {formatCurrency(
                      newItem.quantity *
                        newItem.unitPrice *
                        (1 - newItem.discount / 100),
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>

              {/* Items List */}
              {items.map((item, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-12 gap-2 items-center border p-3 rounded-lg ${
                    errors[`item_${index}_productId`] ? 'border-red-500' : ''
                  }`}
                >
                  <div className="col-span-3">
                    <span className="font-medium">{item.description}</span>
                    {item.productId && (
                      <div className="text-sm text-gray-500">
                        Product ID: {item.productId}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <div className="col-span-2">
                    <span>Price: {formatCurrency(item.unitPrice)}</span>
                  </div>
                  <div className="col-span-2">
                    <span>Discount: {item.discount}%</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">
                      {formatCurrency(
                        item.quantity *
                          item.unitPrice *
                          (1 - item.discount / 100),
                      )}
                    </span>
                    </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount ({formData.discount}%):</span>
                    <span>
                      -{formatCurrency(totals.discount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.taxRate}%):</span>
                    <span>
                      {formatCurrency(totals.taxAmount)}
                    </span>
                  </div>
                  <div className="border-t pt-2 font-bold text-lg">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{formatCurrency(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes for the customer"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="terms">Terms & Conditions (Optional)</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => handleInputChange('terms', e.target.value)}
                  placeholder="Add terms and conditions"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {isCommerce && mode === 'create' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Installments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="createInstallmentPlan"
                    checked={createInstallmentPlan}
                    onChange={(e) => setCreateInstallmentPlan(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="createInstallmentPlan">Create installment plan for this invoice</Label>
                </div>
                {createInstallmentPlan && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="installmentCount">Number of installments</Label>
                      <Input
                        id="installmentCount"
                        type="number"
                        min={1}
                        max={60}
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(parseInt(e.target.value, 10) || 1)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="installmentFrequency">Frequency</Label>
                      <Select value={installmentFrequency} onValueChange={setInstallmentFrequency}>
                        <SelectTrigger id="installmentFrequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="installmentFirstDueDate">First due date</Label>
                      <Input
                        id="installmentFirstDueDate"
                        type="date"
                        value={installmentFirstDueDate}
                        onChange={(e) => setInstallmentFirstDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {mode !== 'view' && (
              <Button type="submit" disabled={loading} className="modern-button">
                {loading
                  ? 'Saving...'
                  : mode === 'create'
                    ? 'Create Invoice'
                    : 'Update Invoice'}
              </Button>
            )}
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
