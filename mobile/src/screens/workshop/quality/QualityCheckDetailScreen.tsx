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
  QualityCheckResponse as QualityCheck,
  getQualityStatusColor,
  getQualityPriorityColor,
  getQualityStatusLabel,
  getQualityPriorityLabel,
  getInspectionTypeLabel,
  getInspectionTypeIcon,
  getQualityStandardLabel,
} from '@/models/qualityControl';

export default function QualityCheckDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { id } = route.params as { id: string };
  const [qualityCheck, setQualityCheck] = useState<QualityCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQualityCheck();
  }, [id]);

  const loadQualityCheck = async () => {
    try {
      setLoading(true);
      const data = await QualityControlService.getQualityCheck(id);
      setQualityCheck(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load quality check');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Quality Check',
      'Are you sure you want to delete this quality check?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await QualityControlService.deleteQualityCheck(id);
              Alert.alert('Success', 'Quality check deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete quality check');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Quality Check Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!qualityCheck) {
    return (
      <Container safeArea>
        <Header title="Quality Check Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Quality check not found</Text>
        </View>
      </Container>
    );
  }

  const statusStyle = getQualityStatusColor(qualityCheck.status);
  const priorityStyle = getQualityPriorityColor(qualityCheck.priority);

  return (
    <Container safeArea>
      <Header
        title="Quality Check Details"
        gradient={false}
        rightIcon="create-outline"
        onRightPress={() =>
          (navigation.navigate as any)('QualityCheckForm', { id, qualityCheck })
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
            <Text style={styles.qualityCheckId}>{qualityCheck.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <Text style={[styles.statusText, { color: statusStyle.border }]}>
                {getQualityStatusLabel(qualityCheck.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.qualityCheckTitle}>{qualityCheck.title}</Text>
          {qualityCheck.description && (
            <Text style={styles.description}>{qualityCheck.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="eye-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Inspection Type:</Text>
              <Text style={styles.infoText}>
                {getInspectionTypeIcon(qualityCheck.inspection_type)} {getInspectionTypeLabel(qualityCheck.inspection_type)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="flag-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Priority:</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border }]}>
                <Text style={[styles.priorityText, { color: priorityStyle.border }]}>
                  {getQualityPriorityLabel(qualityCheck.priority)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Quality Standard:</Text>
              <Text style={styles.infoText}>
                {getQualityStandardLabel(qualityCheck.quality_standard)}
              </Text>
            </View>
            {qualityCheck.estimated_duration_minutes > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Estimated Duration:</Text>
                <Text style={styles.infoText}>{qualityCheck.estimated_duration_minutes} minutes</Text>
              </View>
            )}
            {qualityCheck.scheduled_date && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Scheduled Date:</Text>
                <Text style={styles.infoText}>
                  {QualityControlService.formatDate(qualityCheck.scheduled_date)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {qualityCheck.completion_percentage > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.infoCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Completion</Text>
                <Text style={styles.progressValue}>{qualityCheck.completion_percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${qualityCheck.completion_percentage}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {qualityCheck.total_inspections > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inspection Statistics</Text>
            <View style={styles.infoCard}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Inspections</Text>
                  <Text style={styles.statValue}>{qualityCheck.total_inspections}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Passed</Text>
                  <Text style={[styles.statValue, { color: colors.green[600] }]}>
                    {qualityCheck.passed_inspections}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Failed</Text>
                  <Text style={[styles.statValue, { color: colors.red[600] }]}>
                    {qualityCheck.failed_inspections}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Pending</Text>
                  <Text style={[styles.statValue, { color: colors.yellow[600] }]}>
                    {qualityCheck.pending_inspections}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {qualityCheck.criteria && qualityCheck.criteria.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Criteria</Text>
            <View style={styles.infoCard}>
              {qualityCheck.criteria.map((criterion, index) => (
                <View key={index} style={styles.criterionItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.criterionText}>{criterion}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {qualityCheck.required_equipment && qualityCheck.required_equipment.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Equipment</Text>
            <View style={styles.infoCard}>
              {qualityCheck.required_equipment.map((equipment, index) => (
                <View key={index} style={styles.equipmentItem}>
                  <Ionicons name="construct-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.equipmentText}>{equipment}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {qualityCheck.required_skills && qualityCheck.required_skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required Skills</Text>
            <View style={styles.infoCard}>
              {qualityCheck.required_skills.map((skill, index) => (
                <View key={index} style={styles.skillItem}>
                  <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {qualityCheck.tags && qualityCheck.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.infoCard}>
              <View style={styles.tagsContainer}>
                {qualityCheck.tags.map((tag, index) => (
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
                {QualityControlService.formatDate(qualityCheck.created_at)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoText}>
                {QualityControlService.formatDate(qualityCheck.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Quality Check</Text>
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
  qualityCheckId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'monospace',
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
  },
  qualityCheckTitle: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  criterionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  criterionText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  equipmentText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  skillText: {
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
