import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import InvoiceService from '@/services/InvoiceService';
import CRMService from '@/services/CRMService';
import POSService from '@/services/POSService';
import { Invoice, InvoiceCreate, InvoiceItemCreate } from '@/models/sales';
import { Customer } from '@/models/crm';
import { Product } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function InvoiceFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency, currency: defaultCurrency } = useCurrency();
  const { id, invoice } = route.params as { id?: string; invoice?: Invoice };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentTermsPicker, setShowPaymentTermsPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [formData, setFormData] = useState<InvoiceCreate>({
    customerId: invoice?.customerId || '',
    customerName: invoice?.customerName || '',
    customerEmail: invoice?.customerEmail || '',
    shippingAddress: invoice?.shippingAddress || '',
    issueDate: invoice?.issueDate
      ? new Date(invoice.issueDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate
      ? new Date(invoice.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    orderNumber: invoice?.orderNumber || '',
    orderTime: invoice?.orderTime || new Date().toISOString().slice(0, 16),
    paymentTerms: invoice?.paymentTerms || 'Cash',
    currency: invoice?.currency || defaultCurrency || 'USD',
    taxRate: invoice?.taxRate || 0,
    discount: invoice?.discount || 0,
    notes: invoice?.notes || '',
    terms: invoice?.terms || '',
    items: invoice?.items?.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      productId: item.productId,
    })) || [],
    opportunityId: invoice?.opportunityId,
    quoteId: invoice?.quoteId,
    projectId: invoice?.projectId,
  });

  const paymentTermsOptions = ['Cash', 'Credit', 'Card', 'Due Payments', 'Net 15', 'Net 30', 'Net 60'];
  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
  ];

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      searchCustomers();
    } else {
      loadCustomers();
    }
  }, [searchTerm]);

  const loadCustomers = async () => {
    try {
      const response = await CRMService.getCustomers(0, 100);
      setCustomers(response.customers || []);
    } catch (error: any) {
      console.error('Error loading customers:', error);
    }
  };

  const searchCustomers = async () => {
    try {
      const results = await CRMService.searchCustomers(searchTerm, 20);
      setCustomers(results);
    } catch (error: any) {
      console.error('Error searching customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await POSService.getProducts({}, 1, 100);
      setProducts(response.products || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.customerName || !formData.customerEmail) {
      Alert.alert('Validation Error', 'Please select a customer');
      return;
    }
    if (!formData.issueDate) {
      Alert.alert('Validation Error', 'Issue date is required');
      return;
    }
    if (!formData.dueDate) {
      Alert.alert('Validation Error', 'Due date is required');
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one item');
      return;
    }

    const invalidItems = formData.items.filter(
      (item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0
    );
    if (invalidItems.length > 0) {
      Alert.alert('Validation Error', 'Please ensure all items have valid description, quantity > 0, and unit price >= 0');
      return;
    }

    try {
      setLoading(true);
      const totals = InvoiceService.calculateInvoiceTotals(
        formData.items,
        formData.taxRate,
        formData.discount,
      );
      const invoiceData = {
        ...formData,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
      };

      if (isEdit && id) {
        await InvoiceService.updateInvoice(id, invoiceData);
        Alert.alert('Success', 'Invoice updated successfully');
      } else {
        await InvoiceService.createInvoice(invoiceData);
        Alert.alert('Success', 'Invoice created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setFormData({
      ...formData,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
    });
    setSearchTerm('');
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          taxRate: prev.taxRate || 0,
          productId: '',
        },
      ],
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItemCreate, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const totals = InvoiceService.calculateInvoiceTotals(
    formData.items,
    formData.taxRate,
    formData.discount,
  );

  return (
    <Container safeArea>
      <Header
        title={isEdit ? 'Edit Invoice' : 'New Invoice'}
        gradient={false}
        rightIcon="checkmark"
        onRightPress={handleSubmit}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Search Customer *</Text>
              <TextInput
                style={styles.input}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search by name or email"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            {formData.customerId && (
              <View style={styles.selectedCustomer}>
                <Text style={styles.selectedCustomerText}>
                  {formData.customerName} ({formData.customerEmail})
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setFormData({
                      ...formData,
                      customerId: '',
                      customerName: '',
                      customerEmail: '',
                    })
                  }
                >
                  <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            )}
            {!formData.customerId && customers.length > 0 && (
              <View style={styles.customersList}>
                {customers.slice(0, 5).map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    style={styles.customerOption}
                    onPress={() => selectCustomer(customer)}
                  >
                    <Text style={styles.customerOptionText}>
                      {customer.firstName} {customer.lastName} - {customer.email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Shipping Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.shippingAddress}
                onChangeText={(text) => setFormData({ ...formData, shippingAddress: text })}
                placeholder="Enter shipping address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Issue Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.issueDate}
                  onChangeText={(text) => setFormData({ ...formData, issueDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Due Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.dueDate}
                  onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Order Number</Text>
                <TextInput
                  style={styles.input}
                  value={formData.orderNumber}
                  onChangeText={(text) => setFormData({ ...formData, orderNumber: text })}
                  placeholder="Enter order number"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Order Time</Text>
                <TextInput
                  style={styles.input}
                  value={formData.orderTime}
                  onChangeText={(text) => setFormData({ ...formData, orderTime: text })}
                  placeholder="YYYY-MM-DDTHH:MM"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Payment Terms</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowPaymentTermsPicker(!showPaymentTermsPicker)}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      !formData.paymentTerms && styles.pickerPlaceholder,
                    ]}
                  >
                    {formData.paymentTerms || 'Select payment terms'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                {showPaymentTermsPicker && (
                  <View style={styles.pickerContainer}>
                    <ScrollView style={styles.pickerScrollView} nestedScrollEnabled>
                      {paymentTermsOptions.map((term) => (
                        <TouchableOpacity
                          key={term}
                          style={styles.pickerOption}
                          onPress={() => {
                            setFormData({ ...formData, paymentTerms: term });
                            setShowPaymentTermsPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              formData.paymentTerms === term && styles.pickerOptionTextActive,
                            ]}
                          >
                            {term}
                          </Text>
                          {formData.paymentTerms === term && (
                            <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Currency</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      !formData.currency && styles.pickerPlaceholder,
                    ]}
                  >
                    {currencyOptions.find((c) => c.value === formData.currency)?.label || formData.currency || 'Select currency'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                {showCurrencyPicker && (
                  <View style={styles.pickerContainer}>
                    <ScrollView style={styles.pickerScrollView} nestedScrollEnabled>
                      {currencyOptions.map((currency) => (
                        <TouchableOpacity
                          key={currency.value}
                          style={styles.pickerOption}
                          onPress={() => {
                            setFormData({ ...formData, currency: currency.value });
                            setShowCurrencyPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerOptionText,
                              formData.currency === currency.value && styles.pickerOptionTextActive,
                            ]}
                          >
                            {currency.label}
                          </Text>
                          {formData.currency === currency.value && (
                            <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Tax Rate (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.taxRate?.toString() || '0'}
                  onChangeText={(text) =>
                    setFormData({ ...formData, taxRate: parseFloat(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Discount (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discount?.toString() || '0'}
                  onChangeText={(text) =>
                    setFormData({ ...formData, discount: parseFloat(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity style={styles.addButton} onPress={addItem}>
              <Ionicons name="add" size={20} color={colors.background.default} />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.formCard}>
            {formData.items.length === 0 && (
              <View style={styles.emptyItemsContainer}>
                <Text style={styles.emptyItemsText}>
                  No items added. Click "Add Item" to add items.
                </Text>
              </View>
            )}
            {formData.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>Item {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.deleteItemButton}
                    onPress={() => removeItem(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product</Text>
                  <View style={styles.selectContainer}>
                    {products.length > 0 ? (
                      products.map((product) => (
                        <Pressable
                          key={product.id}
                          style={({ pressed }) => [
                            styles.selectOption,
                            item.productId === product.id && styles.selectOptionActive,
                            pressed && styles.selectOptionPressed,
                          ]}
                          onPress={() => {
                            updateItem(index, 'productId', product.id);
                            updateItem(index, 'description', product.name);
                            updateItem(index, 'unitPrice', product.unitPrice);
                          }}
                        >
                          <Text
                            style={[
                              styles.selectOptionText,
                              item.productId === product.id && styles.selectOptionTextActive,
                            ]}
                          >
                            {product.name} ({product.sku})
                          </Text>
                          {item.productId === product.id && (
                            <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                          )}
                        </Pressable>
                      ))
                    ) : (
                      <View style={styles.selectOption}>
                        <Text style={styles.selectOptionText}>No products available</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description *</Text>
                  <TextInput
                    style={styles.input}
                    value={item.description}
                    onChangeText={(value) => updateItem(index, 'description', value)}
                    placeholder="Item description"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Quantity *</Text>
                    <TextInput
                      style={styles.input}
                      value={item.quantity.toString()}
                      onChangeText={(value) =>
                        updateItem(index, 'quantity', parseFloat(value) || 0)
                      }
                      keyboardType="numeric"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                    <Text style={styles.label}>Unit Price *</Text>
                    <TextInput
                      style={styles.input}
                      value={item.unitPrice.toString()}
                      onChangeText={(value) =>
                        updateItem(index, 'unitPrice', parseFloat(value) || 0)
                      }
                      keyboardType="numeric"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Discount (%)</Text>
                    <TextInput
                      style={styles.input}
                      value={item.discount?.toString() || '0'}
                      onChangeText={(value) =>
                        updateItem(index, 'discount', parseFloat(value) || 0)
                      }
                      keyboardType="numeric"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                    <Text style={styles.label}>Item Total</Text>
                    <Text style={styles.itemTotalText}>
                      {formatCurrency(
                        item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100),
                        formData.currency
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.formCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totals.subtotal, formData.currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount ({formData.discount}%):</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(totals.discount, formData.currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({formData.taxRate}%):</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totals.taxAmount, formData.currency)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatCurrency(totals.total, formData.currency)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes & Terms</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Enter notes"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Terms</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.terms}
                onChangeText={(text) => setFormData({ ...formData, terms: text })}
                placeholder="Enter terms and conditions"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background.default} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Invoice' : 'Create Invoice'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  formCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  textArea: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectedCustomer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  selectedCustomerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
    flex: 1,
  },
  customersList: {
    marginBottom: spacing.md,
  },
  customerOption: {
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  customerOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  addButtonText: {
    color: colors.background.default,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyItemsContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  deleteItemButton: {
    padding: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.background.default,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  pickerText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  pickerPlaceholder: {
    color: colors.text.secondary,
  },
  pickerContainer: {
    marginTop: spacing.xs,
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    maxHeight: 200,
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  pickerOptionTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  selectContainer: {
    marginTop: spacing.xs,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  selectOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary.main,
  },
  selectOptionPressed: {
    opacity: 0.7,
  },
  selectOptionText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  selectOptionTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    textAlign: 'right',
  },
});
