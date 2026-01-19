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
import ProductionService from '@/services/ProductionService';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ProductionPlan } from '@/models/production';

export default function ProductionPlanDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const { id } = route.params as { id: string };
  const [productionPlan, setProductionPlan] = useState<ProductionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    loadProductionPlan();
  }, [id]);

  const loadProductionPlan = async () => {
    try {
      setLoading(true);
      const data = await ProductionService.getProductionPlan(id);
      setProductionPlan(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load production plan');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Production Plan',
      'Are you sure you want to delete this production plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProductionService.deleteProductionPlan(id);
              Alert.alert('Success', 'Production plan deleted successfully');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete production plan');
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    (navigation.navigate as any)('ProductionPlanForm', { id, productionPlan });
  };

  if (loading) {
    return (
      <Container safeArea>
        <Header title="Production Plan Details" gradient={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      </Container>
    );
  }

  if (!productionPlan) {
    return (
      <Container safeArea>
        <Header title="Production Plan Details" gradient={false} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Production plan not found</Text>
        </View>
      </Container>
    );
  }

  const statusStyle = ProductionService.getStatusColor(productionPlan.status);
  const priorityStyle = ProductionService.getPriorityColor(productionPlan.priority);

  return (
    <Container safeArea>
      <Header
        title="Production Plan Details"
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
            <Text style={styles.planNumber}>{productionPlan.plan_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <Text style={[styles.statusText, { color: statusStyle.border }]}>
                {ProductionService.getStatusLabel(productionPlan.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.planTitle}>{productionPlan.title}</Text>
          {productionPlan.description && (
            <Text style={styles.description}>{productionPlan.description}</Text>
          )}
        </View>

        {productionPlan.completion_percentage > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progress</Text>
            <View style={styles.infoCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Completion</Text>
                <Text style={styles.progressValue}>{productionPlan.completion_percentage}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${productionPlan.completion_percentage}%` },
                  ]}
                />
              </View>
              <View style={styles.progressDetails}>
                <View style={styles.progressDetailItem}>
                  <Text style={styles.progressDetailLabel}>Target:</Text>
                  <Text style={styles.progressDetailValue}>
                    {productionPlan.target_quantity} {productionPlan.unit_of_measure}
                  </Text>
                </View>
                <View style={styles.progressDetailItem}>
                  <Text style={styles.progressDetailLabel}>Actual:</Text>
                  <Text style={styles.progressDetailValue}>
                    {productionPlan.actual_quantity} {productionPlan.unit_of_measure}
                  </Text>
                </View>
                <View style={styles.progressDetailItem}>
                  <Text style={styles.progressDetailLabel}>Duration:</Text>
                  <Text style={styles.progressDetailValue}>{productionPlan.estimated_duration_hours}h</Text>
                </View>
                {productionPlan.current_step && (
                  <View style={styles.progressDetailItem}>
                    <Text style={styles.progressDetailLabel}>Current Step:</Text>
                    <Text style={styles.progressDetailValue}>{productionPlan.current_step}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
            {['overview', 'materials', 'labor', 'quality', 'steps', 'schedules'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.tabActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {activeTab === 'overview' && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="factory-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoText}>
                    {ProductionService.getTypeIcon(productionPlan.production_type)} {ProductionService.getTypeLabel(productionPlan.production_type)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="flag-outline" size={20} color={colors.text.secondary} />
                  <Text style={styles.infoLabel}>Priority:</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border }]}>
                    <Text style={[styles.priorityText, { color: priorityStyle.border }]}>
                      {ProductionService.getPriorityLabel(productionPlan.priority)}
                    </Text>
                  </View>
                </View>
                {productionPlan.production_line && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
                    <Text style={styles.infoLabel}>Production Line:</Text>
                    <Text style={styles.infoText}>{productionPlan.production_line}</Text>
                  </View>
                )}
                {productionPlan.planned_start_date && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                    <Text style={styles.infoLabel}>Planned Start:</Text>
                    <Text style={styles.infoText}>
                      {ProductionService.formatDate(productionPlan.planned_start_date)}
                    </Text>
                  </View>
                )}
                {productionPlan.planned_end_date && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                    <Text style={styles.infoLabel}>Planned End:</Text>
                    <Text style={styles.infoText}>
                      {ProductionService.formatDate(productionPlan.planned_end_date)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cost Summary</Text>
              <View style={styles.infoCard}>
                <View style={styles.costRow}>
                  <Ionicons name="cube-outline" size={24} color={colors.blue[600]} />
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Material Cost</Text>
                    <Text style={styles.costValue}>
                      {formatCurrency(productionPlan.estimated_material_cost)}
                    </Text>
                  </View>
                </View>
                <View style={styles.costRow}>
                  <Ionicons name="people-outline" size={24} color={colors.green[600]} />
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Labor Cost</Text>
                    <Text style={styles.costValue}>
                      {formatCurrency(productionPlan.estimated_labor_cost)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.costRow, styles.totalCostRow]}>
                  <Ionicons name="wallet-outline" size={24} color={colors.purple[600]} />
                  <View style={styles.costItem}>
                    <Text style={styles.costLabel}>Total Cost</Text>
                    <Text style={styles.costValue}>
                      {formatCurrency(productionPlan.estimated_material_cost + productionPlan.estimated_labor_cost)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {productionPlan.tags && productionPlan.tags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.infoCard}>
                  <View style={styles.tagsContainer}>
                    {productionPlan.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'materials' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materials Required</Text>
            <View style={styles.infoCard}>
              {productionPlan.materials_required && productionPlan.materials_required.length > 0 ? (
                productionPlan.materials_required.map((material, index) => (
                  <View key={index} style={styles.materialItem}>
                    <Ionicons name="cube-outline" size={20} color={colors.text.secondary} />
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialName}>{material.material_name}</Text>
                      <Text style={styles.materialDetails}>
                        {material.quantity} {material.unit}
                      </Text>
                    </View>
                    <View style={styles.materialCost}>
                      <Text style={styles.materialCostValue}>
                        {formatCurrency(material.total_cost)}
                      </Text>
                      <Text style={styles.materialCostUnit}>
                        {getCurrencySymbol()}{material.cost_per_unit} per {material.unit}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No materials specified</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'labor' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Labor Requirements</Text>
            <View style={styles.infoCard}>
              {productionPlan.labor_requirements && productionPlan.labor_requirements.length > 0 ? (
                productionPlan.labor_requirements.map((labor, index) => (
                  <View key={index} style={styles.laborItem}>
                    <Ionicons name="people-outline" size={20} color={colors.text.secondary} />
                    <View style={styles.laborInfo}>
                      <Text style={styles.laborRole}>{labor.role}</Text>
                      <Text style={styles.laborDetails}>
                        {labor.hours_required} hours @ {formatCurrency(labor.hourly_rate)}/hour
                      </Text>
                    </View>
                    <Text style={styles.laborCost}>
                      {formatCurrency(labor.total_cost)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No labor requirements specified</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'quality' && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quality Standards</Text>
              <View style={styles.infoCard}>
                {productionPlan.quality_standards ? (
                  <Text style={styles.infoText}>{productionPlan.quality_standards}</Text>
                ) : (
                  <Text style={styles.emptyText}>No quality standards specified</Text>
                )}
              </View>
            </View>

            {productionPlan.equipment_required && productionPlan.equipment_required.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Equipment Required</Text>
                <View style={styles.infoCard}>
                  {productionPlan.equipment_required.map((equipment, index) => (
                    <View key={index} style={styles.materialItem}>
                      <Ionicons name="construct-outline" size={20} color={colors.text.secondary} />
                      <Text style={styles.materialText}>{equipment}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {productionPlan.inspection_points && productionPlan.inspection_points.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Inspection Points</Text>
                <View style={styles.infoCard}>
                  {productionPlan.inspection_points.map((point, index) => (
                    <View key={index} style={styles.stepItem}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.text.secondary} />
                      <View style={styles.stepInfo}>
                        <Text style={styles.stepName}>{point.point_name}</Text>
                        <Text style={styles.stepDetails}>
                          {point.location} - {point.frequency} - {point.inspector_role}
                        </Text>
                        {point.description && (
                          <Text style={styles.stepDetails}>{point.description}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {productionPlan.tolerance_specs && productionPlan.tolerance_specs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tolerance Specifications</Text>
                <View style={styles.infoCard}>
                  {productionPlan.tolerance_specs.map((spec, index) => (
                    <View key={index} style={styles.stepItem}>
                      <Ionicons name="resize-outline" size={20} color={colors.text.secondary} />
                      <View style={styles.stepInfo}>
                        <Text style={styles.stepName}>{spec.parameter}</Text>
                        <Text style={styles.stepDetails}>
                          Nominal: {spec.nominal_value} {spec.unit} (+{spec.upper_tolerance}/-{spec.lower_tolerance})
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'steps' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Production Steps</Text>
            <View style={styles.infoCard}>
              {productionPlan.production_steps && productionPlan.production_steps.length > 0 ? (
                productionPlan.production_steps.map((step) => (
                  <View key={step.id} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{step.step_number}</Text>
                    </View>
                    <View style={styles.stepInfo}>
                      <Text style={styles.stepName}>{step.step_name}</Text>
                      <Text style={styles.stepDetails}>
                        {step.estimated_duration_minutes} minutes
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.statusText, { color: statusStyle.border }]}>
                        {step.status}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No production steps defined</Text>
              )}
            </View>
          </View>
        )}

        {activeTab === 'schedules' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Production Schedules</Text>
            <View style={styles.infoCard}>
              {productionPlan.production_schedules && productionPlan.production_schedules.length > 0 ? (
                productionPlan.production_schedules.map((schedule) => (
                  <View key={schedule.id} style={styles.scheduleItem}>
                    <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleDates}>
                        {ProductionService.formatDate(schedule.scheduled_start)} - {ProductionService.formatDate(schedule.scheduled_end)}
                      </Text>
                      <Text style={styles.scheduleDetails}>
                        Capacity: {schedule.capacity_utilization}%
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                      <Text style={[styles.statusText, { color: statusStyle.border }]}>
                        {schedule.status}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No schedules defined</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.background.default} />
            <Text style={styles.deleteButtonText}>Delete Production Plan</Text>
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
    textAlign: 'center',
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
  planNumber: {
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
  planTitle: {
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
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 4,
  },
  progressDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  progressDetailItem: {
    flex: 1,
    minWidth: '45%',
  },
  progressDetailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  progressDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tabsContainer: {
    marginBottom: spacing.md,
  },
  tabsScrollContent: {
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background.muted,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  tabText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.background.default,
    fontWeight: '600',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  totalCostRow: {
    borderBottomWidth: 0,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.border.default,
  },
  costItem: {
    flex: 1,
  },
  costLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '600',
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
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  materialDetails: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  materialCost: {
    alignItems: 'flex-end',
  },
  materialCostValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  materialCostUnit: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  laborItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  laborInfo: {
    flex: 1,
  },
  laborRole: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  laborDetails: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  laborCost: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepDetails: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDates: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  scheduleDetails: {
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
