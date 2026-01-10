import React, { useState } from 'react';
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
import CRMService from '@/services/CRMService';
import { Company, CompanyCreate, Industry, CompanySize } from '@/models/crm';

export default function CompanyFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, company } = route.params as { id?: string; company?: Company };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyCreate>({
    name: company?.name || '',
    industry: company?.industry,
    size: company?.size,
    website: company?.website || '',
    phone: company?.phone || '',
    address: company?.address || '',
    city: company?.city || '',
    state: company?.state || '',
    country: company?.country || '',
    postalCode: company?.postalCode || '',
    description: company?.description || '',
    notes: company?.notes || '',
    tags: company?.tags || [],
    isActive: company?.isActive ?? true,
    annualRevenue: company?.annualRevenue,
    employeeCount: company?.employeeCount,
    foundedYear: company?.foundedYear,
  });

  const handleSubmit = async () => {
    console.log('[CompanyFormScreen] Form validation check:', {
      name: formData.name,
      nameTrimmed: formData.name.trim(),
      isEdit,
      id,
    });

    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Company name is required');
      return;
    }

    try {
      setLoading(true);
      console.log('[CompanyFormScreen] Submitting form data:', JSON.stringify(formData, null, 2));
      console.log('[CompanyFormScreen] Form data keys:', Object.keys(formData));
      console.log('[CompanyFormScreen] Is edit mode:', isEdit);
      console.log('[CompanyFormScreen] Company ID:', id);
      
      if (isEdit && id) {
        console.log('[CompanyFormScreen] Updating company...');
        await CRMService.updateCompany(id, formData);
        Alert.alert('Success', 'Company updated successfully');
      } else {
        console.log('[CompanyFormScreen] Creating new company...');
        await CRMService.createCompany(formData);
        Alert.alert('Success', 'Company created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      console.error('[CompanyFormScreen] Error in handleSubmit:', error);
      console.error('[CompanyFormScreen] Error message:', error.message);
      console.error('[CompanyFormScreen] Error response status:', error.response?.status);
      console.error('[CompanyFormScreen] Error response statusText:', error.response?.statusText);
      console.error('[CompanyFormScreen] Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[CompanyFormScreen] Error config URL:', error.config?.url);
      console.error('[CompanyFormScreen] Error config method:', error.config?.method);
      console.error('[CompanyFormScreen] Error config data:', JSON.stringify(error.config?.data, null, 2));
      
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to save company';
      const errorDetails = error.response?.data?.error || '';
      
      Alert.alert(
        'Error',
        `${errorMessage}${errorDetails ? `\n\nDetails: ${errorDetails}` : ''}`
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CompanyCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const industryOptions = Object.values(Industry);
  const sizeOptions = Object.values(CompanySize);

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Company' : 'New Company'} gradient={false} />
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
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Company name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Industry</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    !formData.industry && styles.selectOptionActive,
                  ]}
                  onPress={() => updateField('industry', undefined)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      !formData.industry && styles.selectOptionTextActive,
                    ]}
                  >
                    None
                  </Text>
                </TouchableOpacity>
                {industryOptions.map((industry) => (
                  <TouchableOpacity
                    key={industry}
                    style={[
                      styles.selectOption,
                      formData.industry === industry && styles.selectOptionActive,
                    ]}
                    onPress={() => updateField('industry', industry)}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.industry === industry && styles.selectOptionTextActive,
                      ]}
                    >
                      {industry.charAt(0).toUpperCase() + industry.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Size</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={[
                    styles.selectOption,
                    !formData.size && styles.selectOptionActive,
                  ]}
                  onPress={() => updateField('size', undefined)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      !formData.size && styles.selectOptionTextActive,
                    ]}
                  >
                    None
                  </Text>
                </TouchableOpacity>
                {sizeOptions.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.selectOption,
                      formData.size === size && styles.selectOptionActive,
                    ]}
                    onPress={() => updateField('size', size)}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.size === size && styles.selectOptionTextActive,
                      ]}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    formData.isActive && styles.radioOptionActive,
                  ]}
                  onPress={() => updateField('isActive', true)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.isActive && styles.radioTextActive,
                    ]}
                  >
                    Active
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    !formData.isActive && styles.radioOptionActive,
                  ]}
                  onPress={() => updateField('isActive', false)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      !formData.isActive && styles.radioTextActive,
                    ]}
                  >
                    Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.input}
                value={formData.website}
                onChangeText={(value) => updateField('website', value)}
                placeholder="https://example.com"
                keyboardType="url"
                autoCapitalize="none"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                placeholder="+1 (555) 123-4567"
                keyboardType="phone-pad"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(value) => updateField('address', value)}
                placeholder="Street address"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(value) => updateField('city', value)}
                  placeholder="City"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(value) => updateField('state', value)}
                  placeholder="State/Province"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.input}
                  value={formData.country}
                  onChangeText={(value) => updateField('country', value)}
                  placeholder="Country"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  value={formData.postalCode}
                  onChangeText={(value) => updateField('postalCode', value)}
                  placeholder="12345"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Annual Revenue</Text>
                <TextInput
                  style={styles.input}
                  value={formData.annualRevenue?.toString() || ''}
                  onChangeText={(value) => updateField('annualRevenue', value ? parseFloat(value) : undefined)}
                  placeholder="1000000"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Employee Count</Text>
                <TextInput
                  style={styles.input}
                  value={formData.employeeCount?.toString() || ''}
                  onChangeText={(value) => updateField('employeeCount', value ? parseInt(value) : undefined)}
                  placeholder="50"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Founded Year</Text>
              <TextInput
                style={styles.input}
                value={formData.foundedYear?.toString() || ''}
                onChangeText={(value) => {
                  const year = value ? parseInt(value) : undefined;
                  if (!year || (year >= 1800 && year <= new Date().getFullYear())) {
                    updateField('foundedYear', year);
                  }
                }}
                placeholder="2020"
                keyboardType="numeric"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Brief description of the company"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                placeholder="Additional notes about the company"
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tags (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={formData.tags?.join(', ') || ''}
                onChangeText={(value) => updateField('tags', value ? value.split(',').map(tag => tag.trim()).filter(Boolean) : [])}
                placeholder="tag1, tag2, tag3"
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
                {isEdit ? 'Update Company' : 'Create Company'}
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
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  radioOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.paper,
  },
  radioOptionActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  radioText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  radioTextActive: {
    color: colors.background.default,
    fontWeight: '600',
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
