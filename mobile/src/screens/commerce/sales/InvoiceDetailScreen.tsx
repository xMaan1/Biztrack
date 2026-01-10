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
import InvoiceService from '@/services/InvoiceService';
import { Invoice } from '@/models/sales';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function InvoiceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await InvoiceService.getInvoice(id);
      setInvoice(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load invoice');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await InvoiceService.deleteInvoice(id);
              Alert.alert('Success', 'Invoice deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete invoice');
            }
          },
        },
      ],
    );
  };

  const handleMarkAsPaid = async () => {
    try {
      await InvoiceService.markInvoiceAsPaid(id);
      Alert.alert('Success', 'Invoice marked as paid');
      loadInvoice();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark invoice as paid');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const statusColors: Record<string, { bg: string; border: string }> = {
      draft: { bg: colors.gray[100], border: colors.gray[500] },
      sent: { bg: colors.blue[100], border: colors.blue[500] },
      viewed: { bg: colors.yellow[100], border: colors.yellow[500] },
      paid: { bg: colors.green[100], border: colors.green[500] },
      partially_paid: { bg: colors.orange[100], border: colors.orange[500] },
      overdue: { bg: colors.red[100], border: colors.red[500] },
      cancelled: { bg: colors.red[100], border: colors.red[500] },
      void: { bg: colors.gray[100], border: colors.gray[500] },
    };
    const color = statusColors[status] || { bg: colors.gray[100], border: colors.gray[500] };
    return { backgroundColor: color.bg, borderColor: color.border };
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Invoice Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container safeArea>
        <Header title="Invoice Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Invoice not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title="Invoice Details" gradient={false} />
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
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(invoice.status)]}>
              <Text style={styles.statusText}>
                {InvoiceService.getStatusLabel(invoice.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.customerName}>{invoice.customerName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.infoCard}>
            {invoice.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDescription}>{item.description}</Text>
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
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.infoCard}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Subtotal</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(invoice.subtotal)}
              </Text>
            </View>
            {invoice.discount > 0 && (
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Discount</Text>
                <Text style={styles.financialValue}>
                  -{formatCurrency(invoice.discount)}
                </Text>
              </View>
            )}
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(invoice.taxAmount)}
              </Text>
            </View>
            <View style={[styles.financialRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.total)}
              </Text>
            </View>
            {invoice.balance > 0 && (
              <View style={[styles.financialRow, styles.balanceRow]}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <Text style={styles.balanceValue}>
                  {formatCurrency(invoice.balance)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Issue Date:</Text>
              <Text style={styles.infoText}>
                {new Date(invoice.issueDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={styles.infoText}>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </Text>
            </View>
            {invoice.billingAddress && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Billing Address:</Text>
                <Text style={styles.infoText}>{invoice.billingAddress}</Text>
              </View>
            )}
            {invoice.notes && (
              <View style={styles.infoRow}>
                <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Notes:</Text>
                <Text style={styles.infoText}>{invoice.notes}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {invoice.status !== 'paid' && invoice.balance > 0 && (
            <TouchableOpacity style={styles.paidButton} onPress={handleMarkAsPaid}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.background.default} />
              <Text style={styles.paidButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Invoice</Text>
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
    marginBottom: spacing.xs,
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
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
  },
  customerName: {
    fontSize: 16,
    color: colors.text.secondary,
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
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
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
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  financialLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  balanceRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.red[600],
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
  actionsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  paidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green[600],
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  paidButtonText: {
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
