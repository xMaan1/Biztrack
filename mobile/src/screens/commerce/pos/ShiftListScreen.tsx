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
import POSService from '@/services/POSService';
import { POSShift, POSShiftStatus } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ShiftListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const [shifts, setShifts] = useState<POSShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<POSShiftStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNewShiftModal, setShowNewShiftModal] = useState(false);
  const [newShiftData, setNewShiftData] = useState({ openingBalance: '0', notes: '' });

  const itemsPerPage = 20;

  useEffect(() => {
    loadShifts();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadShifts();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const response = await POSService.getShifts(
        {
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
        currentPage,
        itemsPerPage,
      );
      setShifts(response.shifts || []);
      setTotalPages(response.pagination?.pages || 1);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShifts();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleOpenShift = async () => {
    try {
      const shift = await POSService.createShift({
        openingBalance: parseFloat(newShiftData.openingBalance) || 0,
        notes: newShiftData.notes || undefined,
      });
      setShowNewShiftModal(false);
      setNewShiftData({ openingBalance: '0', notes: '' });
      Alert.alert('Success', 'Shift opened successfully');
      await loadShifts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open shift');
    }
  };

  const getStatusColor = (status: POSShiftStatus) => {
    switch (status) {
      case POSShiftStatus.OPEN:
        return colors.green[600];
      case POSShiftStatus.CLOSED:
        return colors.gray[600];
      default:
        return colors.gray[600];
    }
  };

  const renderShiftItem = ({ item }: { item: POSShift }) => (
    <TouchableOpacity
      style={styles.shiftCard}
      onPress={() => (navigation.navigate as any)('ShiftDetail', { id: item.id })}
    >
      <View style={styles.shiftHeader}>
        <View style={styles.shiftInfo}>
          <Text style={styles.shiftNumber}>#{item.shiftNumber}</Text>
          <Text style={styles.shiftDate}>
            {new Date(item.openedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.shiftDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Cashier:</Text>
          <Text style={styles.detailValue}>{item.cashierName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Opening Balance:</Text>
          <Text style={styles.detailValue}>{formatCurrency(item.openingBalance)}</Text>
        </View>
        {item.closingBalance !== undefined && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Closing Balance:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.closingBalance)}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Sales:</Text>
          <Text style={[styles.detailValue, styles.salesValue]}>
            {formatCurrency(item.totalSales)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transactions:</Text>
          <Text style={styles.detailValue}>{item.totalTransactions}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shifts..."
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
          style={styles.addButton}
          onPress={() => setShowNewShiftModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.background.default} />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {Object.values(POSShiftStatus).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (loading && shifts.length > 0) {
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
      <Ionicons name="time-outline" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>No shifts found</Text>
      <TouchableOpacity
        style={styles.addButtonLarge}
        onPress={() => setShowNewShiftModal(true)}
      >
        <Ionicons name="add-circle" size={20} color={colors.background.default} />
        <Text style={styles.addButtonText}>Open First Shift</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Container safeArea>
      <Header
        title="Shifts"
        rightIcon="add"
        gradient={false}
        onRightPress={() => setShowNewShiftModal(true)}
      />
      <FlatList
        data={shifts}
        renderItem={renderShiftItem}
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

      {showNewShiftModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Open New Shift</Text>
              <TouchableOpacity onPress={() => setShowNewShiftModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Opening Balance *</Text>
                <TextInput
                  style={styles.input}
                  value={newShiftData.openingBalance}
                  onChangeText={(value) => setNewShiftData({ ...newShiftData, openingBalance: value })}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newShiftData.notes}
                  onChangeText={(value) => setNewShiftData({ ...newShiftData, notes: value })}
                  placeholder="Optional shift notes..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNewShiftModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleOpenShift}
              >
                <Text style={styles.submitButtonText}>Open Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
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
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: 12,
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
  filterChips: {
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
  shiftCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  shiftDate: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  shiftDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  salesValue: {
    color: colors.green[600],
    fontSize: 14,
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
    marginBottom: spacing.lg,
  },
  addButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderRadius: 16,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalBody: {
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.default,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  submitButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
});
