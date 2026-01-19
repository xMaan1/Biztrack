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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import MedicalRecordService from '@/services/MedicalRecordService';
import PatientService from '@/services/PatientService';
import { MedicalRecord, MedicalRecordStats, Patient } from '@/models/healthcare';
import { format } from 'date-fns';

export default function MedicalRecordListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<MedicalRecordStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const recordTypes = [
    'Consultation',
    'Diagnosis',
    'Treatment',
    'Lab Report',
    'X-Ray',
    'Prescription',
    'Surgery',
    'Follow-up',
    'Other',
  ];

  const itemsPerPage = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadRecords();
    loadStats();
    loadPatients();
  }, [currentPage, recordTypeFilter, debouncedSearchTerm]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await MedicalRecordService.getMedicalRecords(
        skip,
        itemsPerPage,
        debouncedSearchTerm || undefined,
        recordTypeFilter === 'all' ? undefined : recordTypeFilter,
      );
      const recordsData = response.records || response;
      setRecords(recordsData);
      setTotalPages(Math.ceil((response.total || recordsData.length) / itemsPerPage));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load medical records');
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
      const statsData = await MedicalRecordService.getMedicalRecordStats();
      setStats(statsData);
    } catch (error) {
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRecords(), loadStats()]);
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

  const renderRecordItem = ({ item }: { item: MedicalRecord }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => (navigation.navigate as any)('MedicalRecordDetail', { id: item.id })}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordInfo}>
          <Text style={styles.recordTitle}>{item.title}</Text>
          <Text style={styles.patientName}>{getPatientName(item.patient_id)}</Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={[styles.typeBadge]}>
            <Text style={styles.typeText}>{item.recordType}</Text>
          </View>
          {item.isConfidential && (
            <View style={styles.confidentialBadge}>
              <Ionicons name="lock-closed" size={12} color={colors.red[600]} />
            </View>
          )}
        </View>
      </View>
      <View style={styles.recordDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.detailText}>
            {format(new Date(item.visitDate), 'MMM dd, yyyy')}
          </Text>
        </View>
        {item.diagnosis && (
          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.diagnosis}
            </Text>
          </View>
        )}
        {item.description && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.description}
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
          {Object.entries(stats.byType).slice(0, 4).map(([type, count]) => (
            <View key={type} style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary.main }]}>
                {String(count)}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {type}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search records..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={colors.text.secondary}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
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
            <Text style={styles.filterLabel}>Record Type:</Text>
            <View style={styles.filterOptions}>
              {['all', ...recordTypes].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    recordTypeFilter === type && styles.filterChipActive,
                  ]}
                  onPress={() => setRecordTypeFilter(type)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      recordTypeFilter === type && styles.filterChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loading && records.length > 0) {
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
      <Ionicons name="document-text-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No medical records found</Text>
      <Text style={styles.emptySubtext}>
        {debouncedSearchTerm || recordTypeFilter !== 'all'
          ? 'Try adjusting your filters'
          : 'Create your first medical record to get started'}
      </Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Medical Records"
        rightIcon="add"
        gradient={false}
        onRightPress={() => (navigation.navigate as any)('MedicalRecordForm', {})}
      />
      <FlatList
        data={records}
        renderItem={renderRecordItem}
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
  searchContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
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
  recordCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  patientName: {
    fontSize: 14,
    color: colors.text.secondary,
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
    fontSize: 11,
    fontWeight: '600',
    color: colors.blue[700],
  },
  confidentialBadge: {
    padding: spacing.xs,
  },
  recordDetails: {
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
