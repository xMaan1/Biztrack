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
import { Warehouse, WarehouseCreate, WarehouseUpdate } from '@/models/inventory';

export default function WarehouseFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id, warehouse } = route.params as { id?: string; warehouse?: Warehouse };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [formData, setFormData] = useState<WarehouseCreate>({
    name: warehouse?.name || '',
    code: warehouse?.code || '',
    description: warehouse?.description || '',
    address: warehouse?.address || '',
    city: warehouse?.city || '',
    state: warehouse?.state || '',
    country: warehouse?.country || '',
    postalCode: warehouse?.postalCode || '',
    phone: warehouse?.phone || '',
    email: warehouse?.email || '',
    isActive: warehouse?.isActive ?? true,
    capacity: warehouse?.capacity,
    temperatureZone: warehouse?.temperatureZone || '',
    securityLevel: warehouse?.securityLevel || '',
  });

  useEffect(() => {
    if (isEdit && id && !warehouse) {
      loadWarehouse();
    }
  }, [id, isEdit]);

  const loadWarehouse = async () => {
    if (!id) return;
    try {
      setLoadingData(true);
      const response = await InventoryService.getWarehouse(id);
      const w = response.warehouse;
      setFormData({
        name: w.name,
        code: w.code,
        description: w.description || '',
        address: w.address,
        city: w.city,
        state: w.state,
        country: w.country,
        postalCode: w.postalCode,
        phone: w.phone || '',
        email: w.email || '',
        isActive: w.isActive,
        capacity: w.capacity,
        temperatureZone: w.temperatureZone || '',
        securityLevel: w.securityLevel || '',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load warehouse');
      navigation.goBack();
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.address || !formData.city || !formData.state || !formData.country || !formData.postalCode) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        const updateData: WarehouseUpdate = { ...formData };
        await InventoryService.updateWarehouse(id, updateData);
        Alert.alert('Success', 'Warehouse updated successfully');
      } else {
        await InventoryService.createWarehouse(formData);
        Alert.alert('Success', 'Warehouse created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save warehouse');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof WarehouseCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loadingData) {
    return (
      <Container safeArea>
        <Header title={isEdit ? 'Edit Warehouse' : 'New Warehouse'} gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header title={isEdit ? 'Edit Warehouse' : 'New Warehouse'} gradient={false} />
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
              <Text style={styles.label}>Warehouse Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Enter warehouse name"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Warehouse Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(value) => updateField('code', value)}
                placeholder="Enter warehouse code"
                placeholderTextColor={colors.text.secondary}
              />
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
              <Text style={styles.label}>Temperature Zone</Text>
              <TextInput
                style={styles.input}
                value={formData.temperatureZone}
                onChangeText={(value) => updateField('temperatureZone', value)}
                placeholder="e.g., Ambient, Refrigerated, Frozen"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Security Level</Text>
              <TextInput
                style={styles.input}
                value={formData.securityLevel}
                onChangeText={(value) => updateField('securityLevel', value)}
                placeholder="e.g., Standard, High, Maximum"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={[styles.inputGroup, styles.switchGroup]}>
              <Text style={styles.label}>Active Warehouse</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => updateField('isActive', value)}
                trackColor={{ false: colors.gray[300], true: colors.primary.main }}
                thumbColor={colors.background.default}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street Address *</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(value) => updateField('address', value)}
                placeholder="Enter street address"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(value) => updateField('city', value)}
                placeholder="Enter city"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State/Province *</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(value) => updateField('state', value)}
                placeholder="Enter state or province"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Country *</Text>
              <TextInput
                style={styles.input}
                value={formData.country}
                onChangeText={(value) => updateField('country', value)}
                placeholder="Enter country"
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Postal Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.postalCode}
                onChangeText={(value) => updateField('postalCode', value)}
                placeholder="Enter postal code"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                placeholder="Enter phone number"
                placeholderTextColor={colors.text.secondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="Enter email address"
                placeholderTextColor={colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
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
                {isEdit ? 'Update Warehouse' : 'Create Warehouse'}
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
