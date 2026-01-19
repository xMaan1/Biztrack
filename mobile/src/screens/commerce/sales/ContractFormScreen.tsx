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
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import SalesService from '@/services/SalesService';
import CRMService from '@/services/CRMService';
import { Contract, ContractCreate, ContractStatus } from '@/models/sales';
import { Opportunity, Company, Contact } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ContractFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id, contract } = route.params as { id?: string; contract?: Contract };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState<ContractCreate>({
    title: contract?.title || '',
    description: contract?.description || '',
    opportunityId: contract?.opportunityId || '',
    contactId: contract?.contactId || '',
    companyId: contract?.companyId || '',
    startDate: contract?.startDate
      ? new Date(contract.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    endDate: contract?.endDate
      ? new Date(contract.endDate).toISOString().split('T')[0]
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: contract?.value || 0,
    terms: contract?.terms || '',
    notes: contract?.notes || '',
    autoRenew: contract?.autoRenew ?? false,
    renewalTerms: contract?.renewalTerms || '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [opportunitiesResponse, companiesResponse, contactsResponse] = await Promise.all([
        CRMService.getOpportunities({}, 1, 100),
        CRMService.getCompanies({}, 1, 100),
        CRMService.getContacts({}, 1, 100),
      ]);
      setOpportunities(opportunitiesResponse.opportunities || []);
      setCompanies(companiesResponse.companies || []);
      setContacts(contactsResponse.contacts || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.opportunityId || !formData.startDate || !formData.endDate) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await SalesService.updateContract(id, formData);
        Alert.alert('Success', 'Contract updated successfully');
      } else {
        await SalesService.createContract(formData);
        Alert.alert('Success', 'Contract created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save contract');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ContractCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Container safeArea>
      <Header
        title={isEdit ? 'Edit Contract' : 'New Contract'}
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
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(value) => updateField('title', value)}
                placeholder="Contract title"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Contract description"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relationships</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Opportunity *</Text>
              {loadingData ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : opportunities.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No opportunities available. Create one first.
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
                      onPress={() => updateField('opportunityId', opp.id)}
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
              <Text style={styles.label}>Company</Text>
              {loadingData ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : companies.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No companies available</Text>
                </View>
              ) : (
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectOption,
                      !formData.companyId && styles.selectOptionActive,
                    ]}
                    onPress={() => updateField('companyId', '')}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        !formData.companyId && styles.selectOptionTextActive,
                      ]}
                    >
                      No Company
                    </Text>
                  </TouchableOpacity>
                  {companies.map((company) => (
                    <TouchableOpacity
                      key={company.id}
                      style={[
                        styles.selectOption,
                        formData.companyId === company.id && styles.selectOptionActive,
                      ]}
                      onPress={() => updateField('companyId', company.id)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          formData.companyId === company.id && styles.selectOptionTextActive,
                        ]}
                      >
                        {company.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact</Text>
              {loadingData ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : contacts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No contacts available</Text>
                </View>
              ) : (
                <View style={styles.selectContainer}>
                  <TouchableOpacity
                    style={[
                      styles.selectOption,
                      !formData.contactId && styles.selectOptionActive,
                    ]}
                    onPress={() => updateField('contactId', '')}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        !formData.contactId && styles.selectOptionTextActive,
                      ]}
                    >
                      No Contact
                    </Text>
                  </TouchableOpacity>
                  {contacts.map((contact) => (
                    <TouchableOpacity
                      key={contact.id}
                      style={[
                        styles.selectOption,
                        formData.contactId === contact.id && styles.selectOptionActive,
                      ]}
                      onPress={() => updateField('contactId', contact.id)}
                    >
                      <Text
                        style={[
                          styles.selectOptionText,
                          formData.contactId === contact.id && styles.selectOptionTextActive,
                        ]}
                      >
                        {contact.firstName} {contact.lastName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contract Details</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Start Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.startDate}
                  onChangeText={(value) => updateField('startDate', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>End Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.endDate}
                  onChangeText={(value) => updateField('endDate', value)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contract Value</Text>
              <TextInput
                style={styles.input}
                value={formData.value?.toString() || '0'}
                onChangeText={(value) => updateField('value', parseFloat(value) || 0)}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={[styles.inputGroup, styles.switchRow]}>
              <Text style={styles.label}>Auto Renew</Text>
              <Switch
                value={formData.autoRenew}
                onValueChange={(value) => updateField('autoRenew', value)}
                trackColor={{ false: colors.gray[300], true: colors.blue[300] }}
                thumbColor={formData.autoRenew ? colors.primary.main : colors.gray[500]}
              />
            </View>
            {formData.autoRenew && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Renewal Terms</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.renewalTerms}
                  onChangeText={(value) => updateField('renewalTerms', value)}
                  placeholder="Renewal terms and conditions"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Terms & Notes</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Terms & Conditions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.terms}
                onChangeText={(value) => updateField('terms', value)}
                placeholder="Terms and conditions"
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                placeholder="Additional notes"
                multiline
                numberOfLines={4}
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
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Contract' : 'Create Contract'}
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: spacing.md,
    backgroundColor: colors.background.muted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
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