import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import CRMService from '@/services/CRMService';
import { Customer } from '@/models/crm';

export default function CustomerDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await CRMService.getCustomerById(id);
      setCustomer(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load customer');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${customer?.firstName} ${customer?.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CRMService.deleteCustomer(id);
              Alert.alert('Success', 'Customer deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete customer');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    (navigation as any).navigate('CustomerForm', { id, customer });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { backgroundColor: colors.green[100], borderColor: colors.green[500] };
      case 'inactive':
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
      case 'blocked':
        return { backgroundColor: colors.red[100], borderColor: colors.red[500] };
      default:
        return { backgroundColor: colors.gray[100], borderColor: colors.gray[500] };
    }
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Customer Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container safeArea>
        <Header title="Customer Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Customer not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Customer Details"
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
            <Text style={styles.customerName}>
              {customer.firstName} {customer.lastName}
            </Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(customer.customerStatus)]}>
              <Text style={styles.statusText}>{customer.customerStatus}</Text>
            </View>
          </View>
          <Text style={styles.customerId}>{customer.customerId}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => handleEmail(customer.email)}
            >
              <Ionicons name="mail-outline" size={20} color={colors.primary.main} />
              <Text style={styles.infoText}>{customer.email}</Text>
            </TouchableOpacity>
            {customer.phone && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleCall(customer.phone!)}
              >
                <Ionicons name="call-outline" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>{customer.phone}</Text>
              </TouchableOpacity>
            )}
            {customer.mobile && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleCall(customer.mobile!)}
              >
                <Ionicons name="phone-portrait-outline" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>{customer.mobile}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons
                name={customer.customerType === 'individual' ? 'person-outline' : 'business-outline'}
                size={20}
                color={colors.text.secondary}
              />
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoText}>{customer.customerType}</Text>
            </View>
            {customer.cnic && (
              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>CNIC:</Text>
                <Text style={styles.infoText}>{customer.cnic}</Text>
              </View>
            )}
            {customer.dateOfBirth && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Date of Birth:</Text>
                <Text style={styles.infoText}>
                  {new Date(customer.dateOfBirth).toLocaleDateString()}
                </Text>
              </View>
            )}
            {customer.gender && (
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Gender:</Text>
                <Text style={styles.infoText}>{customer.gender}</Text>
              </View>
            )}
          </View>
        </View>

        {customer.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>{customer.address}</Text>
              </View>
              {(customer.city || customer.state || customer.country) && (
                <Text style={styles.addressText}>
                  {[customer.city, customer.state, customer.country]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              )}
              {customer.postalCode && (
                <Text style={styles.addressText}>Postal Code: {customer.postalCode}</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Credit Limit</Text>
              <Text style={styles.financialValue}>
                Rs. {customer.creditLimit.toLocaleString()}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Current Balance</Text>
              <Text
                style={[
                  styles.financialValue,
                  customer.currentBalance < 0 && { color: colors.red[600] },
                ]}
              >
                Rs. {customer.currentBalance.toLocaleString()}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Payment Terms</Text>
              <Text style={styles.financialValue}>{customer.paymentTerms}</Text>
            </View>
          </View>
        </View>

        {customer.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{customer.notes}</Text>
            </View>
          </View>
        )}

        {customer.tags && customer.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {customer.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Customer</Text>
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
  customerName: {
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
  customerId: {
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
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: spacing.lg,
    marginTop: spacing.xs,
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
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.blue[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.blue[300],
  },
  tagText: {
    fontSize: 12,
    color: colors.blue[700],
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
