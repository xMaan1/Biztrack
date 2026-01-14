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
import PatientService from '@/services/PatientService';
import { Patient, PatientCreate } from '@/models/healthcare';

export default function PatientFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, patient } = route.params as { id?: string; patient?: Patient };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PatientCreate>({
    firstName: patient?.firstName || '',
    lastName: patient?.lastName || '',
    email: patient?.email || '',
    phone: patient?.phone || '',
    mobile: patient?.mobile || '',
    dateOfBirth: patient?.dateOfBirth || '',
    gender: patient?.gender || 'male',
    bloodGroup: patient?.bloodGroup || '',
    address: patient?.address || '',
    city: patient?.city || '',
    state: patient?.state || '',
    country: patient?.country || 'Pakistan',
    postalCode: patient?.postalCode || '',
    emergencyContactName: patient?.emergencyContactName || '',
    emergencyContactPhone: patient?.emergencyContactPhone || '',
    emergencyContactRelation: patient?.emergencyContactRelation || '',
    insuranceProvider: patient?.insuranceProvider || '',
    insurancePolicyNumber: patient?.insurancePolicyNumber || '',
    allergies: patient?.allergies || [],
    chronicConditions: patient?.chronicConditions || [],
    medications: patient?.medications || [],
    notes: patient?.notes || '',
    status: patient?.status || 'active',
  });

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Validation Error', 'Please fill in all required fields (First Name, Last Name)');
      return;
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        await PatientService.updatePatient(id, formData);
        Alert.alert('Success', 'Patient updated successfully');
      } else {
        await PatientService.createPatient(formData);
        Alert.alert('Success', 'Patient created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof PatientCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Patient' : 'New Patient'} gradient={false} />
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
              <Text style={styles.label}>Email</Text>
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
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                value={formData.dateOfBirth}
                onChangeText={(value) => updateField('dateOfBirth', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.radioGroup}>
                {['male', 'female', 'other'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.radioOption,
                      formData.gender === gender && styles.radioOptionActive,
                    ]}
                    onPress={() => updateField('gender', gender as any)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        formData.gender === gender && styles.radioTextActive,
                      ]}
                    >
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group</Text>
              <TextInput
                style={styles.input}
                value={formData.bloodGroup}
                onChangeText={(value) => updateField('bloodGroup', value)}
                placeholder="A+"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.radioGroup}>
                {['active', 'inactive'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.radioOption,
                      formData.status === status && styles.radioOptionActive,
                    ]}
                    onPress={() => updateField('status', status as any)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        formData.status === status && styles.radioTextActive,
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
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={formData.emergencyContactName}
                onChangeText={(value) => updateField('emergencyContactName', value)}
                placeholder="Emergency contact name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.emergencyContactPhone}
                onChangeText={(value) => updateField('emergencyContactPhone', value)}
                placeholder="+92 300 1234567"
                keyboardType="phone-pad"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relation</Text>
              <TextInput
                style={styles.input}
                value={formData.emergencyContactRelation}
                onChangeText={(value) => updateField('emergencyContactRelation', value)}
                placeholder="Relation to patient"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insurance Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Insurance Provider</Text>
              <TextInput
                style={styles.input}
                value={formData.insuranceProvider}
                onChangeText={(value) => updateField('insuranceProvider', value)}
                placeholder="Insurance provider name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Policy Number</Text>
              <TextInput
                style={styles.input}
                value={formData.insurancePolicyNumber}
                onChangeText={(value) => updateField('insurancePolicyNumber', value)}
                placeholder="Policy number"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Allergies (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={formData.allergies?.join(', ') || ''}
                onChangeText={(value) =>
                  updateField(
                    'allergies',
                    value.split(',').map((item) => item.trim()).filter(Boolean),
                  )
                }
                placeholder="Peanuts, Penicillin"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chronic Conditions (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={formData.chronicConditions?.join(', ') || ''}
                onChangeText={(value) =>
                  updateField(
                    'chronicConditions',
                    value.split(',').map((item) => item.trim()).filter(Boolean),
                  )
                }
                placeholder="Diabetes, Hypertension"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medications (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={formData.medications?.join(', ') || ''}
                onChangeText={(value) =>
                  updateField(
                    'medications',
                    value.split(',').map((item) => item.trim()).filter(Boolean),
                  )
                }
                placeholder="Aspirin, Metformin"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.formCard}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              placeholder="Additional notes about the patient"
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.text.secondary}
            />
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
                {isEdit ? 'Update Patient' : 'Create Patient'}
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
    minHeight: 100,
    textAlignVertical: 'top',
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
