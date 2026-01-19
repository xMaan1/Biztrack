import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import InventoryService from '@/services/InventoryService';
import { Warehouse } from '@/models/inventory';

export default function WarehouseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWarehouse();
  }, [id]);

  const loadWarehouse = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getWarehouse(id);
      setWarehouse(response.warehouse);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load warehouse');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!warehouse) return;
    Alert.alert(
      'Delete Warehouse',
      `Are you sure you want to delete ${warehouse.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await InventoryService.deleteWarehouse(id);
              Alert.alert('Success', 'Warehouse deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete warehouse');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    (navigation.navigate as any)('WarehouseForm', { id, warehouse });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Warehouse Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!warehouse) {
    return (
      <Container safeArea>
        <Header title="Warehouse Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Warehouse not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Warehouse Details"
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
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{warehouse.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Code</Text>
            <Text style={styles.infoValue}>{warehouse.code}</Text>
          </View>
          {warehouse.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{warehouse.description}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                warehouse.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
              ]}
            >
              <Text style={styles.statusText}>
                {warehouse.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Address</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Street</Text>
            <Text style={styles.infoValue}>{warehouse.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City</Text>
            <Text style={styles.infoValue}>{warehouse.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>State</Text>
            <Text style={styles.infoValue}>{warehouse.state}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Country</Text>
            <Text style={styles.infoValue}>{warehouse.country}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Postal Code</Text>
            <Text style={styles.infoValue}>{warehouse.postalCode}</Text>
          </View>
        </View>

        {(warehouse.phone || warehouse.email) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Contact Information</Text>
            </View>
            {warehouse.phone && (
              <Pressable
                style={({ pressed }) => [
                  styles.contactRow,
                  pressed && styles.contactRowPressed,
                ]}
                onPress={() => handleCall(warehouse.phone!)}
              >
                <Ionicons name="call-outline" size={20} color={colors.primary.main} />
                <Text style={styles.contactValue}>{warehouse.phone}</Text>
              </Pressable>
            )}
            {warehouse.email && (
              <Pressable
                style={({ pressed }) => [
                  styles.contactRow,
                  pressed && styles.contactRowPressed,
                ]}
                onPress={() => handleEmail(warehouse.email!)}
              >
                <Ionicons name="mail-outline" size={20} color={colors.primary.main} />
                <Text style={styles.contactValue}>{warehouse.email}</Text>
              </Pressable>
            )}
          </View>
        )}

        {(warehouse.capacity !== undefined || warehouse.temperatureZone || warehouse.securityLevel) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Additional Information</Text>
            </View>
            {warehouse.capacity !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Capacity</Text>
                <Text style={styles.infoValue}>
                  {warehouse.capacity} m³
                  {warehouse.usedCapacity !== undefined && ` (${warehouse.usedCapacity} used)`}
                </Text>
              </View>
            )}
            {warehouse.temperatureZone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Temperature Zone</Text>
                <Text style={styles.infoValue}>{warehouse.temperatureZone}</Text>
              </View>
            )}
            {warehouse.securityLevel && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Security Level</Text>
                <Text style={styles.infoValue}>{warehouse.securityLevel}</Text>
              </View>
            )}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed,
          ]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color={colors.red[600]} />
          <Text style={styles.deleteButtonText}>Delete Warehouse</Text>
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
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: colors.green[100],
    borderColor: colors.green[500],
  },
  statusBadgeInactive: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[500],
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  contactValue: {
    fontSize: 14,
    color: colors.primary.main,
  },
  contactRowPressed: {
    opacity: 0.7,
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
