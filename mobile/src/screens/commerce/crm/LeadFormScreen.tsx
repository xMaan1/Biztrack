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
import { Lead, LeadCreate, LeadStatus, LeadSource } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function LeadFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id, lead } = route.params as { id?: string; lead?: Lead };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LeadCreate>({
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company: lead?.company || '',
    jobTitle: lead?.jobTitle || '',
    status: lead?.status || LeadStatus.NEW,
    source: lead?.source || LeadSource.OTHER,
    notes: lead?.notes || '',
    tags: lead?.tags || [],
    score: lead?.score || 0,
    budget: lead?.budget,
    timeline: lead?.timeline,
  });

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await CRMService.updateLead(id, formData);
        Alert.alert('Success', 'Lead updated successfully');
      } else {
        await CRMService.createLead(formData);
        Alert.alert('Success', 'Lead created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container safeArea>
      <Header
        title={isEdit ? 'Edit Lead' : 'New Lead'}
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
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="Enter first name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Enter last name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email"
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
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company</Text>
              <TextInput
                style={styles.input}
                value={formData.company}
                onChangeText={(text) => setFormData({ ...formData, company: text })}
                placeholder="Enter company name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Title</Text>
              <TextInput
                style={styles.input}
                value={formData.jobTitle}
                onChangeText={(text) => setFormData({ ...formData, jobTitle: text })}
                placeholder="Enter job title"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lead Details</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.optionsContainer}>
                {Object.values(LeadStatus).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionChip,
                      formData.status === status && styles.optionChipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, status })}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        formData.status === status && styles.optionChipTextActive,
                      ]}
                    >
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Source</Text>
              <View style={styles.optionsContainer}>
                {Object.values(LeadSource).map((source) => (
                  <TouchableOpacity
                    key={source}
                    style={[
                      styles.optionChip,
                      formData.source === source && styles.optionChipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, source })}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        formData.source === source && styles.optionChipTextActive,
                      ]}
                    >
                      {source.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Score</Text>
              <TextInput
                style={styles.input}
                value={formData.score?.toString() || '0'}
                onChangeText={(text) =>
                  setFormData({ ...formData, score: parseInt(text) || 0 })
                }
                placeholder="Enter score"
                keyboardType="numeric"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            {formData.budget !== undefined && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Budget</Text>
                <TextInput
                  style={styles.input}
                  value={formData.budget?.toString() || ''}
                  onChangeText={(text) =>
                    setFormData({ ...formData, budget: parseFloat(text) || undefined })
                  }
                  placeholder="Enter budget"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Timeline</Text>
              <TextInput
                style={styles.input}
                value={formData.timeline}
                onChangeText={(text) => setFormData({ ...formData, timeline: text })}
                placeholder="Enter timeline"
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
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Enter notes"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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
              <Ionicons name="checkmark-circle" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Lead' : 'Create Lead'}
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
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  textArea: {
    minHeight: 100,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  optionChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  optionChipText: {
    fontSize: 12,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  optionChipTextActive: {
    color: colors.background.default,
    fontWeight: '600',
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
});
