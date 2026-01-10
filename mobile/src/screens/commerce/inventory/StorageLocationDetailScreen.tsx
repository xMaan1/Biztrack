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
import { StorageLocation, Warehouse } from '@/models/inventory';

export default function StorageLocationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [location, setLocation] = useState<StorageLocation | null>(null);
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocation();
  }, [id]);

  const loadLocation = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getStorageLocation(id);
      setLocation(response.storageLocation);
      if (response.storageLocation.warehouseId) {
        try {
          const warehouseResponse = await InventoryService.getWarehouse(response.storageLocation.warehouseId);
          setWarehouse(warehouseResponse.warehouse);
        } catch (error) {
          console.error('Error loading warehouse:', error);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load storage location');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!location) return;
    Alert.alert(
      'Delete Storage Location',
      `Are you sure you want to delete ${location.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await InventoryService.deleteStorageLocation(id);
              Alert.alert('Success', 'Storage location deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete storage location');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate('StorageLocationForm' as never, { id, storageLocation: location } as never);
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Storage Location Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!location) {
    return (
      <Container safeArea>
        <Header title="Storage Location Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Storage location not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Storage Location Details"
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
            <Text style={styles.infoValue}>{location.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Code</Text>
            <Text style={styles.infoValue}>{location.code}</Text>
          </View>
          {location.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{location.description}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{location.locationType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                location.isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
              ]}
            >
              <Text style={styles.statusText}>
                {location.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Warehouse Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warehouse</Text>
            <Text style={styles.infoValue}>{warehouse?.name || location.warehouseId}</Text>
          </View>
        </View>

        {(location.capacity !== undefined || location.usedCapacity !== undefined) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Capacity Information</Text>
            </View>
            {location.capacity !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Capacity</Text>
                <Text style={styles.infoValue}>{location.capacity} m³</Text>
              </View>
            )}
            {location.usedCapacity !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Used Capacity</Text>
                <Text style={styles.infoValue}>{location.usedCapacity} m³</Text>
              </View>
            )}
            {location.capacity !== undefined && location.usedCapacity !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Available Capacity</Text>
                <Text style={styles.infoValue}>
                  {location.capacity - location.usedCapacity} m³
                </Text>
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
          <Text style={styles.deleteButtonText}>Delete Storage Location</Text>
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
