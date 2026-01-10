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
import POSService from '@/services/POSService';
import { POSTransaction, POSTransactionStatus } from '@/models/pos';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function TransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [transaction, setTransaction] = useState<POSTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const data = await POSService.getTransaction(id);
      setTransaction(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load transaction');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: POSTransactionStatus) => {
    switch (status) {
      case POSTransactionStatus.COMPLETED:
        return colors.green[600];
      case POSTransactionStatus.PENDING:
        return colors.orange[600];
      case POSTransactionStatus.CANCELLED:
        return colors.red[600];
      case POSTransactionStatus.REFUNDED:
        return colors.blue[600];
      default:
        return colors.gray[600];
    }
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Transaction Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!transaction) {
    return (
      <Container safeArea>
        <Header title="Transaction Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Transaction not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title="Transaction Details" gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>
          <View style={styles.formCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Transaction Number</Text>
              <Text style={styles.value}>#{transaction.transactionNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(transaction.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                  {transaction.status}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Date & Time</Text>
              <Text style={styles.value}>
                {new Date(transaction.createdAt).toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Cashier</Text>
              <Text style={styles.value}>{transaction.cashierName}</Text>
            </View>
            {transaction.customerName && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Customer</Text>
                <Text style={styles.value}>{transaction.customerName}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Payment Method</Text>
              <Text style={styles.value}>{transaction.paymentMethod.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({transaction.items.length})</Text>
          <View style={styles.formCard}>
            {transaction.items.map((item, index) => (
              <View key={item.id || index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemDetails}>
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totals</Text>
          <View style={styles.formCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(transaction.subtotal)}</Text>
            </View>
            {transaction.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={[styles.totalValue, { color: colors.green[600] }]}>
                  -{formatCurrency(transaction.discount)}
                </Text>
              </View>
            )}
            {transaction.taxAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax:</Text>
                <Text style={styles.totalValue}>{formatCurrency(transaction.taxAmount)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(transaction.total)}</Text>
            </View>
          </View>
        </View>

        {transaction.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.formCard}>
              <Text style={styles.notesText}>{transaction.notes}</Text>
            </View>
          </View>
        )}
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemDetails: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  grandTotalRow: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    marginTop: spacing.sm,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.green[600],
  },
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
});
