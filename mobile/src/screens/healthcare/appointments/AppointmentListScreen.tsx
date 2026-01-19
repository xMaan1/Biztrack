import React, { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import AppointmentService from '@/services/AppointmentService';
import PatientService from '@/services/PatientService';
import { Appointment, AppointmentStats, Patient } from '@/models/healthcare';
import { format } from 'date-fns';

export default function AppointmentListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd'),
  );

  const itemsPerPage = 20;

  useEffect(() => {
    loadAppointments();
    loadStats();
    loadPatients();
  }, [currentPage, statusFilter, dateFrom, dateTo, selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await AppointmentService.getAppointments(
        skip,
        itemsPerPage,
        undefined,
        undefined,
        statusFilter === 'all' ? undefined : statusFilter,
        dateFrom || undefined,
        dateTo || undefined,
      );
      const appointmentsData = response.appointments || response;
      setAppointments(appointmentsData);
      setTotalPages(Math.ceil((response.total || appointmentsData.length) / itemsPerPage));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load appointments');
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

  const loadStats = async () => {
    try {
      const statsData = await AppointmentService.getAppointmentStats();
      setStats(statsData);
    } catch (error) {
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAppointments(), loadStats()]);
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

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => (navigation.navigate as any)('AppointmentDetail', { id: item.id })}
    >
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentInfo}>
          <Text style={styles.patientName}>{getPatientName(item.patient_id)}</Text>
          <Text style={styles.appointmentType}>{item.type}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {format(new Date(item.appointmentDate), 'MMM dd, yyyy')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>{item.appointmentTime}</Text>
          <Text style={styles.durationText}>({item.duration} min)</Text>
        </View>
        {item.reason && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.reason}
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
              {stats.scheduled}
            </Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.green[600] }]}>
              {stats.completed}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.red[600] }]}>
              {stats.cancelled}
            </Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.purple[600] }]}>
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
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterOptions}>
              {['all', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'].map(
                (status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      statusFilter === status && styles.filterChipActive,
                    ]}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        statusFilter === status && styles.filterChipTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loading && appointments.length > 0) {
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
      <Ionicons name="calendar-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No appointments found</Text>
      <Text style={styles.emptySubtext}>
        {statusFilter !== 'all' || dateFrom || dateTo
          ? 'Try adjusting your filters'
          : 'Schedule your first appointment to get started'}
      </Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Appointments"
        rightIcon="add"
        gradient={false}
        onRightPress={() => (navigation.navigate as any)('AppointmentForm', {})}
      />
      <FlatList
        data={appointments}
        renderItem={renderAppointmentItem}
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
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '18%',
    backgroundColor: colors.card.background,
    padding: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    textAlign: 'center',
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
  appointmentCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  appointmentType: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  appointmentDetails: {
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
  durationText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
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
