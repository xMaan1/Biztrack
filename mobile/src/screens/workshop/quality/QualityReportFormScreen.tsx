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
import QualityControlService from '@/services/QualityControlService';
import {
  QualityReportResponse as QualityReport,
  QualityReportCreate,
} from '@/models/qualityControl';

export default function QualityReportFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, report } = route.params as { id?: string; report?: QualityReport };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [newFinding, setNewFinding] = useState('');
  const [newRecommendation, setNewRecommendation] = useState('');
  const [newTag, setNewTag] = useState('');

  const [formData, setFormData] = useState<QualityReportCreate>({
    title: report?.title || '',
    report_type: report?.report_type || '',
    period_start: report?.period_start
      ? report.period_start.split('T')[0]
      : new Date().toISOString().split('T')[0],
    period_end: report?.period_end
      ? report.period_end.split('T')[0]
      : new Date().toISOString().split('T')[0],
    summary: report?.summary || '',
    key_findings: report?.key_findings || [],
    recommendations: report?.recommendations || [],
    metrics: report?.metrics || {},
    generated_by_id: report?.generated_by_id || '',
    tags: report?.tags || [],
  });

  const isFormValid = () => {
    return formData.title.trim() !== '' && formData.generated_by_id.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await QualityControlService.updateQualityReport(id, formData);
        Alert.alert('Success', 'Quality report updated successfully');
      } else {
        await QualityControlService.createQualityReport(formData);
        Alert.alert('Success', 'Quality report created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save quality report');
    } finally {
      setLoading(false);
    }
  };

  const addFinding = () => {
    if (newFinding.trim() && !formData.key_findings?.includes(newFinding.trim())) {
      setFormData({
        ...formData,
        key_findings: [...(formData.key_findings || []), newFinding.trim()],
      });
      setNewFinding('');
    }
  };

  const removeFinding = (index: number) => {
    const updated = [...(formData.key_findings || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, key_findings: updated });
  };

  const addRecommendation = () => {
    if (newRecommendation.trim() && !formData.recommendations?.includes(newRecommendation.trim())) {
      setFormData({
        ...formData,
        recommendations: [...(formData.recommendations || []), newRecommendation.trim()],
      });
      setNewRecommendation('');
    }
  };

  const removeRecommendation = (index: number) => {
    const updated = [...(formData.recommendations || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, recommendations: updated });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    const updated = [...(formData.tags || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, tags: updated });
  };

  return (
    <Container safeArea>
      <Header
        title={isEdit ? 'Edit Quality Report' : 'Create Quality Report'}
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
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Report title"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Report Type</Text>
          <TextInput
            style={styles.input}
            value={formData.report_type}
            onChangeText={(text) => setFormData({ ...formData, report_type: text })}
            placeholder="Report type"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Period Start</Text>
            <TextInput
              style={styles.input}
              value={formData.period_start}
              onChangeText={(text) => setFormData({ ...formData, period_start: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.secondary}
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Period End</Text>
            <TextInput
              style={styles.input}
              value={formData.period_end}
              onChangeText={(text) => setFormData({ ...formData, period_end: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.secondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Generated By ID *</Text>
          <TextInput
            style={styles.input}
            value={formData.generated_by_id}
            onChangeText={(text) => setFormData({ ...formData, generated_by_id: text })}
            placeholder="User ID"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Summary</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.summary}
            onChangeText={(text) => setFormData({ ...formData, summary: text })}
            placeholder="Report summary"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Key Findings</Text>
          {formData.key_findings && formData.key_findings.length > 0 && (
            <View style={styles.listContainer}>
              {formData.key_findings.map((finding, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemText}>{finding}</Text>
                  <TouchableOpacity onPress={() => removeFinding(index)}>
                    <Ionicons name="close-circle" size={20} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.addContainer}>
            <TextInput
              style={[styles.input, styles.addInput]}
              value={newFinding}
              onChangeText={setNewFinding}
              placeholder="Add key finding"
              placeholderTextColor={colors.text.secondary}
              onSubmitEditing={addFinding}
            />
            <TouchableOpacity style={styles.addButton} onPress={addFinding}>
              <Ionicons name="add" size={20} color={colors.background.default} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Recommendations</Text>
          {formData.recommendations && formData.recommendations.length > 0 && (
            <View style={styles.listContainer}>
              {formData.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemText}>{recommendation}</Text>
                  <TouchableOpacity onPress={() => removeRecommendation(index)}>
                    <Ionicons name="close-circle" size={20} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.addContainer}>
            <TextInput
              style={[styles.input, styles.addInput]}
              value={newRecommendation}
              onChangeText={setNewRecommendation}
              placeholder="Add recommendation"
              placeholderTextColor={colors.text.secondary}
              onSubmitEditing={addRecommendation}
            />
            <TouchableOpacity style={styles.addButton} onPress={addRecommendation}>
              <Ionicons name="add" size={20} color={colors.background.default} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tags</Text>
          {formData.tags && formData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {formData.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(index)}>
                    <Ionicons name="close" size={16} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.addContainer}>
            <TextInput
              style={[styles.input, styles.addInput]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag"
              placeholderTextColor={colors.text.secondary}
              onSubmitEditing={addTag}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTag}>
              <Ionicons name="add" size={20} color={colors.background.default} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.background.default} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Quality Report' : 'Create Quality Report'}
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
    fontSize: 14,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  listContainer: {
    marginBottom: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.muted,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  listItemText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  addContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.primary.main,
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.muted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.xs,
  },
  tagText: {
    fontSize: 12,
    color: colors.text.secondary,
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
