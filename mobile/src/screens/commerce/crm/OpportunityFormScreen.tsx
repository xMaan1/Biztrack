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
import { Opportunity, OpportunityCreate, OpportunityStage } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function OpportunityFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id, opportunity } = route.params as { id?: string; opportunity?: Opportunity };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OpportunityCreate>({
    title: opportunity?.title || '',
    description: opportunity?.description || '',
    stage: opportunity?.stage || OpportunityStage.PROSPECTING,
    amount: opportunity?.amount || undefined,
    probability: opportunity?.probability || 50,
    expectedCloseDate: opportunity?.expectedCloseDate ? new Date(opportunity.expectedCloseDate).toISOString().split('T')[0] : '',
    leadId: opportunity?.leadId || '',
    contactId: opportunity?.contactId || '',
    companyId: opportunity?.companyId || '',
    assignedTo: opportunity?.assignedTo || '',
    notes: opportunity?.notes || '',
    tags: opportunity?.tags || [],
  });

  const handleSubmit = async () => {
    console.log('[OpportunityFormScreen] Form validation check:', {
      title: formData.title,
      stage: formData.stage,
      amount: formData.amount,
      probability: formData.probability,
    });

    if (!formData.title) {
      Alert.alert('Validation Error', 'Please fill in the title field');
      return;
    }

    try {
      setLoading(true);
      console.log('[OpportunityFormScreen] Submitting form data:', JSON.stringify(formData, null, 2));
      console.log('[OpportunityFormScreen] Is edit mode:', isEdit);
      console.log('[OpportunityFormScreen] Opportunity ID:', id);
      
      if (isEdit && id) {
        console.log('[OpportunityFormScreen] Updating opportunity...');
        await CRMService.updateOpportunity(id, formData);
        Alert.alert('Success', 'Opportunity updated successfully');
      } else {
        console.log('[OpportunityFormScreen] Creating new opportunity...');
        await CRMService.createOpportunity(formData);
        Alert.alert('Success', 'Opportunity created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      console.error('[OpportunityFormScreen] Error in handleSubmit:', error);
      console.error('[OpportunityFormScreen] Error message:', error.message);
      console.error('[OpportunityFormScreen] Error response status:', error.response?.status);
      console.error('[OpportunityFormScreen] Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('[OpportunityFormScreen] Error response statusText:', error.response?.statusText);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to save opportunity';
      const errorDetails = error.response?.data?.error || '';
      
      Alert.alert(
        'Error',
        `${errorMessage}${errorDetails ? `\n\nDetails: ${errorDetails}` : ''}`
      );
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof OpportunityCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const stageOptions = Object.values(OpportunityStage);

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Opportunity' : 'New Opportunity'} gradient={false} />
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
                placeholder="Opportunity title"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Opportunity description"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Stage *</Text>
              <View style={styles.selectContainer}>
                {stageOptions.map((stage) => (
                  <TouchableOpacity
                    key={stage}
                    style={[
                      styles.selectOption,
                      formData.stage === stage && styles.selectOptionActive,
                    ]}
                    onPress={() => updateField('stage', stage)}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.stage === stage && styles.selectOptionTextActive,
                      ]}
                    >
                      {stage.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Details</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={formData.amount?.toString() || ''}
                onChangeText={(value) => updateField('amount', value ? parseFloat(value) : undefined)}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Probability (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.probability?.toString() || '50'}
                onChangeText={(value) => updateField('probability', value ? parseInt(value) : 50)}
                placeholder="50"
                keyboardType="numeric"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expected Close Date</Text>
              <TextInput
                style={styles.input}
                value={formData.expectedCloseDate}
                onChangeText={(value) => updateField('expectedCloseDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.formCard}>
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
                {isEdit ? 'Update Opportunity' : 'Create Opportunity'}
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
