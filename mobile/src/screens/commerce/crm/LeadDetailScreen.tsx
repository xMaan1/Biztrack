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
import { Lead, LeadStatus } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function LeadDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLead();
  }, [id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const data = await CRMService.getLead(id);
      setLead(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load lead');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!lead) return;
    Alert.alert(
      'Delete Lead',
      `Are you sure you want to delete ${lead.firstName} ${lead.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CRMService.deleteLead(id);
              Alert.alert('Success', 'Lead deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete lead');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    (navigation as any).navigate('LeadForm', { id, lead });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getStatusBadgeStyle = (status: LeadStatus) => {
    const statusColors: Record<LeadStatus, { bg: string; border: string }> = {
      [LeadStatus.NEW]: { bg: colors.blue[100], border: colors.blue[500] },
      [LeadStatus.CONTACTED]: { bg: colors.yellow[100], border: colors.yellow[500] },
      [LeadStatus.QUALIFIED]: { bg: colors.green[100], border: colors.green[500] },
      [LeadStatus.PROPOSAL_SENT]: { bg: colors.purple[100], border: colors.purple[500] },
      [LeadStatus.NEGOTIATION]: { bg: colors.orange[100], border: colors.orange[500] },
      [LeadStatus.WON]: { bg: colors.green[100], border: colors.green[500] },
      [LeadStatus.LOST]: { bg: colors.red[100], border: colors.red[500] },
    };
    const color = statusColors[status] || { bg: colors.gray[100], border: colors.gray[500] };
    return { backgroundColor: color.bg, borderColor: color.border };
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Lead Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!lead) {
    return (
      <Container safeArea>
        <Header title="Lead Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Lead not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Lead Details"
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
            <Text style={styles.leadName}>
              {lead.firstName} {lead.lastName}
            </Text>
            <View style={[styles.statusBadge, getStatusBadgeStyle(lead.status)]}>
              <Text style={styles.statusText}>{lead.status}</Text>
            </View>
          </View>
          {lead.email && <Text style={styles.leadEmail}>{lead.email}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            {lead.email && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleEmail(lead.email!)}
              >
                <Ionicons name="mail-outline" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>{lead.email}</Text>
              </TouchableOpacity>
            )}
            {lead.phone && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleCall(lead.phone!)}
              >
                <Ionicons name="call-outline" size={20} color={colors.primary.main} />
                <Text style={styles.infoText}>{lead.phone}</Text>
              </TouchableOpacity>
            )}
            {lead.company && (
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>{lead.company}</Text>
              </View>
            )}
            {lead.jobTitle && (
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>{lead.jobTitle}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lead Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(lead.status)]}>
                <Text style={styles.statusText}>{lead.status}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Source:</Text>
              <Text style={styles.infoText}>{lead.source}</Text>
            </View>
            {lead.score > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Score:</Text>
                <Text style={styles.infoText}>{lead.score}</Text>
              </View>
            )}
            {lead.budget && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Budget:</Text>
                <Text style={styles.infoText}>{formatCurrency(lead.budget)}</Text>
              </View>
            )}
            {lead.timeline && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Timeline:</Text>
                <Text style={styles.infoText}>{lead.timeline}</Text>
              </View>
            )}
          </View>
        </View>

        {lead.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{lead.notes}</Text>
            </View>
          </View>
        )}

        {lead.tags && lead.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {lead.tags.map((tag, index) => (
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
            {lead.lastContactDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Contact:</Text>
                <Text style={styles.infoText}>
                  {new Date(lead.lastContactDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {lead.nextFollowUpDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Next Follow-up:</Text>
                <Text style={styles.infoText}>
                  {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoText}>
                {new Date(lead.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Lead</Text>
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
  leadName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  leadEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
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
    minWidth: 100,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
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
