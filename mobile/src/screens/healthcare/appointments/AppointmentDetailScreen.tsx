import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import AppointmentService from '@/services/AppointmentService';
import PatientService from '@/services/PatientService';
import { Appointment, Patient } from '@/models/healthcare';
import { format } from 'date-fns';

export default function AppointmentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const appointmentData = await AppointmentService.getAppointmentById(id);
      setAppointment(appointmentData);
      if (appointmentData.patient_id) {
        try {
          const patientData = await PatientService.getPatientById(appointmentData.patient_id);
          setPatient(patientData);
        } catch (error) {
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load appointment');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AppointmentService.deleteAppointment(id);
              Alert.alert('Success', 'Appointment deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete appointment');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    (navigation.navigate as any)('AppointmentForm', { id, appointment });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { backgroundColor: colors.blue[100], borderColor: colors.blue[500] };
      case 'confirmed':
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case 'completed':
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
      case 'cancelled':
        return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
      case 'no_show':
        return { backgroundColor: colors.yellow[100], borderColor: colors.yellow[500] };
      default:
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
    }
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Appointment Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container safeArea>
        <Header title="Appointment Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Appointment not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Appointment Details"
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
            <Text style={styles.appointmentType}>{appointment.type}</Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(appointment.status)]}>
              <Text style={styles.statusText}>{appointment.status}</Text>
            </View>
          </View>
          {patient && (
            <Text style={styles.patientName}>
              {patient.firstName} {patient.lastName}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoText}>
                {format(new Date(appointment.appointmentDate), 'MMMM dd, yyyy')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={styles.infoText}>{appointment.appointmentTime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="hourglass-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoText}>{appointment.duration} minutes</Text>
            </View>
            {appointment.reason && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Reason:</Text>
                <Text style={styles.infoText}>{appointment.reason}</Text>
              </View>
            )}
            {appointment.notes && (
              <View style={styles.infoRow}>
                <Ionicons name="clipboard-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Notes:</Text>
                <Text style={styles.infoText}>{appointment.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {patient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patient Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.patientId}>ID: {patient.patientId}</Text>
              {patient.email && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => handleEmail(patient.email!)}
                >
                  <Ionicons name="mail-outline" size={20} color={colors.primary.main} />
                  <Text style={styles.infoText}>{patient.email}</Text>
                </TouchableOpacity>
              )}
              {patient.phone && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => handleCall(patient.phone!)}
                >
                  <Ionicons name="call-outline" size={20} color={colors.primary.main} />
                  <Text style={styles.infoText}>{patient.phone}</Text>
                </TouchableOpacity>
              )}
              {patient.mobile && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => handleCall(patient.mobile!)}
                >
                  <Ionicons name="phone-portrait-outline" size={20} color={colors.primary.main} />
                  <Text style={styles.infoText}>{patient.mobile}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Reminder Sent:</Text>
              <Text style={styles.infoText}>
                {appointment.reminderSent ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoText}>
                {format(new Date(appointment.createdAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoText}>
                {format(new Date(appointment.updatedAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Appointment</Text>
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
  appointmentType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  patientName: {
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
    minWidth: 80,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
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
