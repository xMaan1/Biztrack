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
import WorkOrderService, { WorkOrder } from '@/services/WorkOrderService';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function WorkOrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { id } = route.params as { id: string };
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkOrder();
  }, [id]);

  const loadWorkOrder = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderService.getWorkOrder(id);
      setWorkOrder(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load work order');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Work Order',
      'Are you sure you want to delete this work order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WorkOrderService.deleteWorkOrder(id);
              Alert.alert('Success', 'Work order deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete work order');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate('WorkOrderForm' as never, { id, workOrder } as never);
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Work Order Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!workOrder) {
    return (
      <Container safeArea>
        <Header title="Work Order Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Work order not found</Text>
        </View>
      </Container>
    );
  }

  const statusStyle = WorkOrderService.getStatusColor(workOrder.status);
  const priorityStyle = WorkOrderService.getPriorityColor(workOrder.priority);

  return (
    <Container safeArea>
      <Header
        title="Work Order Details"
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
            <Text style={styles.workOrderNumber}>{workOrder.work_order_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <Text style={[styles.statusText, { color: statusStyle.border }]}>
                {WorkOrderService.getStatusLabel(workOrder.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.workOrderTitle}>{workOrder.title}</Text>
          {workOrder.description && (
            <Text style={styles.description}>{workOrder.description}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="construct-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Type:</Text>
              <Text style={styles.infoText}>
                {WorkOrderService.getTypeIcon(workOrder.work_order_type)} {workOrder.work_order_type}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="flag-outline" size={20} color={colors.text.secondary} />
              <Text style={styles.infoLabel}>Priority:</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border }]}>
                <Text style={[styles.priorityText, { color: priorityStyle.border }]}>
                  {WorkOrderService.getPriorityLabel(workOrder.priority)}
                </Text>
              </View>
            </View>
            {workOrder.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoText}>{workOrder.location}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduling</Text>
          <View style={styles.infoCard}>
            {workOrder.planned_start_date && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Planned Start:</Text>
                <Text style={styles.infoText}>
                  {WorkOrderService.formatDate(workOrder.planned_start_date)}
                </Text>
              </View>
            )}
            {workOrder.planned_end_date && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Planned End:</Text>
                <Text style={styles.infoText}>
                  {WorkOrderService.formatDate(workOrder.planned_end_date)}
                </Text>
              </View>
            )}
            {workOrder.actual_start_date && (
              <View style={styles.infoRow}>
                <Ionicons name="play-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Actual Start:</Text>
                <Text style={styles.infoText}>
                  {WorkOrderService.formatDate(workOrder.actual_start_date)}
                </Text>
              </View>
            )}
            {workOrder.actual_end_date && (
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Actual End:</Text>
                <Text style={styles.infoText}>
                  {WorkOrderService.formatDate(workOrder.actual_end_date)}
                </Text>
              </View>
            )}
            {workOrder.estimated_hours > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Estimated Hours:</Text>
                <Text style={styles.infoText}>{workOrder.estimated_hours}h</Text>
              </View>
            )}
            {workOrder.actual_hours > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
                <Text style={styles.infoLabel}>Actual Hours:</Text>
                <Text style={styles.infoText}>{workOrder.actual_hours}h</Text>
              </View>
            )}
          </View>
        </View>

        {workOrder.completion_percentage > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.infoCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Completion</Text>
                <Text style={styles.progressValue}>{workOrder.completion_percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${workOrder.completion_percentage}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {workOrder.estimated_cost > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Costs</Text>
            <View style={styles.infoCard}>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Estimated Cost:</Text>
                <Text style={styles.financialValue}>
                  {formatCurrency(workOrder.estimated_cost)}
                </Text>
              </View>
              {workOrder.actual_cost > 0 && (
                <View style={styles.financialRow}>
                  <Text style={styles.financialLabel}>Actual Cost:</Text>
                  <Text style={styles.financialValue}>
                    {formatCurrency(workOrder.actual_cost)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {workOrder.instructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{workOrder.instructions}</Text>
            </View>
          </View>
        )}

        {workOrder.safety_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{workOrder.safety_notes}</Text>
            </View>
          </View>
        )}

        {workOrder.quality_requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quality Requirements</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>{workOrder.quality_requirements}</Text>
            </View>
          </View>
        )}

        {workOrder.materials_required && workOrder.materials_required.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materials Required</Text>
            <View style={styles.infoCard}>
              {workOrder.materials_required.map((material, index) => (
                <View key={index} style={styles.materialItem}>
                  <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.materialText}>{material}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {workOrder.tags && workOrder.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.infoCard}>
              <View style={styles.tagsContainer}>
                {workOrder.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Work Order</Text>
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
  workOrderNumber: {
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
  workOrderTitle: {
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
    minWidth: 100,
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
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  materialText: {
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
