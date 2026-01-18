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
import MedicalSupplyService from '@/services/MedicalSupplyService';
import { MedicalSupply } from '@/models/healthcare';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function SupplyDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const { formatCurrency } = useCurrency();
  const [supply, setSupply] = useState<MedicalSupply | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSupply();
  }, [id]);

  const loadSupply = async () => {
    try {
      setLoading(true);
      const data = await MedicalSupplyService.getMedicalSupply(id);
      setSupply(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load medical supply');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Medical Supply',
      `Are you sure you want to delete ${supply?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MedicalSupplyService.deleteMedicalSupply(id);
              Alert.alert('Success', 'Medical supply deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete medical supply');
            }
          },
        },
      ],
    );
  };

  const isLowStock = (supply: MedicalSupply) => {
    return supply.stockQuantity <= supply.minStockLevel;
  };

  const isExpiringSoon = (supply: MedicalSupply) => {
    if (!supply.expiryDate) return false;
    const expiryDate = new Date(supply.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (supply: MedicalSupply) => {
    if (!supply.expiryDate) return false;
    const expiryDate = new Date(supply.expiryDate);
    const today = new Date();
    return expiryDate < today;
  };

  const getDaysUntilExpiry = (supply: MedicalSupply) => {
    if (!supply.expiryDate) return null;
    const expiryDate = new Date(supply.expiryDate);
    const today = new Date();
    const days = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStockBadgeStyle = (supply: MedicalSupply) => {
    if (isExpired(supply)) {
      return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
    }
    if (isExpiringSoon(supply)) {
      return { backgroundColor: colors.orange[100], borderColor: colors.orange[500] };
    }
    if (isLowStock(supply)) {
      return { backgroundColor: colors.yellow[100], borderColor: colors.yellow[500] };
    }
    return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
  };

  const getStockBadgeText = (supply: MedicalSupply) => {
    if (isExpired(supply)) return 'Expired';
    if (isExpiringSoon(supply)) return 'Expiring Soon';
    if (isLowStock(supply)) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Supply Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!supply) {
    return (
      <Container safeArea>
        <Header title="Supply Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Medical supply not found</Text>
        </View>
      </Container>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(supply);

  return (
    <Container safeArea>
      <Header
        title="Supply Details"
        gradient={false}
        rightIcon="create-outline"
        onRightPress={() => navigation.navigate('SupplyForm' as never, { id, supply } as never)}
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
            <Text style={styles.supplyName}>{supply.name}</Text>
            <View style={[styles.statusBadge, getStockBadgeStyle(supply)]}>
              <Text style={styles.statusText}>{getStockBadgeText(supply)}</Text>
            </View>
          </View>
          <Text style={styles.supplyId}>{supply.supplyId}</Text>
        </View>

        {(isExpired(supply) || isExpiringSoon(supply) || isLowStock(supply)) && (
          <View style={styles.alertCard}>
            {isExpired(supply) && (
              <View style={[styles.alertRow, { backgroundColor: colors.red[50] }]}>
                <Ionicons name="warning" size={24} color={colors.red[600]} />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.red[600] }]}>
                    Expired Supply
                  </Text>
                  <Text style={styles.alertText}>
                    This supply expired on {new Date(supply.expiryDate!).toLocaleDateString()}.
                    Please remove from inventory.
                  </Text>
                </View>
              </View>
            )}
            {isExpiringSoon(supply) && !isExpired(supply) && (
              <View style={[styles.alertRow, { backgroundColor: colors.orange[50] }]}>
                <Ionicons name="time-outline" size={24} color={colors.orange[600]} />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.orange[600] }]}>
                    Expiring Soon
                  </Text>
                  <Text style={styles.alertText}>
                    This supply will expire in {daysUntilExpiry} day
                    {daysUntilExpiry !== 1 ? 's' : ''} on{' '}
                    {new Date(supply.expiryDate!).toLocaleDateString()}.
                  </Text>
                </View>
              </View>
            )}
            {isLowStock(supply) && (
              <View style={[styles.alertRow, { backgroundColor: colors.yellow[50] }]}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.yellow[600]} />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.yellow[600] }]}>
                    Low Stock Alert
                  </Text>
                  <Text style={styles.alertText}>
                    Current stock ({supply.stockQuantity}) is at or below minimum level (
                    {supply.minStockLevel}). Please reorder soon.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Current Stock:</Text>
              <Text style={styles.infoText}>
                {supply.stockQuantity} {supply.unit || 'units'}
              </Text>
            </View>
            {supply.minStockLevel !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons name="arrow-down-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Min Stock Level:</Text>
                <Text style={styles.infoText}>{supply.minStockLevel}</Text>
              </View>
            )}
            {supply.maxStockLevel !== undefined && (
              <View style={styles.infoRow}>
                <Ionicons name="arrow-up-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Max Stock Level:</Text>
                <Text style={styles.infoText}>{supply.maxStockLevel}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Unit Price:</Text>
              <Text style={styles.infoText}>{formatCurrency(supply.unitPrice)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calculator-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Total Value:</Text>
              <Text style={[styles.infoText, { fontWeight: '600', color: colors.green[600] }]}>
                {formatCurrency(supply.stockQuantity * supply.unitPrice)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supply Details</Text>
          <View style={styles.infoCard}>
            {supply.category && (
              <View style={styles.infoRow}>
                <Ionicons name="pricetag-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoText}>{supply.category}</Text>
              </View>
            )}
            {supply.unit && (
              <View style={styles.infoRow}>
                <Ionicons name="scale-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Unit:</Text>
                <Text style={styles.infoText}>{supply.unit}</Text>
              </View>
            )}
            {supply.description && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Description:</Text>
                <Text style={styles.infoText}>{supply.description}</Text>
              </View>
            )}
          </View>
        </View>

        {supply.expiryDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expiry Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons
                  name={isExpired(supply) ? 'warning' : 'calendar-outline'}
                  size={20}
                  color={isExpired(supply) ? colors.red[500] : colors.text.secondary}
                />
                <Text style={styles.infoLabel}>Expiry Date:</Text>
                <Text
                  style={[
                    styles.infoText,
                    isExpired(supply) && { color: colors.red[500], fontWeight: '600' },
                  ]}
                >
                  {new Date(supply.expiryDate).toLocaleDateString()}
                </Text>
              </View>
              {daysUntilExpiry !== null && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Days Until Expiry:</Text>
                  <Text
                    style={[
                      styles.infoText,
                      daysUntilExpiry < 0 && { color: colors.red[500] },
                      daysUntilExpiry >= 0 &&
                        daysUntilExpiry <= 30 && { color: colors.orange[500] },
                    ]}
                  >
                    {daysUntilExpiry < 0
                      ? `${Math.abs(daysUntilExpiry)} days ago`
                      : `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`}
                  </Text>
                </View>
              )}
              {supply.batchNumber && (
                <View style={styles.infoRow}>
                  <Ionicons name="barcode-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Batch Number:</Text>
                  <Text style={styles.infoText}>{supply.batchNumber}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {(supply.supplier || supply.location) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location & Supplier</Text>
            <View style={styles.infoCard}>
              {supply.supplier && (
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Supplier:</Text>
                  <Text style={styles.infoText}>{supply.supplier}</Text>
                </View>
              )}
              {supply.location && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Location:</Text>
                  <Text style={styles.infoText}>{supply.location}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoText}>
                {supply.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoText}>
                {new Date(supply.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoText}>
                {new Date(supply.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('SupplyForm' as never, { id, supply } as never)}
          >
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Supply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Supply</Text>
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
    width: '100%',
    marginBottom: spacing.xs,
  },
  supplyName: {
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
  supplyId: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  alertCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  alertRow: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  alertText: {
    fontSize: 14,
    color: colors.text.primary,
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
    minWidth: 120,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
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
