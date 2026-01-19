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
import LabReportService from '@/services/LabReportService';
import PatientService from '@/services/PatientService';
import { apiService } from '@/services/ApiService';
import { LabReport, Patient } from '@/models/healthcare';
import { format } from 'date-fns';

export default function LabReportDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [labReport, setLabReport] = useState<LabReport | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLabReport();
  }, [id]);

  const loadLabReport = async () => {
    try {
      setLoading(true);
      const labReportData = await LabReportService.getLabReportById(id);
      setLabReport(labReportData);
      if (labReportData.patient_id) {
        try {
          const patientData = await PatientService.getPatientById(labReportData.patient_id);
          setPatient(patientData);
        } catch (error) {
        }
      }
      if (labReportData.orderedBy) {
        try {
          const response = await apiService.getUsers();
          const users = response.users || response || [];
          const foundDoctor = users.find((d: any) => String(d.id || d.userId) === String(labReportData.orderedBy));
          setDoctor(foundDoctor || null);
        } catch (error) {
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load lab report');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Lab Report',
      'Are you sure you want to delete this lab report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await LabReportService.deleteLabReport(id);
              Alert.alert('Success', 'Lab report deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete lab report');
            }
          },
        },
      ],
    );
  };

  const handleVerify = async () => {
    if (!labReport) return;
    try {
      await LabReportService.verifyLabReport(labReport.id);
      Alert.alert('Success', 'Lab report verified successfully');
      loadLabReport();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify lab report');
    }
  };

  const handleAttachmentPress = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this attachment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open attachment');
    }
  };

  const getDoctorName = () => {
    if (!doctor) return 'Unknown';
    return `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email;
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Lab Report Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!labReport) {
    return (
      <Container safeArea>
        <Header title="Lab Report Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Lab report not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Lab Report Details"
        gradient={false}
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
            <Text style={styles.reportTitle}>{labReport.reportNumber}</Text>
            {labReport.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.green[600]} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.unverifiedBadge}>
                <Text style={styles.unverifiedText}>Unverified</Text>
              </View>
            )}
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
          <Text style={styles.sectionTitle}>Report Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="flask-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Test Name:</Text>
              <Text style={styles.infoText}>{labReport.testName}</Text>
            </View>
            {labReport.testCategory && (
              <View style={styles.infoRow}>
                <Ionicons name="folder-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoText}>{labReport.testCategory}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Report Date:</Text>
              <Text style={styles.infoText}>
                {format(new Date(labReport.reportDate), 'MMMM dd, yyyy')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Ordered By:</Text>
              <Text style={styles.infoText}>Dr. {getDoctorName()}</Text>
            </View>
          </View>
        </View>

        {labReport.testResults && labReport.testResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            <View style={styles.infoCard}>
              {labReport.testResults.map((result: any, index: number) => (
                <View key={index} style={styles.testResultItem}>
                  <Text style={styles.testResultName}>
                    {result.testName || `Test ${index + 1}`}
                  </Text>
                  <View style={styles.testResultDetails}>
                    {result.value && (
                      <Text style={styles.testResultText}>
                        Value: {result.value} {result.unit || ''}
                      </Text>
                    )}
                    {result.referenceRange && (
                      <Text style={styles.testResultText}>
                        Reference: {result.referenceRange}
                      </Text>
                    )}
                    {result.status && (
                      <View style={[
                        styles.statusBadge,
                        result.status === 'Normal' && styles.statusNormal,
                        result.status === 'Abnormal' && styles.statusAbnormal,
                        result.status === 'Critical' && styles.statusCritical,
                      ]}>
                        <Text style={styles.statusText}>{result.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {labReport.labName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Laboratory Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Lab Name:</Text>
                <Text style={styles.infoText}>{labReport.labName}</Text>
              </View>
              {labReport.labAddress && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoText}>{labReport.labAddress}</Text>
                </View>
              )}
              {labReport.technicianName && (
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Technician:</Text>
                  <Text style={styles.infoText}>{labReport.technicianName}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {labReport.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{labReport.notes}</Text>
            </View>
          </View>
        )}

        {labReport.attachments && labReport.attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            <View style={styles.infoCard}>
              {labReport.attachments.map((attachment, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.attachmentItem}
                  onPress={() => handleAttachmentPress(attachment)}
                >
                  <Ionicons name="document-outline" size={20} color={colors.primary.main} />
                  <Text style={styles.attachmentText} numberOfLines={1}>
                    {attachment.split('/').pop() || `Attachment ${index + 1}`}
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {labReport.isVerified && labReport.verifiedAt && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.green[600]} />
                <Text style={styles.infoLabel}>Verified At:</Text>
                <Text style={styles.infoText}>
                  {format(new Date(labReport.verifiedAt), 'MMM dd, yyyy HH:mm')}
                </Text>
              </View>
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
                {format(new Date(labReport.createdAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoText}>
                {format(new Date(labReport.updatedAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {!labReport.isVerified && (
            <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.background.default} />
              <Text style={styles.verifyButtonText}>Verify Report</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Report</Text>
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
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.green[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  verifiedText: {
    fontSize: 12,
    color: colors.green[600],
    fontWeight: '600',
  },
  unverifiedBadge: {
    backgroundColor: colors.yellow[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  unverifiedText: {
    fontSize: 12,
    color: colors.yellow[600],
    fontWeight: '600',
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
  testResultItem: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  testResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  testResultDetails: {
    gap: spacing.xs,
  },
  testResultText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  statusNormal: {
    backgroundColor: colors.green[50],
  },
  statusAbnormal: {
    backgroundColor: colors.yellow[50],
  },
  statusCritical: {
    backgroundColor: colors.red[50],
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.muted,
    borderRadius: 8,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  attachmentText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  actionsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green[600],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  verifyButtonText: {
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
