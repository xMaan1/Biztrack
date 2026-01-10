import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import InventoryService from '@/services/InventoryService';
import { StockMovement, StockMovementType, StockMovementStatus } from '@/models/inventory';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function StockMovementDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { getCurrencySymbol } = useCurrency();
  const { id } = route.params as { id: string };
  const [movement, setMovement] = useState<StockMovement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMovement();
  }, [id]);

  const loadMovement = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getStockMovement(id);
      setMovement(response.stockMovement);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load stock movement');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!movement) return;
    Alert.alert(
      'Delete Stock Movement',
      'Are you sure you want to delete this stock movement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await InventoryService.deleteStockMovement(id);
              Alert.alert('Success', 'Stock movement deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete stock movement');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate('StockMovementForm' as never, { id, movement } as never);
  };

  const getTypeBadgeStyle = (type: StockMovementType) => {
    switch (type) {
      case StockMovementType.INBOUND:
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case StockMovementType.OUTBOUND:
        return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
      case StockMovementType.TRANSFER:
        return { backgroundColor: colors.blue[100], borderColor: colors.blue[500] };
      default:
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
    }
  };

  const getStatusBadgeStyle = (status: StockMovementStatus) => {
    switch (status) {
      case StockMovementStatus.COMPLETED:
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case StockMovementStatus.CANCELLED:
        return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
      default:
        return { backgroundColor: colors.blue[100], borderColor: colors.blue[500] };
    }
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Stock Movement Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!movement) {
    return (
      <Container safeArea>
        <Header title="Stock Movement Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Stock movement not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Stock Movement Details"
        rightIcon="create-outline"
        gradient={false}
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
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Movement Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <View style={[styles.badge, getTypeBadgeStyle(movement.movementType)]}>
              <Text style={styles.badgeText}>
                {movement.movementType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.badge, getStatusBadgeStyle(movement.status)]}>
              <Text style={styles.badgeText}>
                {movement.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Product ID</Text>
            <Text style={styles.infoValue}>{movement.productId}</Text>
          </View>
          {movement.productName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Product Name</Text>
              <Text style={styles.infoValue}>{movement.productName}</Text>
            </View>
          )}
          {movement.productSku && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SKU</Text>
              <Text style={styles.infoValue}>{movement.productSku}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warehouse ID</Text>
            <Text style={styles.infoValue}>{movement.warehouseId}</Text>
          </View>
          {movement.locationId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location ID</Text>
              <Text style={styles.infoValue}>{movement.locationId}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Quantity</Text>
            <Text style={styles.infoValue}>{movement.quantity}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Unit Cost</Text>
            <Text style={styles.infoValue}>
              {getCurrencySymbol()}{movement.unitCost.toFixed(2)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Cost</Text>
            <Text style={[styles.infoValue, styles.totalCost]}>
              {getCurrencySymbol()}{(movement.quantity * movement.unitCost).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Reference Information</Text>
          </View>
          {movement.referenceNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reference Number</Text>
              <Text style={styles.infoValue}>{movement.referenceNumber}</Text>
            </View>
          )}
          {movement.referenceType && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reference Type</Text>
              <Text style={styles.infoValue}>{movement.referenceType}</Text>
            </View>
          )}
        </View>

        {(movement.batchNumber || movement.serialNumber || movement.expiryDate) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Additional Information</Text>
            </View>
            {movement.batchNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Batch Number</Text>
                <Text style={styles.infoValue}>{movement.batchNumber}</Text>
              </View>
            )}
            {movement.serialNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Serial Number</Text>
                <Text style={styles.infoValue}>{movement.serialNumber}</Text>
              </View>
            )}
            {movement.expiryDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expiry Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(movement.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {movement.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{movement.notes}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Timestamps</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created At</Text>
            <Text style={styles.infoValue}>
              {new Date(movement.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Updated At</Text>
            <Text style={styles.infoValue}>
              {new Date(movement.updatedAt).toLocaleString()}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color={colors.red[600]} />
          <Text style={styles.deleteButtonText}>Delete Stock Movement</Text>
        </Pressable>
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
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  card: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  cardHeader: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  totalCost: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red[50],
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.red[200],
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.red[600],
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
});
