'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
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
} from '../../models/sales';
import InvoiceService from '../../services/InvoiceService';
import { CustomerSearch } from '../ui/customer-search';
import { Customer } from '../../services/CustomerService';
import { useCurrency } from '../../contexts/CurrencyContext';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceCreate) => void;
  mode: 'create' | 'edit';
  invoice?: Invoice | null;
}

export function InvoiceDialog({
  open,
  onOpenChange,
  onSubmit,
  mode,
  invoice,
}: InvoiceDialogProps) {
  const { currency } = useCurrency();
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
    // Workshop specific fields
    jobDescription: '',
    partsDescription: '',
    labourTotal: 0,
    partsTotal: 0,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [items, setItems] = useState<InvoiceItemCreate[]>([]);
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

  useEffect(() => {
    if (invoice && mode === 'edit') {
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
        // Workshop specific fields
        jobDescription: '',
        partsDescription: '',
        labourTotal: 0,
        partsTotal: 0,
      });
      setItems([]);
      setSelectedCustomer(null);
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
    const newItem: InvoiceItemCreate = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItemCreate,
    value: string | number,
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData: InvoiceCreate = {
        ...formData,
        items: items,
      };

      await onSubmit(submitData);
      onOpenChange(false);
    } catch {
      } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}
          </DialogTitle>
        </DialogHeader>

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

          {/* Vehicle Details for Workshop */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Vehicle Details (Workshop)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-end border p-3 rounded-lg"
                >
                  <div className="col-span-4">
                    <Label htmlFor={`item_${index}_description`}>
                      Description *
                    </Label>
                    <Input
                      id={`item_${index}_description`}
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, 'description', e.target.value)
                      }
                      placeholder="Item description"
                      className={
                        errors[`item_${index}_description`]
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    {errors[`item_${index}_description`] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors[`item_${index}_description`]}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor={`item_${index}_quantity`}>Qty *</Label>
                    <Input
                      id={`item_${index}_quantity`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'quantity',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className={
                        errors[`item_${index}_quantity`] ? 'border-red-500' : ''
                      }
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors[`item_${index}_quantity`]}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor={`item_${index}_unitPrice`}>
                      Unit Price *
                    </Label>
                    <Input
                      id={`item_${index}_unitPrice`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'unitPrice',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                      className={
                        errors[`item_${index}_unitPrice`]
                          ? 'border-red-500'
                          : ''
                      }
                    />
                    {errors[`item_${index}_unitPrice`] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors[`item_${index}_unitPrice`]}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor={`item_${index}_discount`}>
                      Discount (%)
                    </Label>
                    <Input
                      id={`item_${index}_discount`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) =>
                        updateItem(
                          index,
                          'discount',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="col-span-1">
                    <Label>Total</Label>
                    <div className="text-sm font-medium p-2 bg-gray-50 rounded">
                      {InvoiceService.formatCurrency(
                        item.quantity *
                          item.unitPrice *
                          (1 - item.discount / 100),
                      )}
                    </div>
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

              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
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
                      {InvoiceService.formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount ({formData.discount}%):</span>
                    <span>
                      -{InvoiceService.formatCurrency(totals.discount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.taxRate}%):</span>
                    <span>
                      {InvoiceService.formatCurrency(totals.taxAmount)}
                    </span>
                  </div>
                  <div className="border-t pt-2 font-bold text-lg">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{InvoiceService.formatCurrency(totals.total)}</span>
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

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="modern-button">
              {loading
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Invoice'
                  : 'Update Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
