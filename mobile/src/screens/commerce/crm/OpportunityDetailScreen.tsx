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
import CRMService from '@/services/CRMService';
import { Opportunity, OpportunityStage } from '@/models/crm';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function OpportunityDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOpportunity();
  }, [id]);

  const loadOpportunity = async () => {
    try {
      setLoading(true);
      const data = await CRMService.getOpportunity(id);
      setOpportunity(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load opportunity');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!opportunity) return;
    Alert.alert(
      'Delete Opportunity',
      `Are you sure you want to delete ${opportunity.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CRMService.deleteOpportunity(id);
              Alert.alert('Success', 'Opportunity deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete opportunity');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    (navigation as any).navigate('OpportunityForm', { id, opportunity });
  };

  const getStageBadgeStyle = (stage: OpportunityStage) => {
    const stageColors: Record<OpportunityStage, { bg: string; border: string }> = {
      [OpportunityStage.PROSPECTING]: { bg: colors.blue[100], border: colors.blue[500] },
      [OpportunityStage.QUALIFICATION]: { bg: colors.yellow[100], border: colors.yellow[500] },
      [OpportunityStage.PROPOSAL]: { bg: colors.purple[100], border: colors.purple[500] },
      [OpportunityStage.NEGOTIATION]: { bg: colors.orange[100], border: colors.orange[500] },
      [OpportunityStage.CLOSED_WON]: { bg: colors.green[100], border: colors.green[500] },
      [OpportunityStage.CLOSED_LOST]: { bg: colors.red[100], border: colors.red[500] },
    };
    const color = stageColors[stage] || { bg: colors.gray[100], border: colors.gray[500] };
    return { backgroundColor: color.bg, borderColor: color.border };
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Opportunity Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!opportunity) {
    return (
      <Container safeArea>
        <Header title="Opportunity Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Opportunity not found</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea>
      <Header
        title="Opportunity Details"
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
          <View style={styles.titleRow}>
            <Text style={styles.opportunityTitle}>{opportunity.title}</Text>
            <View style={[styles.stageBadge, getStageBadgeStyle(opportunity.stage)]}>
              <Text style={styles.stageText}>{opportunity.stage.replace('_', ' ')}</Text>
            </View>
          </View>
          {opportunity.description && (
            <Text style={styles.description}>{opportunity.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Information</Text>
          <View style={styles.infoCard}>
            {opportunity.amount && (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount:</Text>
                <Text style={styles.amountValue}>{formatCurrency(opportunity.amount)}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Probability:</Text>
              <Text style={styles.infoText}>{opportunity.probability}%</Text>
            </View>
            {opportunity.expectedCloseDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expected Close Date:</Text>
                <Text style={styles.infoText}>
                  {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {opportunity.closedDate && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Closed Date:</Text>
                <Text style={styles.infoText}>
                  {new Date(opportunity.closedDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            {opportunity.wonAmount && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Won Amount:</Text>
                <Text style={styles.infoText}>{formatCurrency(opportunity.wonAmount)}</Text>
              </View>
            )}
            {opportunity.lostReason && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Lost Reason:</Text>
                <Text style={styles.infoText}>{opportunity.lostReason}</Text>
              </View>
            )}
          </View>
        </View>

        {opportunity.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{opportunity.notes}</Text>
            </View>
          </View>
        )}

        {opportunity.tags && opportunity.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {opportunity.tags.map((tag, index) => (
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
                {new Date(opportunity.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Updated:</Text>
              <Text style={styles.infoText}>
                {new Date(opportunity.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={20} color={colors.background.default} />
            <Text style={styles.editButtonText}>Edit Opportunity</Text>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  opportunityTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  stageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  stageText: {
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
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.main,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
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
