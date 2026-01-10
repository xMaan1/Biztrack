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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import SalesService from '@/services/SalesService';
import CRMService from '@/services/CRMService';
import { Quote, QuoteCreate, QuoteItem } from '@/models/sales';
import { Opportunity } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function QuoteFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id, quote } = route.params as { id?: string; quote?: Quote };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [formData, setFormData] = useState<QuoteCreate>({
    title: quote?.title || '',
    description: quote?.description || '',
    opportunityId: quote?.opportunityId || '',
    validUntil: quote?.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '',
    terms: quote?.terms || '',
    notes: quote?.notes || '',
    items: quote?.items || [],
    subtotal: quote?.subtotal || 0,
    taxRate: quote?.taxRate || 0,
    taxAmount: quote?.taxAmount || 0,
    total: quote?.total || 0,
  });

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      console.log('[QuoteFormScreen] Loading opportunities...');
      const response = await CRMService.getOpportunities({}, 1, 100);
      console.log('[QuoteFormScreen] Opportunities response:', JSON.stringify(response, null, 2));
      const opps = response.opportunities || [];
      console.log('[QuoteFormScreen] Opportunities count:', opps.length);
      console.log('[QuoteFormScreen] Opportunities:', opps.map(o => ({ id: o.id, title: o.title })));
      setOpportunities(opps);
    } catch (error: any) {
      console.error('[QuoteFormScreen] Error loading opportunities:', error);
      console.error('[QuoteFormScreen] Error message:', error.message);
      console.error('[QuoteFormScreen] Error response:', error.response?.data);
    }
  };

  const handleSubmit = async () => {
    console.log('[QuoteFormScreen] Form validation check:', {
      title: formData.title,
      opportunityId: formData.opportunityId,
      validUntil: formData.validUntil,
    });

    if (!formData.title || !formData.opportunityId || !formData.validUntil) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      console.log('[QuoteFormScreen] Submitting form data:', JSON.stringify(formData, null, 2));
      console.log('[QuoteFormScreen] Is edit mode:', isEdit);
      console.log('[QuoteFormScreen] Quote ID:', id);
      
      if (isEdit && id) {
        console.log('[QuoteFormScreen] Updating quote...');
        await SalesService.updateQuote(id, formData);
        Alert.alert('Success', 'Quote updated successfully');
      } else {
        console.log('[QuoteFormScreen] Creating new quote...');
        await SalesService.createQuote(formData);
        Alert.alert('Success', 'Quote created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      console.error('[QuoteFormScreen] Error in handleSubmit:', error);
      console.error('[QuoteFormScreen] Error message:', error.message);
      console.error('[QuoteFormScreen] Error response:', error.response?.data);
      Alert.alert('Error', error.message || 'Failed to save quote');
    } finally {
      setLoading(false);
    }
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
          total: 0,
        },
      ],
    }));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      const quantity = newItems[index].quantity;
      const unitPrice = newItems[index].unitPrice;
      const discount = newItems[index].discount;
      const subtotal = quantity * unitPrice;
      const discountAmount = subtotal * (discount / 100);
      newItems[index].total = subtotal - discountAmount;

      const subtotalSum = newItems.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotalSum * (prev.taxRate / 100);
      const total = subtotalSum + taxAmount;

      return {
        ...prev,
        items: newItems,
        subtotal: subtotalSum,
        taxAmount,
        total,
      };
    });
  };

  const removeItem = (index: number) => {
    setFormData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const subtotalSum = newItems.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotalSum * (prev.taxRate / 100);
      const total = subtotalSum + taxAmount;
      return {
        ...prev,
        items: newItems,
        subtotal: subtotalSum,
        taxAmount,
        total,
      };
    });
  };

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Quote' : 'New Quote'} gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, title: value }))}
                placeholder="Quote title"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                placeholder="Quote description"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Opportunity *</Text>
              {opportunities.length === 0 ? (
                <View style={styles.emptyOpportunitiesContainer}>
                  <Text style={styles.emptyOpportunitiesText}>
                    No opportunities available. Please create an opportunity first.
                  </Text>
                </View>
              ) : (
                <View style={styles.selectContainer}>
                  {opportunities.map((opp) => (
                    <TouchableOpacity
                      key={opp.id}
                      style={[
                        styles.selectOption,
                        formData.opportunityId === opp.id && styles.selectOptionActive,
                      ]}
                      onPress={() => {
                        console.log('[QuoteFormScreen] Opportunity selected:', opp.id, opp.title);
                        setFormData((prev) => ({ ...prev, opportunityId: opp.id }));
                      }}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          formData.opportunityId === opp.id && styles.selectOptionTextActive,
                        ]}
                      >
                        {opp.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Valid Until *</Text>
              <TextInput
                style={styles.input}
                value={formData.validUntil}
                onChangeText={(value) => setFormData((prev) => ({ ...prev, validUntil: value }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
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
                <Text style={styles.emptyItemsText}>No items added. Click "Add Item" to add items.</Text>
              </View>
            )}
            {formData.items.map((item, index) => (
              <View key={`item-${index}-${item.description || 'new'}`} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>Item {index + 1}</Text>
                  <TouchableOpacity 
                    style={styles.deleteItemButton}
                    onPress={() => removeItem(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
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
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={item.quantity.toString()}
                      onChangeText={(value) => updateItem(index, 'quantity', parseFloat(value) || 0)}
                      keyboardType="numeric"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                    <Text style={styles.label}>Unit Price</Text>
                    <TextInput
                      style={styles.input}
                      value={item.unitPrice.toString()}
                      onChangeText={(value) => updateItem(index, 'unitPrice', parseFloat(value) || 0)}
                      keyboardType="numeric"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Discount (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={item.discount.toString()}
                    onChangeText={(value) => updateItem(index, 'discount', parseFloat(value) || 0)}
                    keyboardType="numeric"
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>
                <View style={styles.itemTotalRow}>
                  <Text style={styles.itemTotalLabel}>Item Total:</Text>
                  <Text style={styles.itemTotalValue}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax & Totals</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tax Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.taxRate.toString()}
                onChangeText={(value) => {
                  const taxRate = parseFloat(value) || 0;
                  const taxAmount = formData.subtotal * (taxRate / 100);
                  const total = formData.subtotal + taxAmount;
                  setFormData((prev) => ({ ...prev, taxRate, taxAmount, total }));
                }}
                keyboardType="numeric"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(formData.subtotal)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax:</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(formData.taxAmount)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(formData.total)}
              </Text>
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
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Quote' : 'Create Quote'}
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
    marginBottom: spacing.sm,
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
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  selectContainer: {
    gap: spacing.xs,
  },
  selectOption: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.paper,
  },
  selectOptionActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  selectOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  selectOptionTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  emptyOpportunitiesContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.muted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyOpportunitiesText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
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
    fontWeight: '600',
    fontSize: 14,
  },
  itemCard: {
    backgroundColor: colors.background.muted,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  deleteItemButton: {
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyItemsContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  itemTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  itemTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
});
