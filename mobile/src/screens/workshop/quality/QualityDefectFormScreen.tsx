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
  QualityDefectResponse as QualityDefect,
  QualityDefectCreate,
  DefectSeverity,
  QualityPriority,
  getDefectSeverityLabel,
  getQualityPriorityLabel,
} from '@/models/qualityControl';

export default function QualityDefectFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, defect } = route.params as { id?: string; defect?: QualityDefect };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [newTag, setNewTag] = useState('');

  const [formData, setFormData] = useState<QualityDefectCreate>({
    title: defect?.title || '',
    description: defect?.description || '',
    severity: defect?.severity || DefectSeverity.MINOR,
    category: defect?.category || '',
    location: defect?.location || '',
    detected_date: defect?.detected_date
      ? defect.detected_date.split('T')[0]
      : new Date().toISOString().split('T')[0],
    detected_by_id: defect?.detected_by_id || '',
    quality_check_id: defect?.quality_check_id || '',
    production_plan_id: defect?.production_plan_id || '',
    work_order_id: defect?.work_order_id || '',
    status: defect?.status || 'open',
    priority: defect?.priority || QualityPriority.MEDIUM,
    assigned_to_id: defect?.assigned_to_id || '',
    estimated_resolution_date: defect?.estimated_resolution_date
      ? defect.estimated_resolution_date.split('T')[0]
      : '',
    actual_resolution_date: defect?.actual_resolution_date
      ? defect.actual_resolution_date.split('T')[0]
      : '',
    resolution_notes: defect?.resolution_notes || '',
    cost_impact: defect?.cost_impact || 0,
    tags: defect?.tags || [],
  });

  const severityOptions = Object.values(DefectSeverity);
  const priorityOptions = Object.values(QualityPriority);

  const isFormValid = () => {
    return formData.title.trim() !== '' && formData.detected_by_id.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await QualityControlService.updateQualityDefect(id, formData);
        Alert.alert('Success', 'Quality defect updated successfully');
      } else {
        await QualityControlService.createQualityDefect(formData);
        Alert.alert('Success', 'Quality defect created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save quality defect');
    } finally {
      setLoading(false);
    }
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
        title={isEdit ? 'Edit Quality Defect' : 'Create Quality Defect'}
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
            placeholder="Defect title"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Defect description"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Severity</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowSeverityPicker(!showSeverityPicker)}
            >
              <Text style={styles.pickerText}>
                {getDefectSeverityLabel(formData.severity)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            {showSeverityPicker && (
              <View style={styles.pickerOptions}>
                {severityOptions.map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, severity });
                      setShowSeverityPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>
                      {getDefectSeverityLabel(severity)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Priority</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowPriorityPicker(!showPriorityPicker)}
            >
              <Text style={styles.pickerText}>
                {getQualityPriorityLabel(formData.priority)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            {showPriorityPicker && (
              <View style={styles.pickerOptions}>
                {priorityOptions.map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, priority });
                      setShowPriorityPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>
                      {getQualityPriorityLabel(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(text) => setFormData({ ...formData, category: text })}
            placeholder="Defect category"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
            placeholder="Defect location"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Detected By ID *</Text>
            <TextInput
              style={styles.input}
              value={formData.detected_by_id}
              onChangeText={(text) => setFormData({ ...formData, detected_by_id: text })}
              placeholder="User ID"
              placeholderTextColor={colors.text.secondary}
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Detected Date</Text>
            <TextInput
              style={styles.input}
              value={formData.detected_date}
              onChangeText={(text) => setFormData({ ...formData, detected_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.secondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <TextInput
            style={styles.input}
            value={formData.status}
            onChangeText={(text) => setFormData({ ...formData, status: text })}
            placeholder="open, in_progress, resolved, closed"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Cost Impact</Text>
          <TextInput
            style={styles.input}
            value={formData.cost_impact?.toString() || '0'}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                cost_impact: parseFloat(text) || 0,
              })
            }
            placeholder="0"
            placeholderTextColor={colors.text.secondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Resolution Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.resolution_notes}
            onChangeText={(text) => setFormData({ ...formData, resolution_notes: text })}
            placeholder="Resolution notes"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
          />
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
                {isEdit ? 'Update Quality Defect' : 'Create Quality Defect'}
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
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: spacing.sm,
  },
  pickerText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  pickerOptions: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    marginTop: spacing.xs,
    maxHeight: 200,
  },
  pickerOption: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.text.primary,
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
