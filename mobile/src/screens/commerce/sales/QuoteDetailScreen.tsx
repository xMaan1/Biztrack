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
import SalesService from '@/services/SalesService';
import { Quote } from '@/models/sales';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function QuoteDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const data = await SalesService.getQuote(id);
      setQuote(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load quote');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Quote',
      'Are you sure you want to delete this quote?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await SalesService.deleteQuote(id);
              Alert.alert('Success', 'Quote deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete quote');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate('QuoteForm' as never, { id, quote } as never);
  };

  const getStatusBadgeStyle = (status: string) => {
    const statusColors: Record<string, { bg: string; border: string }> = {
      draft: { bg: colors.gray[100], border: colors.gray[500] },
      sent: { bg: colors.blue[100], border: colors.blue[500] },
      viewed: { bg: colors.yellow[100], border: colors.yellow[500] },
      accepted: { bg: colors.green[100], border: colors.green[500] },
      rejected: { bg: colors.red[100], border: colors.red[500] },
      expired: { bg: colors.orange[100], border: colors.orange[500] },
    };
    const color = statusColors[status] || { bg: colors.gray[100], border: colors.gray[500] };
    return { backgroundColor: color.bg, borderColor: color.border };
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Quote Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!quote) {
    return (
      <Container safeArea>
        <Header title="Quote Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Quote not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Quote Details"
        rightIcon="create-outline"
        onRightPress={handleEdit}
        gradient={false}
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
            <Text style={styles.quoteTitle}>{quote.title}</Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(quote.status)]}>
              <Text style={styles.statusText}>{quote.status}</Text>
            </View>
          </View>
          <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
        </View>

        {quote.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{quote.description}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.infoCard}>
            {quote.items.map((item, index) => (
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
                {formatCurrency(quote.subtotal)}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Tax ({quote.taxRate}%)</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(quote.taxAmount)}
              </Text>
            </View>
            <View style={[styles.financialRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(quote.total || quote.amount || 0)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Valid Until:</Text>
              <Text style={styles.infoText}>
                {new Date(quote.validUntil).toLocaleDateString()}
              </Text>
            </View>
            {quote.terms && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Terms:</Text>
                <Text style={styles.infoText}>{quote.terms}</Text>
              </View>
            )}
            {quote.notes && (
              <View style={styles.infoRow}>
                <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Notes:</Text>
                <Text style={styles.infoText}>{quote.notes}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Quote</Text>
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
  quoteTitle: {
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
  quoteNumber: {
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
