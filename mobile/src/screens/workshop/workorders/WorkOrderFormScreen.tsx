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
import WorkOrderService, { WorkOrder, WorkOrderCreate } from '@/services/WorkOrderService';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function WorkOrderFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id, workOrder } = route.params as { id?: string; workOrder?: WorkOrder };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [newMaterial, setNewMaterial] = useState('');
  const [newTag, setNewTag] = useState('');

  const [formData, setFormData] = useState<WorkOrderCreate>({
    title: workOrder?.title || '',
    description: workOrder?.description || '',
    work_order_type: workOrder?.work_order_type || 'production',
    status: workOrder?.status || 'draft',
    priority: workOrder?.priority || 'medium',
    planned_start_date: workOrder?.planned_start_date
      ? workOrder.planned_start_date.split('T')[0]
      : '',
    planned_end_date: workOrder?.planned_end_date
      ? workOrder.planned_end_date.split('T')[0]
      : '',
    estimated_hours: workOrder?.estimated_hours || 0,
    location: workOrder?.location || '',
    instructions: workOrder?.instructions || '',
    safety_notes: workOrder?.safety_notes || '',
    quality_requirements: workOrder?.quality_requirements || '',
    materials_required: workOrder?.materials_required || [],
    estimated_cost: workOrder?.estimated_cost || 0,
    tags: workOrder?.tags || [],
  });

  const statusOptions = ['draft', 'planned', 'in_progress', 'on_hold', 'completed', 'cancelled'];
  const priorityOptions = ['low', 'medium', 'high', 'urgent'];
  const typeOptions = ['production', 'maintenance', 'repair', 'installation', 'inspection'];

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.description.trim() !== '' &&
      formData.planned_start_date !== '' &&
      formData.planned_end_date !== '' &&
      (formData.estimated_hours ?? 0) > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await WorkOrderService.updateWorkOrder(id, formData);
        Alert.alert('Success', 'Work order updated successfully');
      } else {
        await WorkOrderService.createWorkOrder(formData);
        Alert.alert('Success', 'Work order created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save work order');
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    if (newMaterial.trim() && !formData.materials_required?.includes(newMaterial.trim())) {
      setFormData({
        ...formData,
        materials_required: [...(formData.materials_required || []), newMaterial.trim()],
      });
      setNewMaterial('');
    }
  };

  const removeMaterial = (material: string) => {
    setFormData({
      ...formData,
      materials_required: formData.materials_required?.filter((m) => m !== material) || [],
    });
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

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <Container safeArea>
      <Header
        title={isEdit ? 'Edit Work Order' : 'New Work Order'}
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
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter work order title"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe the work to be performed"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Type *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTypePicker(!showTypePicker)}
                >
                  <Text style={styles.pickerText}>
                    {WorkOrderService.getTypeIcon(formData.work_order_type)} {formData.work_order_type}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                {showTypePicker && (
                  <View style={styles.pickerContainer}>
                    {typeOptions.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.pickerOption}
                        onPress={() => {
                          setFormData({ ...formData, work_order_type: type });
                          setShowTypePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.work_order_type === type && styles.pickerOptionTextActive,
                          ]}
                        >
                          {WorkOrderService.getTypeIcon(type)} {type}
                        </Text>
                        {formData.work_order_type === type && (
                          <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Status *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowStatusPicker(!showStatusPicker)}
                >
                  <Text style={styles.pickerText}>
                    {WorkOrderService.getStatusLabel(formData.status || 'draft')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                {showStatusPicker && (
                  <View style={styles.pickerContainer}>
                    {statusOptions.map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={styles.pickerOption}
                        onPress={() => {
                          setFormData({ ...formData, status });
                          setShowStatusPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.status === status && styles.pickerOptionTextActive,
                          ]}
                        >
                          {WorkOrderService.getStatusLabel(status)}
                        </Text>
                        {formData.status === status && (
                          <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPriorityPicker(!showPriorityPicker)}
              >
                <Text style={styles.pickerText}>
                  {WorkOrderService.getPriorityLabel(formData.priority || 'medium')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              {showPriorityPicker && (
                <View style={styles.pickerContainer}>
                  {priorityOptions.map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={styles.pickerOption}
                      onPress={() => {
                        setFormData({ ...formData, priority });
                        setShowPriorityPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          formData.priority === priority && styles.pickerOptionTextActive,
                        ]}
                      >
                        {WorkOrderService.getPriorityLabel(priority)}
                      </Text>
                      {formData.priority === priority && (
                        <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduling</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Planned Start Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.planned_start_date}
                  onChangeText={(text) => setFormData({ ...formData, planned_start_date: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Planned End Date *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.planned_end_date}
                  onChangeText={(text) => setFormData({ ...formData, planned_end_date: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Hours *</Text>
              <TextInput
                style={styles.input}
                value={formData.estimated_hours?.toString() || '0'}
                onChangeText={(text) =>
                  setFormData({ ...formData, estimated_hours: parseFloat(text) || 0 })
                }
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Cost</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="e.g., Workshop A, Machine 1"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Cost</Text>
              <TextInput
                style={styles.input}
                value={formData.estimated_cost?.toString() || '0'}
                onChangeText={(text) =>
                  setFormData({ ...formData, estimated_cost: parseFloat(text) || 0 })
                }
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Work Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.instructions}
                onChangeText={(text) => setFormData({ ...formData, instructions: text })}
                placeholder="Step-by-step instructions for the work"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety & Quality</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Safety Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.safety_notes}
                onChangeText={(text) => setFormData({ ...formData, safety_notes: text })}
                placeholder="Safety precautions and requirements"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quality Requirements</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.quality_requirements}
                onChangeText={(text) => setFormData({ ...formData, quality_requirements: text })}
                placeholder="Quality standards and inspection criteria"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials Required</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newMaterial}
                  onChangeText={setNewMaterial}
                  placeholder="Add material"
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity style={styles.addButton} onPress={addMaterial}>
                  <Ionicons name="add" size={20} color={colors.background.default} />
                </TouchableOpacity>
              </View>
            </View>
            {formData.materials_required && formData.materials_required.length > 0 && (
              <View style={styles.itemsContainer}>
                {formData.materials_required.map((material, index) => (
                  <View key={index} style={styles.itemChip}>
                    <Text style={styles.itemChipText}>{material}</Text>
                    <TouchableOpacity onPress={() => removeMaterial(material)}>
                      <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add tag"
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity style={styles.addButton} onPress={addTag}>
                  <Ionicons name="add" size={20} color={colors.background.default} />
                </TouchableOpacity>
              </View>
            </View>
            {formData.tags && formData.tags.length > 0 && (
              <View style={styles.itemsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.itemChip}>
                    <Text style={styles.itemChipText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid() || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background.default} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Work Order' : 'Create Work Order'}
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
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  pickerText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  pickerContainer: {
    marginTop: spacing.xs,
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  pickerOptionTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  addItemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.muted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  itemChipText: {
    fontSize: 12,
    color: colors.text.primary,
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
