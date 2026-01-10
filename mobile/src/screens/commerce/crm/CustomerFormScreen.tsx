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
import CRMService from '@/services/CRMService';
import { Customer, CustomerCreate } from '@/models/crm';

export default function CustomerFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, customer } = route.params as { id?: string; customer?: Customer };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerCreate>({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    mobile: customer?.mobile || '',
    cnic: customer?.cnic || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    country: customer?.country || 'Pakistan',
    postalCode: customer?.postalCode || '',
    customerType: customer?.customerType || 'individual',
    customerStatus: customer?.customerStatus || 'active',
    creditLimit: customer?.creditLimit || 0,
    paymentTerms: customer?.paymentTerms || 'Cash',
    tags: customer?.tags || [],
  });

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert('Validation Error', 'Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await CRMService.updateCustomer(id, formData);
        Alert.alert('Success', 'Customer updated successfully');
      } else {
        await CRMService.createCustomer(formData);
        Alert.alert('Success', 'Customer created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CustomerCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Customer' : 'New Customer'} gradient={false} />
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
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(value) => updateField('firstName', value)}
                placeholder="John"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(value) => updateField('lastName', value)}
                placeholder="Doe"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="john.doe@example.com"
                keyboardType="email-address"
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
                placeholder="+92 300 1234567"
                keyboardType="phone-pad"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                value={formData.mobile}
                onChangeText={(value) => updateField('mobile', value)}
                placeholder="+92 300 1234567"
                keyboardType="phone-pad"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CNIC</Text>
              <TextInput
                style={styles.input}
                value={formData.cnic}
                onChangeText={(value) => updateField('cnic', value)}
                placeholder="12345-1234567-1"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Type & Status</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Type</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    formData.customerType === 'individual' && styles.radioOptionActive,
                  ]}
                  onPress={() => updateField('customerType', 'individual')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.customerType === 'individual' && styles.radioTextActive,
                    ]}
                  >
                    Individual
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    formData.customerType === 'business' && styles.radioOptionActive,
                  ]}
                  onPress={() => updateField('customerType', 'business')}
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.customerType === 'business' && styles.radioTextActive,
                    ]}
                  >
                    Business
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.radioGroup}>
                {['active', 'inactive', 'blocked'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.radioOption,
                      formData.customerStatus === status && styles.radioOptionActive,
                    ]}
                    onPress={() => updateField('customerStatus', status as any)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        formData.customerStatus === status && styles.radioTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                  placeholder="Karachi"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(value) => updateField('state', value)}
                  placeholder="Sindh"
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
                  placeholder="Pakistan"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  value={formData.postalCode}
                  onChangeText={(value) => updateField('postalCode', value)}
                  placeholder="75000"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Credit Limit</Text>
              <TextInput
                style={styles.input}
                value={formData.creditLimit?.toString() || '0'}
                onChangeText={(value) => updateField('creditLimit', parseFloat(value) || 0)}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment Terms</Text>
              <View style={styles.radioGroup}>
                {['Cash', 'Credit', 'Card', 'Due Payments'].map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={[
                      styles.radioOption,
                      formData.paymentTerms === term && styles.radioOptionActive,
                    ]}
                    onPress={() => updateField('paymentTerms', term as any)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        formData.paymentTerms === term && styles.radioTextActive,
                      ]}
                    >
                      {term}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                {isEdit ? 'Update Customer' : 'Create Customer'}
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
  row: {
    flexDirection: 'row',
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
