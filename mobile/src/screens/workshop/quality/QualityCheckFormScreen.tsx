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
import QualityControlService from '@/services/QualityControlService';
import {
  QualityCheckResponse as QualityCheck,
  QualityCheckCreate,
  InspectionType,
  QualityPriority,
  QualityStandard,
  getInspectionTypeLabel,
  getQualityPriorityLabel,
  getQualityStandardLabel,
} from '@/models/qualityControl';

export default function QualityCheckFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, qualityCheck } = route.params as { id?: string; qualityCheck?: QualityCheck };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [showInspectionTypePicker, setShowInspectionTypePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showStandardPicker, setShowStandardPicker] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newTag, setNewTag] = useState('');

  const [formData, setFormData] = useState<QualityCheckCreate>({
    title: qualityCheck?.title || '',
    description: qualityCheck?.description || '',
    inspection_type: qualityCheck?.inspection_type || InspectionType.VISUAL,
    priority: qualityCheck?.priority || QualityPriority.MEDIUM,
    quality_standard: qualityCheck?.quality_standard || QualityStandard.CUSTOM,
    criteria: qualityCheck?.criteria || [],
    acceptance_criteria: qualityCheck?.acceptance_criteria || {},
    tolerance_limits: qualityCheck?.tolerance_limits || {},
    required_equipment: qualityCheck?.required_equipment || [],
    required_skills: qualityCheck?.required_skills || [],
    estimated_duration_minutes: qualityCheck?.estimated_duration_minutes || 60,
    scheduled_date: qualityCheck?.scheduled_date
      ? qualityCheck.scheduled_date.split('T')[0]
      : '',
    tags: qualityCheck?.tags || [],
  });

  const inspectionTypeOptions = Object.values(InspectionType);
  const priorityOptions = Object.values(QualityPriority);
  const standardOptions = Object.values(QualityStandard);

  const isFormValid = () => {
    return formData.title.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await QualityControlService.updateQualityCheck(id, formData);
        Alert.alert('Success', 'Quality check updated successfully');
      } else {
        await QualityControlService.createQualityCheck(formData);
        Alert.alert('Success', 'Quality check created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save quality check');
    } finally {
      setLoading(false);
    }
  };

  const addCriterion = () => {
    if (newCriterion.trim() && !formData.criteria?.includes(newCriterion.trim())) {
      setFormData({
        ...formData,
        criteria: [...(formData.criteria || []), newCriterion.trim()],
      });
      setNewCriterion('');
    }
  };

  const removeCriterion = (index: number) => {
    const updated = [...(formData.criteria || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, criteria: updated });
  };

  const addEquipment = () => {
    if (newEquipment.trim() && !formData.required_equipment?.includes(newEquipment.trim())) {
      setFormData({
        ...formData,
        required_equipment: [...(formData.required_equipment || []), newEquipment.trim()],
      });
      setNewEquipment('');
    }
  };

  const removeEquipment = (index: number) => {
    const updated = [...(formData.required_equipment || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, required_equipment: updated });
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.required_skills?.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        required_skills: [...(formData.required_skills || []), newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    const updated = [...(formData.required_skills || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, required_skills: updated });
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
        title={isEdit ? 'Edit Quality Check' : 'Create Quality Check'}
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
            placeholder="Quality check title"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Quality check description"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Inspection Type</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowInspectionTypePicker(!showInspectionTypePicker)}
            >
              <Text style={styles.pickerText}>
                {getInspectionTypeLabel(formData.inspection_type)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            {showInspectionTypePicker && (
              <View style={styles.pickerOptions}>
                {inspectionTypeOptions.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, inspection_type: type });
                      setShowInspectionTypePicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>
                      {getInspectionTypeLabel(type)}
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
          <Text style={styles.label}>Quality Standard</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowStandardPicker(!showStandardPicker)}
          >
            <Text style={styles.pickerText}>
              {getQualityStandardLabel(formData.quality_standard)}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          {showStandardPicker && (
            <View style={styles.pickerOptions}>
              {standardOptions.map((standard) => (
                <TouchableOpacity
                  key={standard}
                  style={styles.pickerOption}
                  onPress={() => {
                    setFormData({ ...formData, quality_standard: standard });
                    setShowStandardPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>
                    {getQualityStandardLabel(standard)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Estimated Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={formData.estimated_duration_minutes?.toString() || '60'}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  estimated_duration_minutes: parseInt(text) || 60,
                })
              }
              placeholder="60"
              placeholderTextColor={colors.text.secondary}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Scheduled Date</Text>
            <TextInput
              style={styles.input}
              value={formData.scheduled_date}
              onChangeText={(text) => setFormData({ ...formData, scheduled_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.secondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Criteria</Text>
          {formData.criteria && formData.criteria.length > 0 && (
            <View style={styles.listContainer}>
              {formData.criteria.map((criterion, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemText}>{criterion}</Text>
                  <TouchableOpacity onPress={() => removeCriterion(index)}>
                    <Ionicons name="close-circle" size={20} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.addContainer}>
            <TextInput
              style={[styles.input, styles.addInput]}
              value={newCriterion}
              onChangeText={setNewCriterion}
              placeholder="Add criterion"
              placeholderTextColor={colors.text.secondary}
              onSubmitEditing={addCriterion}
            />
            <TouchableOpacity style={styles.addButton} onPress={addCriterion}>
              <Ionicons name="add" size={20} color={colors.background.default} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Required Equipment</Text>
          {formData.required_equipment && formData.required_equipment.length > 0 && (
            <View style={styles.listContainer}>
              {formData.required_equipment.map((equipment, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemText}>{equipment}</Text>
                  <TouchableOpacity onPress={() => removeEquipment(index)}>
                    <Ionicons name="close-circle" size={20} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.addContainer}>
            <TextInput
              style={[styles.input, styles.addInput]}
              value={newEquipment}
              onChangeText={setNewEquipment}
              placeholder="Add equipment"
              placeholderTextColor={colors.text.secondary}
              onSubmitEditing={addEquipment}
            />
            <TouchableOpacity style={styles.addButton} onPress={addEquipment}>
              <Ionicons name="add" size={20} color={colors.background.default} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Required Skills</Text>
          {formData.required_skills && formData.required_skills.length > 0 && (
            <View style={styles.listContainer}>
              {formData.required_skills.map((skill, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemText}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(index)}>
                    <Ionicons name="close-circle" size={20} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.addContainer}>
            <TextInput
              style={[styles.input, styles.addInput]}
              value={newSkill}
              onChangeText={setNewSkill}
              placeholder="Add skill"
              placeholderTextColor={colors.text.secondary}
              onSubmitEditing={addSkill}
            />
            <TouchableOpacity style={styles.addButton} onPress={addSkill}>
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
                {isEdit ? 'Update Quality Check' : 'Create Quality Check'}
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
