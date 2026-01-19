import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import LabReportService from '@/services/LabReportService';
import PatientService from '@/services/PatientService';
import { apiService } from '@/services/ApiService';
import { LabReport, LabReportStats, Patient } from '@/models/healthcare';
import { format } from 'date-fns';

export default function LabReportListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [stats, setStats] = useState<LabReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [testCategoryFilter, setTestCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isVerifiedFilter, setIsVerifiedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const testCategories = ['Blood Test', 'Urine Test', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Biopsy', 'Culture', 'Other'];

  const itemsPerPage = 20;

  useEffect(() => {
    loadLabReports();
    loadStats();
    loadPatients();
    loadDoctors();
  }, [currentPage, patientFilter, doctorFilter, testCategoryFilter, dateFrom, dateTo, isVerifiedFilter]);

  const loadLabReports = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await LabReportService.getLabReports(
        skip,
        itemsPerPage,
        patientFilter === 'all' ? undefined : patientFilter,
        doctorFilter === 'all' ? undefined : doctorFilter,
        testCategoryFilter === 'all' ? undefined : testCategoryFilter,
        dateFrom || undefined,
        dateTo || undefined,
        isVerifiedFilter === 'all' ? undefined : isVerifiedFilter === 'verified',
      );
      const labReportsData = response.labReports || response;
      setLabReports(Array.isArray(labReportsData) ? labReportsData : []);
      setTotalPages(Math.ceil((response.total || labReportsData.length) / itemsPerPage));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load lab reports');
    } finally {
      setLoading(false);
    }
  };

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

  const loadStats = async () => {
    try {
      const statsData = await LabReportService.getLabReportStats();
      setStats(statsData);
    } catch (error) {
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLabReports(), loadStats()]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleVerify = async (labReport: LabReport) => {
    try {
      await LabReportService.verifyLabReport(labReport.id);
      Alert.alert('Success', 'Lab report verified successfully');
      loadLabReports();
      loadStats();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify lab report');
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find((d) => String(d.id || d.userId) === String(doctorId));
    return doctor ? `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.email : 'Unknown';
  };

  const renderLabReportItem = ({ item }: { item: LabReport }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('LabReportDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportNumber}>{item.reportNumber}</Text>
          <Text style={styles.patientName}>{getPatientName(item.patient_id)}</Text>
        </View>
        {item.isVerified ? (
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
      <View style={styles.reportDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="flask-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.testName}</Text>
        </View>
        {item.testCategory && (
          <View style={styles.detailRow}>
            <Ionicons name="folder-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.testCategory}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {format(new Date(item.reportDate), 'MMM dd, yyyy')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>Dr. {getDoctorName(item.orderedBy)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.green[600] }]}>
              {stats.verified}
            </Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.yellow[600] }]}>
              {stats.unverified}
            </Text>
            <Text style={styles.statLabel}>Unverified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.blue[600] }]}>
              {stats.today}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>
      )}
      <View style={styles.filterContainer}>
        <View style={styles.dateFilterRow}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>From:</Text>
            <TextInput
              style={styles.dateInput}
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.secondary}
            />
          </View>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>To:</Text>
            <TextInput
              style={styles.dateInput}
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.secondary}
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color={colors.primary.main} />
        </TouchableOpacity>
      </View>
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Patient:</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  patientFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setPatientFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    patientFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {patients.slice(0, 5).map((patient) => (
                <TouchableOpacity
                  key={patient.id}
                  style={[
                    styles.filterChip,
                    patientFilter === patient.id && styles.filterChipActive,
                  ]}
                  onPress={() => setPatientFilter(patient.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      patientFilter === patient.id && styles.filterChipTextActive,
                    ]}
                  >
                    {patient.firstName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Doctor:</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  doctorFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setDoctorFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    doctorFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {doctors.slice(0, 5).map((doctor) => {
                const doctorId = String(doctor.id || doctor.userId);
                return (
                  <TouchableOpacity
                    key={doctorId}
                    style={[
                      styles.filterChip,
                      doctorFilter === doctorId && styles.filterChipActive,
                    ]}
                    onPress={() => setDoctorFilter(doctorId)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        doctorFilter === doctorId && styles.filterChipTextActive,
                      ]}
                    >
                      {doctor.firstName || doctor.email}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Category:</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  testCategoryFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setTestCategoryFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    testCategoryFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {testCategories.slice(0, 5).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    testCategoryFilter === category && styles.filterChipActive,
                  ]}
                  onPress={() => setTestCategoryFilter(category)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      testCategoryFilter === category && styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isVerifiedFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setIsVerifiedFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isVerifiedFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isVerifiedFilter === 'verified' && styles.filterChipActive,
                ]}
                onPress={() => setIsVerifiedFilter('verified')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isVerifiedFilter === 'verified' && styles.filterChipTextActive,
                  ]}
                >
                  Verified
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  isVerifiedFilter === 'unverified' && styles.filterChipActive,
                ]}
                onPress={() => setIsVerifiedFilter('unverified')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isVerifiedFilter === 'unverified' && styles.filterChipTextActive,
                  ]}
                >
                  Unverified
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loading && labReports.length > 0) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.primary.main} />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="flask-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No lab reports found</Text>
      <Text style={styles.emptySubtext}>
        {patientFilter !== 'all' || doctorFilter !== 'all' || testCategoryFilter !== 'all' || dateFrom || dateTo || isVerifiedFilter !== 'all'
          ? 'Try adjusting your filters'
          : 'No lab reports available'}
      </Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Lab Reports"
        gradient={false}
      />
      <FlatList
        data={labReports}
        renderItem={renderLabReportItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card.background,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  dateFilterRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  dateInput: {
    backgroundColor: colors.background.paper,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text.primary,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filtersContainer: {
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterRow: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  reportInfo: {
    flex: 1,
  },
  reportNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  patientName: {
    fontSize: 14,
    color: colors.text.secondary,
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
  reportDetails: {
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'] * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
