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
import MedicalRecordService from '@/services/MedicalRecordService';
import PatientService from '@/services/PatientService';
import { apiService } from '@/services/ApiService';
import { MedicalRecord, MedicalRecordCreate, Patient } from '@/models/healthcare';

export default function MedicalRecordFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, record } = route.params as { id?: string; record?: MedicalRecord };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [formData, setFormData] = useState<MedicalRecordCreate>({
    patient_id: record?.patient_id || '',
    recordType: record?.recordType || '',
    title: record?.title || '',
    description: record?.description || '',
    diagnosis: record?.diagnosis || '',
    treatment: record?.treatment || '',
    medications: record?.medications || [],
    vitalSigns: record?.vitalSigns || {},
    labResults: record?.labResults || {},
    attachments: record?.attachments || [],
    visitDate: record?.visitDate || '',
    doctorId: record?.doctorId || '',
    isConfidential: record?.isConfidential || false,
  });

  const recordTypes = [
    'Consultation',
    'Diagnosis',
    'Treatment',
    'Lab Report',
    'X-Ray',
    'Prescription',
    'Surgery',
    'Follow-up',
    'Other',
  ];

  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await PatientService.getPatients(0, 1000);
      const patientsData = response.patients || response;
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await apiService.get('/users');
      const users = response.users || response || [];
      const validDoctors = users.filter((d: any) => {
        const doctorId = d.id || d.userId;
        return doctorId && doctorId !== 'undefined' && doctorId !== 'null' && String(doctorId).trim() !== '';
      });
      setDoctors(validDoctors);
    } catch (error) {
    }
  };

  const handleSubmit = async () => {
    if (!formData.patient_id) {
      Alert.alert('Validation Error', 'Please select a patient');
      return;
    }
    if (!formData.recordType) {
      Alert.alert('Validation Error', 'Please select a record type');
      return;
    }
    if (!formData.title) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }
    if (!formData.visitDate) {
      Alert.alert('Validation Error', 'Please select a visit date');
      return;
    }
    if (!formData.doctorId || formData.doctorId === '' || formData.doctorId === 'undefined' || formData.doctorId === 'null') {
      Alert.alert('Validation Error', 'Please select a doctor');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        doctorId: formData.doctorId && formData.doctorId !== 'undefined' && formData.doctorId !== 'null' ? formData.doctorId : undefined,
      };

      if (isEdit && id) {
        await MedicalRecordService.updateMedicalRecord(id, payload);
        Alert.alert('Success', 'Medical record updated successfully');
      } else {
        await MedicalRecordService.createMedicalRecord(payload);
        Alert.alert('Success', 'Medical record created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save medical record');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof MedicalRecordCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getSelectedPatientName = () => {
    const patient = patients.find((p) => p.id === formData.patient_id);
    return patient ? `${patient.firstName} ${patient.lastName} (${patient.patientId})` : 'Select patient';
  };

  const getSelectedDoctorName = () => {
    const doctor = doctors.find((d: any) => String(d.id || d.userId) === String(formData.doctorId));
    return doctor ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email : 'Select doctor';
  };

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Medical Record' : 'New Medical Record'} gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Details</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Patient *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPatientPicker(!showPatientPicker)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    !formData.patient_id && styles.pickerPlaceholder,
                  ]}
                >
                  {getSelectedPatientName()}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              {showPatientPicker && (
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScrollView} nestedScrollEnabled>
                    {patients.map((patient) => (
                      <TouchableOpacity
                        key={patient.id}
                        style={styles.pickerOption}
                        onPress={() => {
                          updateField('patient_id', patient.id);
                          setShowPatientPicker(false);
                        }}
                      >
                        <Text style={styles.pickerOptionText}>
                          {patient.firstName} {patient.lastName} ({patient.patientId})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Record Type *</Text>
              <View style={styles.radioGroup}>
                {recordTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.radioOption,
                      formData.recordType === type && styles.radioOptionActive,
                    ]}
                    onPress={() => updateField('recordType', type)}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        formData.recordType === type && styles.radioTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(value) => updateField('title', value)}
                placeholder="Record title"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Visit Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.visitDate}
                onChangeText={(value) => updateField('visitDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Doctor *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDoctorPicker(!showDoctorPicker)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    (!formData.doctorId || formData.doctorId === 'undefined' || formData.doctorId === 'null') && styles.pickerPlaceholder,
                  ]}
                >
                  {getSelectedDoctorName()}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              {showDoctorPicker && (
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScrollView} nestedScrollEnabled>
                    {doctors.length === 0 ? (
                      <View style={styles.pickerOption}>
                        <Text style={styles.pickerOptionText}>No doctors available</Text>
                      </View>
                    ) : (
                      doctors.map((doctor: any) => {
                        const doctorId = String(doctor.id || doctor.userId || '');
                        if (!doctorId || doctorId === 'undefined' || doctorId === 'null' || doctorId === '') {
                          return null;
                        }
                        return (
                          <TouchableOpacity
                            key={doctorId}
                            style={styles.pickerOption}
                            onPress={() => {
                              updateField('doctorId', doctorId);
                              setShowDoctorPicker(false);
                            }}
                          >
                            <Text style={styles.pickerOptionText}>
                              {doctor.firstName || doctor.lastName
                                ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()
                                : doctor.email}
                            </Text>
                          </TouchableOpacity>
                        );
                      }).filter(Boolean)
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Record description"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diagnosis</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.diagnosis}
                onChangeText={(value) => updateField('diagnosis', value)}
                placeholder="Diagnosis details"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Treatment</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.treatment}
                onChangeText={(value) => updateField('treatment', value)}
                placeholder="Treatment details"
                multiline
                numberOfLines={3}
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
                placeholder="Medication 1, Medication 2"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => updateField('isConfidential', !formData.isConfidential)}
                >
                  {formData.isConfidential && (
                    <Ionicons name="checkmark" size={16} color={colors.primary.main} />
                  )}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Confidential Record</Text>
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
                {isEdit ? 'Update Record' : 'Create Record'}
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: spacing.sm,
  },
  pickerText: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  pickerPlaceholder: {
    color: colors.text.secondary,
  },
  pickerContainer: {
    marginTop: spacing.xs,
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    maxHeight: 200,
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  pickerOption: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.text.primary,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text.primary,
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
