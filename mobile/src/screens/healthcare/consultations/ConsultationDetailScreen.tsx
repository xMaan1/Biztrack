import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
import { Consultation, Patient } from '@/models/healthcare';
import { format } from 'date-fns';

export default function ConsultationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultation();
  }, [id]);

  const loadConsultation = async () => {
    try {
      setLoading(true);
      const consultationData = await ConsultationService.getConsultationById(id);
      setConsultation(consultationData);
      if (consultationData.patient_id) {
        try {
          const patientData = await PatientService.getPatientById(consultationData.patient_id);
          setPatient(patientData);
        } catch (error) {
        }
      }
      if (consultationData.doctorId) {
        try {
          const response = await apiService.getUsers();
          const users = response.users || response || [];
          const foundDoctor = users.find((d: any) => String(d.id || d.userId) === String(consultationData.doctorId));
          setDoctor(foundDoctor || null);
        } catch (error) {
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load consultation');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Consultation',
      'Are you sure you want to delete this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ConsultationService.deleteConsultation(id);
              Alert.alert('Success', 'Consultation deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete consultation');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate('ConsultationForm' as never, { id, consultation } as never);
  };

  const getDoctorName = () => {
    if (!doctor) return 'Unknown';
    return `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email;
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Consultation Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!consultation) {
    return (
      <Container safeArea>
        <Header title="Consultation Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Consultation not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Consultation Details"
        gradient={false}
        rightIcon="create-outline"
        onRightPress={handleEdit}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.nameRow}>
            <Text style={styles.consultationTitle}>Consultation</Text>
          </View>
          {patient && (
            <Text style={styles.patientName}>
              {patient.firstName} {patient.lastName}
            </Text>
          )}
          {doctor && (
            <Text style={styles.doctorName}>Dr. {getDoctorName()}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consultation Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoText}>
                {format(new Date(consultation.consultationDate), 'MMMM dd, yyyy')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={styles.infoText}>{consultation.consultationTime}</Text>
            </View>
          </View>
        </View>

        {consultation.chiefComplaint && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chief Complaint</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{consultation.chiefComplaint}</Text>
            </View>
          </View>
        )}

        {consultation.historyOfPresentIllness && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>History of Present Illness</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{consultation.historyOfPresentIllness}</Text>
            </View>
          </View>
        )}

        {consultation.physicalExamination && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Physical Examination</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{consultation.physicalExamination}</Text>
            </View>
          </View>
        )}

        {consultation.assessment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assessment</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{consultation.assessment}</Text>
            </View>
          </View>
        )}

        {consultation.plan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{consultation.plan}</Text>
            </View>
          </View>
        )}

        {consultation.prescriptions && consultation.prescriptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescriptions</Text>
            <View style={styles.infoCard}>
              {consultation.prescriptions.map((prescription, index) => (
                <View key={index} style={styles.prescriptionItem}>
                  <Text style={styles.infoText}>
                    {JSON.stringify(prescription, null, 2)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {consultation.followUpDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Follow-up</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Follow-up Date:</Text>
                <Text style={styles.infoText}>
                  {format(new Date(consultation.followUpDate), 'MMMM dd, yyyy')}
                </Text>
              </View>
              {consultation.followUpNotes && (
                <Text style={[styles.infoText, { marginTop: spacing.sm }]}>
                  {consultation.followUpNotes}
                </Text>
              )}
            </View>
          </View>
        )}

        {patient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patient Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.patientId}>ID: {patient.patientId}</Text>
              {patient.email && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoText}>{patient.email}</Text>
                </View>
              )}
              {patient.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoText}>{patient.phone}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoText}>
                {format(new Date(consultation.createdAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoText}>
                {format(new Date(consultation.updatedAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Consultation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Consultation</Text>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  headerCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xs,
  },
  consultationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  doctorName: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  patientId: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
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
  infoCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: spacing.xs,
    minWidth: 100,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  prescriptionItem: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  actionsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red[600],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
});
