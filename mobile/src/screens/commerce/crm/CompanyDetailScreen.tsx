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
import { Company } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function CompanyDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = await CRMService.getCompany(id);
      setCompany(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load company');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!company) return;
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete ${company.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CRMService.deleteCompany(id);
              Alert.alert('Success', 'Company deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete company');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate('CompanyForm' as never, { id, company } as never);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWebsite = (website: string) => {
    Linking.openURL(website.startsWith('http') ? website : `https://${website}`);
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Company Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!company) {
    return (
      <Container safeArea>
        <Header title="Company Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Company not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Company Details"
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
            <Text style={styles.companyName}>{company.name}</Text>
            {company.isActive ? (
              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            ) : (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            )}
          </View>
          {company.industry && (
            <Text style={styles.industry}>{company.industry}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            {company.phone && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleCall(company.phone!)}
              >
                <Ionicons name="call-outline" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>{company.phone}</Text>
              </TouchableOpacity>
            )}
            {company.email && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleEmail(company.email!)}
              >
                <Ionicons name="mail-outline" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>{company.email}</Text>
              </TouchableOpacity>
            )}
            {company.website && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleWebsite(company.website!)}
              >
                <Ionicons name="globe-outline" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>{company.website}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.infoCard}>
            {company.industry && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Industry:</Text>
                <Text style={styles.infoText}>{company.industry}</Text>
              </View>
            )}
            {company.size && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Size:</Text>
                <Text style={styles.infoText}>{company.size}</Text>
              </View>
            )}
            {company.annualRevenue && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Annual Revenue:</Text>
                <Text style={styles.infoText}>{formatCurrency(company.annualRevenue)}</Text>
              </View>
            )}
            {company.employeeCount && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Employees:</Text>
                <Text style={styles.infoText}>{company.employeeCount}</Text>
              </View>
            )}
            {company.foundedYear && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Founded:</Text>
                <Text style={styles.infoText}>{company.foundedYear}</Text>
              </View>
            )}
          </View>
        </View>

        {(company.address || company.city || company.country) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.infoCard}>
              {company.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoText}>{company.address}</Text>
                </View>
              )}
              {(company.city || company.state || company.country) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>
                    {[company.city, company.state, company.country].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
              {company.postalCode && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>Postal Code: {company.postalCode}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {company.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.infoCard}>
              <Text style={styles.descriptionText}>{company.description}</Text>
            </View>
          </View>
        )}

        {company.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{company.notes}</Text>
            </View>
          </View>
        )}

        {company.tags && company.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {company.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoText}>
                {new Date(company.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Updated:</Text>
              <Text style={styles.infoText}>
                {new Date(company.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Company</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.red[600]} />
            <Text style={styles.deleteButtonText}>Delete</Text>
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
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  industry: {
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'capitalize',
    marginTop: spacing.xs,
  },
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.green[100],
    borderWidth: 1,
    borderColor: colors.green[500],
  },
  activeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.green[700],
  },
  inactiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[500],
  },
  inactiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray[700],
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
    fontWeight: '600',
    color: colors.text.secondary,
    minWidth: 120,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
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
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  tagText: {
    fontSize: 12,
    color: colors.primary[700],
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  editButtonText: {
    color: colors.background.default,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red[50],
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red[300],
    gap: spacing.xs,
  },
  deleteButtonText: {
    color: colors.red[600],
    fontSize: 16,
    fontWeight: '600',
  },
});
