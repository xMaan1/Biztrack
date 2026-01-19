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
import ConsultationService from '@/services/ConsultationService';
import PatientService from '@/services/PatientService';
import { apiService } from '@/services/ApiService';
import { Consultation, ConsultationStats, Patient } from '@/models/healthcare';
import { format } from 'date-fns';

export default function ConsultationListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [stats, setStats] = useState<ConsultationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadConsultations();
    loadStats();
    loadPatients();
    loadDoctors();
  }, [currentPage, patientFilter, doctorFilter, dateFrom, dateTo]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await ConsultationService.getConsultations(
        skip,
        itemsPerPage,
        patientFilter === 'all' ? undefined : patientFilter,
        doctorFilter === 'all' ? undefined : doctorFilter,
        dateFrom || undefined,
        dateTo || undefined,
      );
      const consultationsData = response.consultations || response;
      setConsultations(consultationsData);
      setTotalPages(Math.ceil((response.total || consultationsData.length) / itemsPerPage));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load consultations');
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
      const statsData = await ConsultationService.getConsultationStats();
      setStats(statsData);
    } catch (error) {
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadConsultations(), loadStats()]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
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

  const renderConsultationItem = ({ item }: { item: Consultation }) => (
    <TouchableOpacity
      style={styles.consultationCard}
      onPress={() => (navigation.navigate as any)('ConsultationDetail', { id: item.id })}
    >
      <View style={styles.consultationHeader}>
        <View style={styles.consultationInfo}>
          <Text style={styles.patientName}>{getPatientName(item.patient_id)}</Text>
          <Text style={styles.doctorName}>Dr. {getDoctorName(item.doctorId)}</Text>
        </View>
      </View>
      <View style={styles.consultationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {format(new Date(item.consultationDate), 'MMM dd, yyyy')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.consultationTime}</Text>
        </View>
        {item.chiefComplaint && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.chiefComplaint}
            </Text>
          </View>
        )}
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
            <Text style={[styles.statValue, { color: colors.blue[600] }]}>
              {stats.today}
            </Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.green[600] }]}>
              {stats.thisMonth}
            </Text>
            <Text style={styles.statLabel}>This Month</Text>
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
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loading && consultations.length > 0) {
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
      <Ionicons name="medical-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No consultations found</Text>
      <Text style={styles.emptySubtext}>
        {patientFilter !== 'all' || doctorFilter !== 'all' || dateFrom || dateTo
          ? 'Try adjusting your filters'
          : 'Create your first consultation to get started'}
      </Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Consultations"
        rightIcon="add"
        gradient={false}
        onRightPress={() => (navigation.navigate as any)('ConsultationForm', {})}
      />
      <FlatList
        data={consultations}
        renderItem={renderConsultationItem}
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
  consultationCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  consultationInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  doctorName: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  consultationDetails: {
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
