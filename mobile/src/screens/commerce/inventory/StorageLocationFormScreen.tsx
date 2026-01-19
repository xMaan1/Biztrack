import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/layout/Container';
import { Header } from '@/components/layout/Header';
import { colors, spacing } from '@/theme';
import InventoryService from '@/services/InventoryService';
import { StorageLocation, StorageLocationCreate, StorageLocationUpdate, Warehouse } from '@/models/inventory';

export default function StorageLocationFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, storageLocation } = route.params as { id?: string; storageLocation?: StorageLocation };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [formData, setFormData] = useState<StorageLocationCreate>({
    warehouseId: storageLocation?.warehouseId || '',
    name: storageLocation?.name || '',
    code: storageLocation?.code || '',
    description: storageLocation?.description || '',
    locationType: storageLocation?.locationType || 'shelf',
    parentLocationId: storageLocation?.parentLocationId || '',
    capacity: storageLocation?.capacity,
    usedCapacity: storageLocation?.usedCapacity,
    isActive: storageLocation?.isActive ?? true,
  });

  useEffect(() => {
    loadWarehouses();
    if (isEdit && id && !storageLocation) {
      loadStorageLocation();
    } else if (storageLocation) {
      setSelectedWarehouseId(storageLocation.warehouseId);
    }
  }, [id, isEdit]);

  const loadWarehouses = async () => {
    try {
      const response = await InventoryService.getWarehouses();
      setWarehouses(response.warehouses || []);
      if (response.warehouses.length > 0 && !formData.warehouseId) {
        setSelectedWarehouseId(response.warehouses[0].id);
        updateField('warehouseId', response.warehouses[0].id);
      }
    } catch (error: any) {
      console.error('Error loading warehouses:', error);
    }
  };

  const loadStorageLocation = async () => {
    if (!id) return;
    try {
      setLoadingData(true);
      const response = await InventoryService.getStorageLocation(id);
      const sl = response.storageLocation;
      setSelectedWarehouseId(sl.warehouseId);
      setFormData({
        warehouseId: sl.warehouseId,
        name: sl.name,
        code: sl.code,
        description: sl.description || '',
        locationType: sl.locationType,
        parentLocationId: sl.parentLocationId || '',
        capacity: sl.capacity,
        usedCapacity: sl.usedCapacity,
        isActive: sl.isActive,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load storage location');
      navigation.goBack();
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.warehouseId || !formData.name || !formData.code) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        const updateData: StorageLocationUpdate = { ...formData };
        await InventoryService.updateStorageLocation(id, updateData);
        Alert.alert('Success', 'Storage location updated successfully');
      } else {
        await InventoryService.createStorageLocation(formData);
        Alert.alert('Success', 'Storage location created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save storage location');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof StorageLocationCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const locationTypes = ['shelf', 'rack', 'bin', 'area', 'zone', 'room'];

  if (loadingData) {
    return (
      <Container safeArea>
        <Header title={isEdit ? 'Edit Storage Location' : 'New Storage Location'} gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Storage Location' : 'New Storage Location'} gradient={false} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Warehouse *</Text>
              <View style={styles.selectContainer}>
                {warehouses.map((warehouse) => (
                  <Pressable
                    key={warehouse.id}
                    style={({ pressed }) => [
                      styles.selectOption,
                      selectedWarehouseId === warehouse.id && styles.selectOptionActive,
                      pressed && styles.selectOptionPressed,
                    ]}
                    onPress={() => {
                      setSelectedWarehouseId(warehouse.id);
                      updateField('warehouseId', warehouse.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        selectedWarehouseId === warehouse.id && styles.selectOptionTextActive,
                      ]}
                    >
                      {warehouse.name}
                    </Text>
                    {selectedWarehouseId === warehouse.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter location name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(value) => updateField('code', value)}
                placeholder="Enter location code"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location Type *</Text>
              <View style={styles.selectContainer}>
                {locationTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={({ pressed }) => [
                      styles.selectOption,
                      formData.locationType === type && styles.selectOptionActive,
                      pressed && styles.selectOptionPressed,
                    ]}
                    onPress={() => updateField('locationType', type)}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        formData.locationType === type && styles.selectOptionTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                    {formData.locationType === type && (
                      <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="Enter description"
                placeholderTextColor={colors.text.secondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Capacity (m³)</Text>
              <TextInput
                style={styles.input}
                value={formData.capacity?.toString() || ''}
                onChangeText={(value) => updateField('capacity', value ? parseFloat(value) : undefined)}
                placeholder="Enter capacity"
                placeholderTextColor={colors.text.secondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Used Capacity (m³)</Text>
              <TextInput
                style={styles.input}
                value={formData.usedCapacity?.toString() || ''}
                onChangeText={(value) => updateField('usedCapacity', value ? parseFloat(value) : undefined)}
                placeholder="Enter used capacity"
                placeholderTextColor={colors.text.secondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.switchGroup]}>
              <Text style={styles.label}>Active Location</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => updateField('isActive', value)}
                trackColor={{ false: colors.gray[300], true: colors.primary.main }}
                thumbColor={colors.background.default}
              />
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            (loading || pressed) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background.default} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Location' : 'Create Location'}
              </Text>
            </>
          )}
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  formCard: {
    backgroundColor: colors.card.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectContainer: {
    gap: spacing.xs,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  selectOptionActive: {
    backgroundColor: colors.blue[50],
    borderColor: colors.primary.main,
  },
  selectOptionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  selectOptionTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  selectOptionPressed: {
    opacity: 0.7,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.background.default,
    fontSize: 16,
    fontWeight: '600',
  },
});
