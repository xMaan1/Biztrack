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
import AppointmentService from '@/services/AppointmentService';
import PatientService from '@/services/PatientService';
import { Appointment, AppointmentCreate, Patient } from '@/models/healthcare';

export default function AppointmentFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, appointment } = route.params as { id?: string; appointment?: Appointment };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [formData, setFormData] = useState<AppointmentCreate>({
    patient_id: appointment?.patient_id || '',
    appointmentDate: appointment?.appointmentDate || '',
    appointmentTime: appointment?.appointmentTime || '',
    duration: appointment?.duration || 30,
    type: appointment?.type || '',
    status: appointment?.status || 'scheduled',
    reason: appointment?.reason || '',
    notes: appointment?.notes || '',
    doctorId: appointment?.doctorId,
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await PatientService.getPatients(0, 1000);
      const patientsData = response.patients || response;
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
    }
  };

  const handleSubmit = async () => {
    if (!formData.patient_id) {
      Alert.alert('Validation Error', 'Please select a patient');
      return;
    }
    if (!formData.appointmentDate) {
      Alert.alert('Validation Error', 'Please select an appointment date');
      return;
    }
    if (!formData.appointmentTime) {
      Alert.alert('Validation Error', 'Please select an appointment time');
      return;
    }
    if (!formData.type) {
      Alert.alert('Validation Error', 'Please enter appointment type');
      return;
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        await AppointmentService.updateAppointment(id, formData);
        Alert.alert('Success', 'Appointment updated successfully');
      } else {
        await AppointmentService.createAppointment(formData);
        Alert.alert('Success', 'Appointment created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof AppointmentCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getSelectedPatientName = () => {
    const patient = patients.find((p) => p.id === formData.patient_id);
    return patient ? `${patient.firstName} ${patient.lastName} (${patient.patientId})` : 'Select patient';
  };

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Appointment' : 'New Appointment'} gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Details</Text>
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
              <Text style={styles.label}>Date *</Text>
              <TextInput
                style={styles.input}
                value={formData.appointmentDate}
                onChangeText={(value) => updateField('appointmentDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time *</Text>
              <TextInput
                style={styles.input}
                value={formData.appointmentTime}
                onChangeText={(value) => updateField('appointmentTime', value)}
                placeholder="HH:MM"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={formData.duration?.toString() || '30'}
                onChangeText={(value) => updateField('duration', parseInt(value) || 30)}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type *</Text>
              <TextInput
                style={styles.input}
                value={formData.type}
                onChangeText={(value) => updateField('type', value)}
                placeholder="Consultation, Checkup, etc."
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.radioGroup}>
                {['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].map(
                  (status) => (
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
                  ),
                )}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reason</Text>
              <TextInput
                style={styles.input}
                value={formData.reason}
                onChangeText={(value) => updateField('reason', value)}
                placeholder="Appointment reason"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
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
                {isEdit ? 'Update Appointment' : 'Create Appointment'}
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
