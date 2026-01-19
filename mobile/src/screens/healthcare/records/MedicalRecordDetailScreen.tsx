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
import MedicalRecordService from '@/services/MedicalRecordService';
import PatientService from '@/services/PatientService';
import { MedicalRecord, Patient } from '@/models/healthcare';
import { format } from 'date-fns';

export default function MedicalRecordDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const recordData = await MedicalRecordService.getMedicalRecordById(id);
      setRecord(recordData);
      if (recordData.patient_id) {
        try {
          const patientData = await PatientService.getPatientById(recordData.patient_id);
          setPatient(patientData);
        } catch (error) {
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load medical record');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Medical Record',
      'Are you sure you want to delete this medical record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MedicalRecordService.deleteMedicalRecord(id);
              Alert.alert('Success', 'Medical record deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete medical record');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    (navigation.navigate as any)('MedicalRecordForm', { id, record });
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Medical Record Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!record) {
    return (
      <Container safeArea>
        <Header title="Medical Record Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Medical record not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Medical Record Details"
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
            <Text style={styles.recordTitle}>{record.title}</Text>
            <View style={styles.badgeContainer}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{record.recordType}</Text>
              </View>
              {record.isConfidential && (
                <View style={styles.confidentialBadge}>
                  <Ionicons name="lock-closed" size={16} color={colors.red[600]} />
                  <Text style={styles.confidentialText}>Confidential</Text>
                </View>
              )}
            </View>
          </View>
          {patient && (
            <Text style={styles.patientName}>
              {patient.firstName} {patient.lastName}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Visit Date:</Text>
              <Text style={styles.infoText}>
                {format(new Date(record.visitDate), 'MMMM dd, yyyy')}
              </Text>
            </View>
            {record.description && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Description:</Text>
                <Text style={styles.infoText}>{record.description}</Text>
              </View>
            )}
            {record.diagnosis && (
              <View style={styles.infoRow}>
                <Ionicons name="medical-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Diagnosis:</Text>
                <Text style={styles.infoText}>{record.diagnosis}</Text>
              </View>
            )}
            {record.treatment && (
              <View style={styles.infoRow}>
                <Ionicons name="bandage-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Treatment:</Text>
                <Text style={styles.infoText}>{record.treatment}</Text>
              </View>
            )}
          </View>
        </View>

        {patient && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patient Information</Text>
            <View style={styles.infoCard}>
              <Text style={styles.patientId}>ID: {patient.patientId}</Text>
              <Text style={styles.patientInfo}>
                {patient.firstName} {patient.lastName}
              </Text>
            </View>
          </View>
        )}

        {record.medications && record.medications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medications</Text>
            <View style={styles.tagsContainer}>
              {record.medications.map((medication, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{medication}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {record.vitalSigns && Object.keys(record.vitalSigns).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vital Signs</Text>
            <View style={styles.infoCard}>
              {Object.entries(record.vitalSigns).map(([key, value]) => (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{key}:</Text>
                  <Text style={styles.infoText}>{String(value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {record.labResults && Object.keys(record.labResults).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lab Results</Text>
            <View style={styles.infoCard}>
              {Object.entries(record.labResults).map(([key, value]) => (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{key}:</Text>
                  <Text style={styles.infoText}>{String(value)}</Text>
                </View>
              ))}
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
                {format(new Date(record.createdAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoText}>
                {format(new Date(record.updatedAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Record</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Record</Text>
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
  recordTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.blue[100],
    borderWidth: 1,
    borderColor: colors.blue[300],
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blue[700],
  },
  confidentialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.red[100],
    borderWidth: 1,
    borderColor: colors.red[300],
  },
  confidentialText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.red[700],
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
  patientInfo: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.blue[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.blue[300],
  },
  tagText: {
    fontSize: 12,
    color: colors.blue[700],
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
