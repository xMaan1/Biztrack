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
import QualityControlService from '@/services/QualityControlService';
import {
  QualityDefectResponse as QualityDefect,
  getDefectSeverityColor,
  getDefectSeverityLabel,
  getQualityPriorityColor,
  getQualityPriorityLabel,
} from '@/models/qualityControl';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function QualityDefectDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const { id } = route.params as { id: string };
  const [defect, setDefect] = useState<QualityDefect | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDefect();
  }, [id]);

  const loadDefect = async () => {
    try {
      setLoading(true);
      const data = await QualityControlService.getQualityDefect(id);
      setDefect(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load quality defect');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Quality Defect',
      'Are you sure you want to delete this quality defect?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await QualityControlService.deleteQualityDefect(id);
              Alert.alert('Success', 'Quality defect deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete quality defect');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Quality Defect Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!defect) {
    return (
      <Container safeArea>
        <Header title="Quality Defect Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Quality defect not found</Text>
        </View>
      </Container>
    );
  }

  const severityStyle = getDefectSeverityColor(defect.severity);
  const priorityStyle = getQualityPriorityColor(defect.priority);

  return (
    <Container safeArea>
      <Header
        title="Quality Defect Details"
        gradient={false}
        rightIcon="create-outline"
        onRightPress={() =>
          (navigation.navigate as any)('QualityDefectForm', { id, defect })
        }
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
            <Text style={styles.defectId}>{defect.id}</Text>
            <View style={[styles.severityBadge, { backgroundColor: severityStyle.bg, borderColor: severityStyle.border }]}>
              <Text style={[styles.severityText, { color: severityStyle.border }]}>
                {getDefectSeverityLabel(defect.severity)}
              </Text>
            </View>
          </View>
          <Text style={styles.defectTitle}>{defect.title}</Text>
          {defect.description && (
            <Text style={styles.description}>{defect.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="flag-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Priority:</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border }]}>
                <Text style={[styles.priorityText, { color: priorityStyle.border }]}>
                  {getQualityPriorityLabel(defect.priority)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="folder-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoText}>{defect.category}</Text>
            </View>
            {defect.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoText}>{defect.location}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Detected By:</Text>
              <Text style={styles.infoText}>{defect.detected_by_name}</Text>
            </View>
            {defect.assigned_to_name && (
              <View style={styles.infoRow}>
                <Ionicons name="person-circle-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Assigned To:</Text>
                <Text style={styles.infoText}>{defect.assigned_to_name}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Detected Date:</Text>
              <Text style={styles.infoText}>
                {QualityControlService.formatDate(defect.detected_date)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoText}>{defect.status}</Text>
            </View>
            {defect.cost_impact > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Cost Impact:</Text>
                <Text style={styles.infoText}>
                  {getCurrencySymbol()}{formatCurrency(defect.cost_impact)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {defect.estimated_resolution_date && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution Timeline</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Estimated Resolution:</Text>
                <Text style={styles.infoText}>
                  {QualityControlService.formatDate(defect.estimated_resolution_date)}
                </Text>
              </View>
              {defect.actual_resolution_date && (
                <View style={styles.infoRow}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Actual Resolution:</Text>
                  <Text style={styles.infoText}>
                    {QualityControlService.formatDate(defect.actual_resolution_date)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {defect.resolution_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resolution Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.notesText}>{defect.resolution_notes}</Text>
            </View>
          </View>
        )}

        {defect.tags && defect.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.infoCard}>
              <View style={styles.tagsContainer}>
                {defect.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Created:</Text>
              <Text style={styles.infoText}>
                {QualityControlService.formatDate(defect.created_at)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoText}>
                {QualityControlService.formatDate(defect.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Quality Defect</Text>
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
  defectId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  defectTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.text.secondary,
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
    minWidth: 120,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.background.muted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tagText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  actionsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
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
