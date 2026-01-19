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
import { Receiving, ReceivingStatus } from '@/models/inventory';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ReceivingDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [receiving, setReceiving] = useState<Receiving | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceiving();
  }, [id]);

  const loadReceiving = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getReceiving(id);
      setReceiving(response.receiving);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load receiving');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!receiving) return;
    Alert.alert(
      'Delete Receiving',
      `Are you sure you want to delete ${receiving.receivingNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await InventoryService.deleteReceiving(id);
              Alert.alert('Success', 'Receiving deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete receiving');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    (navigation.navigate as any)('ReceivingForm', { id, receiving });
  };

  const getStatusBadgeStyle = (status: ReceivingStatus) => {
    switch (status) {
      case ReceivingStatus.COMPLETED:
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case ReceivingStatus.CANCELLED:
        return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
      default:
        return { backgroundColor: colors.blue[100], borderColor: colors.blue[500] };
    }
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Receiving Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!receiving) {
    return (
      <Container safeArea>
        <Header title="Receiving Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Receiving not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Receiving Details"
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
            <Text style={styles.cardTitle}>Receiving Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Receiving Number</Text>
            <Text style={styles.infoValue}>{receiving.receivingNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Purchase Order ID</Text>
            <Text style={styles.infoValue}>{receiving.purchaseOrderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warehouse ID</Text>
            <Text style={styles.infoValue}>{receiving.warehouseId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Received Date</Text>
            <Text style={styles.infoValue}>
              {new Date(receiving.receivedDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.badge, getStatusBadgeStyle(receiving.status)]}>
              <Text style={styles.badgeText}>
                {receiving.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </View>
          </View>
          {receiving.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoValue}>{receiving.notes}</Text>
            </View>
          )}
        </View>

        {receiving.items && receiving.items.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Items ({receiving.items.length})</Text>
            </View>
            {receiving.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemQuantity}>
                    {item.receivedQuantity} / {item.quantity}
                  </Text>
                  <Text style={styles.itemCost}>
                    {formatCurrency(item.receivedQuantity * item.unitCost)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Timestamps</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created At</Text>
            <Text style={styles.infoValue}>
              {new Date(receiving.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Updated At</Text>
            <Text style={styles.infoValue}>
              {new Date(receiving.updatedAt).toLocaleString()}
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
          <Text style={styles.deleteButtonText}>Delete Receiving</Text>
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemSku: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  itemDetails: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  itemCost: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
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
