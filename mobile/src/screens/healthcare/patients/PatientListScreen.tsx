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
import PatientService from '@/services/PatientService';
import { Patient, PatientStats } from '@/models/healthcare';

export default function PatientListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    loadPatients();
    loadStats();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1);
        loadPatients();
      } else if (searchTerm === '') {
        setCurrentPage(1);
        loadPatients();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await PatientService.getPatients(
        skip,
        itemsPerPage,
        searchTerm || undefined,
        statusFilter === 'all' ? undefined : statusFilter,
      );
      const patientsData = response.patients || response;
      setPatients(patientsData);
      setTotalPages(Math.ceil((response.total || patientsData.length) / itemsPerPage));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await PatientService.getPatientStats();
      setStats(statsData);
    } catch (error) {
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPatients(), loadStats()]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => navigation.navigate('PatientDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.patientId}>{item.patientId}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusBadgeStyle(item.status || 'active')]}>
          <Text style={styles.statusText}>{item.status || 'active'}</Text>
        </View>
      </View>
      <View style={styles.patientDetails}>
        {item.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.mobile && (
          <View style={styles.detailRow}>
            <Ionicons name="phone-portrait-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.mobile}</Text>
          </View>
        )}
        {item.dateOfBirth && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>
              {new Date(item.dateOfBirth).toLocaleDateString()}
            </Text>
          </View>
        )}
        {item.gender && (
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>{item.gender}</Text>
          </View>
        )}
        {item.bloodGroup && (
          <View style={styles.detailRow}>
            <Ionicons name="water-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.detailText}>Blood Group: {item.bloodGroup}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case 'inactive':
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
      default:
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
    }
  };

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
              {stats.active}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.gray[600] }]}>
              {stats.inactive}
            </Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>
      )}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
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
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterOptions}>
              {['all', 'active', 'inactive'].map((status) => (
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
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loading && patients.length > 0) {
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
      <Ionicons name="people-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No patients found</Text>
      <Text style={styles.emptySubtext}>
        {searchTerm || statusFilter !== 'all'
          ? 'Try adjusting your filters'
          : 'Create your first patient to get started'}
      </Text>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Patients"
        rightIcon="add"
        gradient={false}
        onRightPress={() => navigation.navigate('PatientForm' as never, {} as never)}
      />
      <FlatList
        data={patients}
        renderItem={renderPatientItem}
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
  patientCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  patientId: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
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
  patientDetails: {
    marginBottom: spacing.sm,
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
