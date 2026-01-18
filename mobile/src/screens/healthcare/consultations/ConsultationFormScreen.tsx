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
import ConsultationService from '@/services/ConsultationService';
import PatientService from '@/services/PatientService';
import { apiService } from '@/services/ApiService';
import { Consultation, ConsultationCreate, Patient } from '@/models/healthcare';

export default function ConsultationFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, consultation } = route.params as { id?: string; consultation?: Consultation };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showDoctorPicker, setShowDoctorPicker] = useState(false);
  const [formData, setFormData] = useState<ConsultationCreate>({
    patient_id: consultation?.patient_id || '',
    consultationDate: consultation?.consultationDate || '',
    consultationTime: consultation?.consultationTime || '',
    doctorId: consultation?.doctorId || '',
    chiefComplaint: consultation?.chiefComplaint || '',
    historyOfPresentIllness: consultation?.historyOfPresentIllness || '',
    physicalExamination: consultation?.physicalExamination || '',
    assessment: consultation?.assessment || '',
    plan: consultation?.plan || '',
    prescriptions: consultation?.prescriptions || [],
    followUpDate: consultation?.followUpDate || '',
    followUpNotes: consultation?.followUpNotes || '',
    vitalSigns: consultation?.vitalSigns || {},
  });

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
      const response = await apiService.getUsers();
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
    if (!formData.consultationDate) {
      Alert.alert('Validation Error', 'Please select a consultation date');
      return;
    }
    if (!formData.consultationTime) {
      Alert.alert('Validation Error', 'Please select a consultation time');
      return;
    }
    if (!formData.doctorId) {
      Alert.alert('Validation Error', 'Please select a doctor');
      return;
    }

    const patientId = formData.patient_id.trim();
    let doctorId = formData.doctorId.trim();

    if (doctorId === 'undefined' || doctorId === 'null' || !doctorId) {
      Alert.alert('Validation Error', 'Please select a valid doctor');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(patientId)) {
      Alert.alert('Validation Error', 'Invalid patient ID format');
      return;
    }
    if (!uuidRegex.test(doctorId)) {
      Alert.alert('Validation Error', 'Invalid doctor ID format. Please select a doctor from the list.');
      return;
    }

    try {
      setLoading(true);

      const payload: ConsultationCreate = {
        patient_id: patientId,
        consultationDate: formData.consultationDate,
        consultationTime: formData.consultationTime,
        doctorId: doctorId,
        chiefComplaint: formData.chiefComplaint?.trim() || undefined,
        historyOfPresentIllness: formData.historyOfPresentIllness?.trim() || undefined,
        physicalExamination: formData.physicalExamination?.trim() || undefined,
        assessment: formData.assessment?.trim() || undefined,
        plan: formData.plan?.trim() || undefined,
        prescriptions: formData.prescriptions || [],
        followUpDate: formData.followUpDate || undefined,
        followUpNotes: formData.followUpNotes?.trim() || undefined,
        vitalSigns: formData.vitalSigns || {},
      };

      if (isEdit && id) {
        await ConsultationService.updateConsultation(id, payload);
        Alert.alert('Success', 'Consultation updated successfully');
      } else {
        await ConsultationService.createConsultation(payload);
        Alert.alert('Success', 'Consultation created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save consultation');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ConsultationCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getSelectedPatientName = () => {
    const patient = patients.find((p) => p.id === formData.patient_id);
    return patient ? `${patient.firstName} ${patient.lastName} (${patient.patientId})` : 'Select patient';
  };

  const getSelectedDoctorName = () => {
    const doctor = doctors.find((d) => String(d.id || d.userId) === String(formData.doctorId));
    return doctor ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email : 'Select doctor';
  };

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Consultation' : 'New Consultation'} gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consultation Details</Text>
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
              <Text style={styles.label}>Doctor *</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDoctorPicker(!showDoctorPicker)}
              >
                <Text
                  style={[
                    styles.pickerText,
                    !formData.doctorId && styles.pickerPlaceholder,
                  ]}
                >
                  {getSelectedDoctorName()}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              {showDoctorPicker && (
                <View style={styles.pickerContainer}>
                  <ScrollView style={styles.pickerScrollView} nestedScrollEnabled>
                    {doctors.map((doctor) => {
                      const doctorId = String(doctor.id || doctor.userId);
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
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.consultationDate}
                onChangeText={(value) => updateField('consultationDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time *</Text>
              <TextInput
                style={styles.input}
                value={formData.consultationTime}
                onChangeText={(value) => updateField('consultationTime', value)}
                placeholder="HH:MM"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Chief Complaint</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.chiefComplaint}
                onChangeText={(value) => updateField('chiefComplaint', value)}
                placeholder="Chief complaint"
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>History of Present Illness</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.historyOfPresentIllness}
                onChangeText={(value) => updateField('historyOfPresentIllness', value)}
                placeholder="History of present illness"
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Physical Examination</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.physicalExamination}
                onChangeText={(value) => updateField('physicalExamination', value)}
                placeholder="Physical examination findings"
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assessment</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.assessment}
                onChangeText={(value) => updateField('assessment', value)}
                placeholder="Assessment"
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plan</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.plan}
                onChangeText={(value) => updateField('plan', value)}
                placeholder="Treatment plan"
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Follow-up Date</Text>
              <TextInput
                style={styles.input}
                value={formData.followUpDate}
                onChangeText={(value) => updateField('followUpDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Follow-up Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.followUpNotes}
                onChangeText={(value) => updateField('followUpNotes', value)}
                placeholder="Follow-up notes"
                multiline
                numberOfLines={3}
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
                {isEdit ? 'Update Consultation' : 'Create Consultation'}
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
