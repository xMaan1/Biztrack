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
import PatientService from '@/services/PatientService';
import { Patient } from '@/models/healthcare';

export default function PatientDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const data = await PatientService.getPatientById(id);
      setPatient(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load patient');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Patient',
      `Are you sure you want to delete ${patient?.firstName} ${patient?.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await PatientService.deletePatient(id);
              Alert.alert('Success', 'Patient deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete patient');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate('PatientForm' as never, { id, patient } as never);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case 'inactive':
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
      default:
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
    }
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Patient Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!patient) {
    return (
      <Container safeArea>
        <Header title="Patient Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Patient not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Patient Details"
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
            <Text style={styles.patientName}>
              {patient.firstName} {patient.lastName}
            </Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(patient.status)]}>
              <Text style={styles.statusText}>{patient.status || 'active'}</Text>
            </View>
          </View>
          <Text style={styles.patientId}>{patient.patientId}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            {patient.dateOfBirth && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Date of Birth:</Text>
                <Text style={styles.infoText}>
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </Text>
              </View>
            )}
            {patient.gender && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Gender:</Text>
                <Text style={styles.infoText}>{patient.gender}</Text>
              </View>
            )}
            {patient.bloodGroup && (
              <View style={styles.infoRow}>
                <Ionicons name="water-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Blood Group:</Text>
                <Text style={styles.infoText}>{patient.bloodGroup}</Text>
              </View>
            )}
          </View>
        </View>

        {patient.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>{patient.address}</Text>
              </View>
              {(patient.city || patient.state || patient.country) && (
                <Text style={styles.addressText}>
                  {[patient.city, patient.state, patient.country]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              )}
              {patient.postalCode && (
                <Text style={styles.addressText}>Postal Code: {patient.postalCode}</Text>
              )}
            </View>
          </View>
        )}

        {(patient.emergencyContactName || patient.emergencyContactPhone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <View style={styles.infoCard}>
              {patient.emergencyContactName && (
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoText}>{patient.emergencyContactName}</Text>
                </View>
              )}
              {patient.emergencyContactPhone && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => handleCall(patient.emergencyContactPhone!)}
                >
                  <Ionicons name="call-outline" size={20} color={colors.primary.main} />
                  <Text style={styles.infoText}>{patient.emergencyContactPhone}</Text>
                </TouchableOpacity>
              )}
              {patient.emergencyContactRelation && (
                <View style={styles.infoRow}>
                  <Ionicons name="people-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Relation:</Text>
                  <Text style={styles.infoText}>{patient.emergencyContactRelation}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {(patient.insuranceProvider || patient.insurancePolicyNumber) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Insurance Information</Text>
            <View style={styles.infoCard}>
              {patient.insuranceProvider && (
                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Provider:</Text>
                  <Text style={styles.infoText}>{patient.insuranceProvider}</Text>
                </View>
              )}
              {patient.insurancePolicyNumber && (
                <View style={styles.infoRow}>
                  <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Policy Number:</Text>
                  <Text style={styles.infoText}>{patient.insurancePolicyNumber}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {(patient.allergies && patient.allergies.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergies</Text>
            <View style={styles.tagsContainer}>
              {patient.allergies.map((allergy, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{allergy}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(patient.chronicConditions && patient.chronicConditions.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chronic Conditions</Text>
            <View style={styles.tagsContainer}>
              {patient.chronicConditions.map((condition, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{condition}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {(patient.medications && patient.medications.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medications</Text>
            <View style={styles.tagsContainer}>
              {patient.medications.map((medication, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{medication}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {patient.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{patient.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Patient</Text>
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
  patientName: {
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
  patientId: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
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
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.lg,
    marginTop: spacing.xs,
  },
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  tagText: {
    fontSize: 12,
    color: colors.primary[700],
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
