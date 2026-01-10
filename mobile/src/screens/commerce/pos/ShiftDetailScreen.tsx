import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import POSService from '@/services/POSService';
import { POSShift, POSShiftStatus } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ShiftDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [shift, setShift] = useState<POSShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingShift, setClosingShift] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeData, setCloseData] = useState({ closingBalance: '', notes: '' });

  useEffect(() => {
    loadShift();
  }, [id]);

  const loadShift = async () => {
    try {
      setLoading(true);
      const data = await POSService.getShift(id);
      setShift(data);
      if (data.closingBalance !== undefined) {
        setCloseData({
          closingBalance: data.closingBalance.toString(),
          notes: data.notes || '',
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load shift');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!shift) return;

    const closingBalance = parseFloat(closeData.closingBalance);
    if (isNaN(closingBalance)) {
      Alert.alert('Validation Error', 'Please enter a valid closing balance');
      return;
    }

    setClosingShift(true);
    try {
      await POSService.updateShift(shift.id, {
        status: POSShiftStatus.CLOSED,
        closingBalance,
        notes: closeData.notes || undefined,
      });
      setShowCloseModal(false);
      Alert.alert('Success', 'Shift closed successfully');
      await loadShift();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to close shift');
    } finally {
      setClosingShift(false);
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

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Shift Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!shift) {
    return (
      <Container safeArea>
        <Header title="Shift Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Shift not found</Text>
        </View>
      </Container>
    );
  }

  const duration = shift.closedAt
    ? Math.floor((new Date(shift.closedAt).getTime() - new Date(shift.openedAt).getTime()) / (1000 * 60 * 60))
    : Math.floor((Date.now() - new Date(shift.openedAt).getTime()) / (1000 * 60 * 60));

  return (
    <Container safeArea>
      <Header
        title="Shift Details"
        rightIcon={shift.status === POSShiftStatus.OPEN ? 'close-circle' : undefined}
        gradient={false}
        onRightPress={shift.status === POSShiftStatus.OPEN ? () => setShowCloseModal(true) : undefined}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shift Information</Text>
          <View style={styles.formCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Shift Number</Text>
              <Text style={styles.value}>#{shift.shiftNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(shift.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(shift.status) }]}>
                  {shift.status}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Cashier</Text>
              <Text style={styles.value}>{shift.cashierName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Opened At</Text>
              <Text style={styles.value}>
                {new Date(shift.openedAt).toLocaleString()}
              </Text>
            </View>
            {shift.closedAt && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Closed At</Text>
                <Text style={styles.value}>
                  {new Date(shift.closedAt).toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>{duration} hours</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.formCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Opening Balance</Text>
              <Text style={[styles.value, styles.amountValue]}>
                {formatCurrency(shift.openingBalance)}
              </Text>
            </View>
            {shift.closingBalance !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Closing Balance</Text>
                <Text style={[styles.value, styles.amountValue]}>
                  {formatCurrency(shift.closingBalance)}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Sales</Text>
              <Text style={[styles.value, styles.salesValue]}>
                {formatCurrency(shift.totalSales)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Total Transactions</Text>
              <Text style={styles.value}>{shift.totalTransactions}</Text>
            </View>
          </View>
        </View>

        {shift.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.formCard}>
              <Text style={styles.notesText}>{shift.notes}</Text>
            </View>
          </View>
        )}

        {shift.status === POSShiftStatus.OPEN && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowCloseModal(true)}
          >
            <Ionicons name="close-circle" size={20} color={colors.background.default} />
            <Text style={styles.closeButtonText}>Close Shift</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {showCloseModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Close Shift</Text>
              <TouchableOpacity onPress={() => setShowCloseModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Closing Balance *</Text>
                <TextInput
                  style={styles.input}
                  value={closeData.closingBalance}
                  onChangeText={(value) => setCloseData({ ...closeData, closingBalance: value })}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={closeData.notes}
                  onChangeText={(value) => setCloseData({ ...closeData, notes: value })}
                  placeholder="Optional closing notes..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCloseModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, closingShift && styles.submitButtonDisabled]}
                onPress={handleCloseShift}
                disabled={closingShift}
              >
                {closingShift ? (
                  <ActivityIndicator color={colors.background.default} />
                ) : (
                  <Text style={styles.submitButtonText}>Close Shift</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    paddingVertical: spacing['3xl'] * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  formCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: colors.text.primary,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.blue[600],
  },
  salesValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.green[600],
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red[600],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  closeButtonText: {
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
    backgroundColor: colors.red[600],
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background.default,
  },
});
