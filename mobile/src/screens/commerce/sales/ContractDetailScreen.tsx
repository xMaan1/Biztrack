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
import { Contract } from '@/models/sales';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ContractDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const data = await SalesService.getContract(id);
      setContract(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load contract');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contract',
      'Are you sure you want to delete this contract?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await SalesService.deleteContract(id);
              Alert.alert('Success', 'Contract deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete contract');
            }
          },
        },
      ],
    );
  };

  const getStatusBadgeStyle = (status: string) => {
    const statusColors: Record<string, { bg: string; border: string }> = {
      draft: { bg: colors.gray[100], border: colors.gray[500] },
      pending_signature: { bg: colors.yellow[100], border: colors.yellow[500] },
      active: { bg: colors.green[100], border: colors.green[500] },
      expired: { bg: colors.orange[100], border: colors.orange[500] },
      terminated: { bg: colors.red[100], border: colors.red[500] },
    };
    const color = statusColors[status] || { bg: colors.gray[100], border: colors.gray[500] };
    return { backgroundColor: color.bg, borderColor: color.border };
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Contract Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!contract) {
    return (
      <Container safeArea>
        <Header title="Contract Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Contract not found</Text>
        </View>
      </Container>
    );
  }

  const handleEdit = () => {
    navigation.navigate('ContractForm' as never, { id, contract } as never);
  };

  return (
    <Container safeArea>
      <Header
        title="Contract Details"
        gradient={false}
        rightIcon="create-outline"
        onRightPress={handleEdit}
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
            <Text style={styles.contractTitle}>{contract.title}</Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(contract.status)]}>
              <Text style={styles.statusText}>{contract.status.replace('_', ' ')}</Text>
            </View>
          </View>
          <Text style={styles.contractNumber}>{contract.contractNumber}</Text>
        </View>

        {contract.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{contract.description}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contract Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Contract Value</Text>
              <Text style={styles.financialValue}>
                {formatCurrency(contract.value)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Start Date:</Text>
              <Text style={styles.infoText}>
                {new Date(contract.startDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>End Date:</Text>
              <Text style={styles.infoText}>
                {new Date(contract.endDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="refresh-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Auto Renew:</Text>
              <Text style={styles.infoText}>
                {contract.autoRenew ? 'Yes' : 'No'}
              </Text>
            </View>
            {contract.terms && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Terms:</Text>
                <Text style={styles.infoText}>{contract.terms}</Text>
              </View>
            )}
            {contract.notes && (
              <View style={styles.infoRow}>
                <Ionicons name="create-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Notes:</Text>
                <Text style={styles.infoText}>{contract.notes}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Contract</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Contract</Text>
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
  contractTitle: {
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
  contractNumber: {
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
    fontSize: 18,
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
