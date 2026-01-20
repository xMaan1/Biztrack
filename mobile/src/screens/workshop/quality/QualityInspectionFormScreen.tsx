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
  QualityInspectionResponse as QualityInspection,
  QualityInspectionCreate,
  QualityStatus,
  getQualityStatusLabel,
} from '@/models/qualityControl';

export default function QualityInspectionFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, inspection } = route.params as { id?: string; inspection?: QualityInspection };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [newAction, setNewAction] = useState('');

  const [formData, setFormData] = useState<QualityInspectionCreate>({
    quality_check_id: inspection?.quality_check_id || '',
    inspector_id: inspection?.inspector_id || '',
    inspection_date: inspection?.inspection_date
      ? inspection.inspection_date.split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: inspection?.status || QualityStatus.PENDING,
    results: inspection?.results || {},
    measurements: inspection?.measurements || {},
    defects_found: inspection?.defects_found || [],
    corrective_actions: inspection?.corrective_actions || [],
    notes: inspection?.notes || '',
    photos: inspection?.photos || [],
    documents: inspection?.documents || [],
    compliance_score: inspection?.compliance_score || 0,
  });

  const statusOptions = Object.values(QualityStatus);

  const isFormValid = () => {
    return formData.quality_check_id.trim() !== '' && formData.inspector_id.trim() !== '';
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await QualityControlService.updateQualityInspection(id, formData);
        Alert.alert('Success', 'Quality inspection updated successfully');
      } else {
        await QualityControlService.createQualityInspection(formData);
        Alert.alert('Success', 'Quality inspection created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save quality inspection');
    } finally {
      setLoading(false);
    }
  };

  const addAction = () => {
    if (newAction.trim() && !formData.corrective_actions?.includes(newAction.trim())) {
      setFormData({
        ...formData,
        corrective_actions: [...(formData.corrective_actions || []), newAction.trim()],
      });
      setNewAction('');
    }
  };

  const removeAction = (index: number) => {
    const updated = [...(formData.corrective_actions || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, corrective_actions: updated });
  };

  return (
    <Container safeArea>
      <Header
        title={isEdit ? 'Edit Quality Inspection' : 'Create Quality Inspection'}
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
          <Text style={styles.label}>Quality Check ID *</Text>
          <TextInput
            style={styles.input}
            value={formData.quality_check_id}
            onChangeText={(text) => setFormData({ ...formData, quality_check_id: text })}
            placeholder="Quality check ID"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Inspector ID *</Text>
          <TextInput
            style={styles.input}
            value={formData.inspector_id}
            onChangeText={(text) => setFormData({ ...formData, inspector_id: text })}
            placeholder="Inspector ID"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Inspection Date</Text>
            <TextInput
              style={styles.input}
              value={formData.inspection_date}
              onChangeText={(text) => setFormData({ ...formData, inspection_date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.secondary}
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Status</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
            >
              <Text style={styles.pickerText}>
                {getQualityStatusLabel(formData.status)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            {showStatusPicker && (
              <View style={styles.pickerOptions}>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, status });
                      setShowStatusPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>
                      {getQualityStatusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Compliance Score</Text>
          <TextInput
            style={styles.input}
            value={formData.compliance_score?.toString() || '0'}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                compliance_score: parseInt(text) || 0,
              })
            }
            placeholder="0"
            placeholderTextColor={colors.text.secondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Inspection notes"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Corrective Actions</Text>
          {formData.corrective_actions && formData.corrective_actions.length > 0 && (
            <View style={styles.listContainer}>
              {formData.corrective_actions.map((action, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listItemText}>{action}</Text>
                  <TouchableOpacity onPress={() => removeAction(index)}>
                    <Ionicons name="close-circle" size={20} color={colors.red[600]} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <View style={styles.addContainer}>
            <TextInput
              style={[styles.input, styles.addInput]}
              value={newAction}
              onChangeText={setNewAction}
              placeholder="Add corrective action"
              placeholderTextColor={colors.text.secondary}
              onSubmitEditing={addAction}
            />
            <TouchableOpacity style={styles.addButton} onPress={addAction}>
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
                {isEdit ? 'Update Quality Inspection' : 'Create Quality Inspection'}
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
