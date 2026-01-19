import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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
import {
  ProductionPlan,
  ProductionPlanCreate,
  ProductionPriority,
  ProductionType,
  MaterialRequirement,
  LaborRequirement,
  InspectionPoint,
  ToleranceSpec,
} from '@/models/production';

export default function ProductionPlanFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const { id, productionPlan } = route.params as { id?: string; productionPlan?: ProductionPlan };
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Partial<MaterialRequirement>>({
    material_name: '',
    quantity: 0,
    unit: 'pieces',
    cost_per_unit: 0,
  });
  const [newLabor, setNewLabor] = useState<Partial<LaborRequirement>>({
    role: '',
    hours_required: 0,
    hourly_rate: 0,
  });
  const [newTag, setNewTag] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newInspectionPoint, setNewInspectionPoint] = useState<Partial<InspectionPoint>>({
    point_name: '',
    description: '',
    location: '',
    frequency: '',
    inspector_role: '',
  });
  const [newToleranceSpec, setNewToleranceSpec] = useState<Partial<ToleranceSpec>>({
    parameter: '',
    nominal_value: 0,
    upper_tolerance: 0,
    lower_tolerance: 0,
    unit: '',
  });

  const [formData, setFormData] = useState<ProductionPlanCreate>({
    title: productionPlan?.title || '',
    description: productionPlan?.description || '',
    production_type: productionPlan?.production_type || ProductionType.BATCH,
    priority: productionPlan?.priority || ProductionPriority.MEDIUM,
    planned_start_date: productionPlan?.planned_start_date
      ? productionPlan.planned_start_date.split('T')[0]
      : '',
    planned_end_date: productionPlan?.planned_end_date
      ? productionPlan.planned_end_date.split('T')[0]
      : '',
    target_quantity: productionPlan?.target_quantity || 0,
    unit_of_measure: productionPlan?.unit_of_measure || 'pieces',
    production_line: productionPlan?.production_line || '',
    equipment_required: productionPlan?.equipment_required || [],
    materials_required: productionPlan?.materials_required || [],
    labor_requirements: productionPlan?.labor_requirements || [],
    estimated_material_cost: productionPlan?.estimated_material_cost || 0,
    estimated_labor_cost: productionPlan?.estimated_labor_cost || 0,
    quality_standards: productionPlan?.quality_standards || '',
    inspection_points: productionPlan?.inspection_points || [],
    tolerance_specs: productionPlan?.tolerance_specs || [],
    tags: productionPlan?.tags || [],
  });

  const priorityOptions = [ProductionPriority.LOW, ProductionPriority.MEDIUM, ProductionPriority.HIGH, ProductionPriority.URGENT];
  const typeOptions = [ProductionType.BATCH, ProductionType.CONTINUOUS, ProductionType.JOB_SHOP, ProductionType.ASSEMBLY, ProductionType.CUSTOM];

  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.target_quantity > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEdit && id) {
        await ProductionService.updateProductionPlan(id, formData);
        Alert.alert('Success', 'Production plan updated successfully');
      } else {
        await ProductionService.createProductionPlan(formData);
        Alert.alert('Success', 'Production plan created successfully');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save production plan');
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    if (
      newMaterial.material_name &&
      newMaterial.quantity &&
      newMaterial.cost_per_unit
    ) {
      const material: MaterialRequirement = {
        material_id: Date.now().toString(),
        material_name: newMaterial.material_name,
        quantity: newMaterial.quantity,
        unit: newMaterial.unit || 'pieces',
        cost_per_unit: newMaterial.cost_per_unit,
        total_cost: newMaterial.quantity * newMaterial.cost_per_unit,
      };
      setFormData({
        ...formData,
        materials_required: [...(formData.materials_required || []), material],
        estimated_material_cost:
          (formData.estimated_material_cost || 0) + material.total_cost,
      });
      setNewMaterial({
        material_name: '',
        quantity: 0,
        unit: 'pieces',
        cost_per_unit: 0,
      });
    }
  };

  const removeMaterial = (index: number) => {
    const materials = [...(formData.materials_required || [])];
    const removed = materials.splice(index, 1)[0];
    setFormData({
      ...formData,
      materials_required: materials,
      estimated_material_cost:
        (formData.estimated_material_cost || 0) - removed.total_cost,
    });
  };

  const addLabor = () => {
    if (newLabor.role && newLabor.hours_required && newLabor.hourly_rate) {
      const labor: LaborRequirement = {
        role: newLabor.role,
        hours_required: newLabor.hours_required,
        hourly_rate: newLabor.hourly_rate,
        total_cost: newLabor.hours_required * newLabor.hourly_rate,
      };
      setFormData({
        ...formData,
        labor_requirements: [...(formData.labor_requirements || []), labor],
        estimated_labor_cost:
          (formData.estimated_labor_cost || 0) + labor.total_cost,
      });
      setNewLabor({ role: '', hours_required: 0, hourly_rate: 0 });
    }
  };

  const removeLabor = (index: number) => {
    const labor = [...(formData.labor_requirements || [])];
    const removed = labor.splice(index, 1)[0];
    setFormData({
      ...formData,
      labor_requirements: labor,
      estimated_labor_cost:
        (formData.estimated_labor_cost || 0) - removed.total_cost,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  const addEquipment = () => {
    if (newEquipment.trim() && !formData.equipment_required?.includes(newEquipment.trim())) {
      setFormData({
        ...formData,
        equipment_required: [...(formData.equipment_required || []), newEquipment.trim()],
      });
      setNewEquipment('');
    }
  };

  const removeEquipment = (equipment: string) => {
    setFormData({
      ...formData,
      equipment_required: formData.equipment_required?.filter((e) => e !== equipment) || [],
    });
  };

  const addInspectionPoint = () => {
    if (
      newInspectionPoint.point_name &&
      newInspectionPoint.description &&
      newInspectionPoint.location &&
      newInspectionPoint.frequency &&
      newInspectionPoint.inspector_role
    ) {
      const inspectionPoint: InspectionPoint = {
        point_name: newInspectionPoint.point_name,
        description: newInspectionPoint.description,
        location: newInspectionPoint.location,
        frequency: newInspectionPoint.frequency,
        inspector_role: newInspectionPoint.inspector_role,
      };
      setFormData({
        ...formData,
        inspection_points: [...(formData.inspection_points || []), inspectionPoint],
      });
      setNewInspectionPoint({
        point_name: '',
        description: '',
        location: '',
        frequency: '',
        inspector_role: '',
      });
    }
  };

  const removeInspectionPoint = (index: number) => {
    const points = [...(formData.inspection_points || [])];
    points.splice(index, 1);
    setFormData({
      ...formData,
      inspection_points: points,
    });
  };

  const addToleranceSpec = () => {
    if (
      newToleranceSpec.parameter &&
      newToleranceSpec.nominal_value !== undefined &&
      newToleranceSpec.upper_tolerance !== undefined &&
      newToleranceSpec.lower_tolerance !== undefined &&
      newToleranceSpec.unit
    ) {
      const toleranceSpec: ToleranceSpec = {
        parameter: newToleranceSpec.parameter,
        nominal_value: newToleranceSpec.nominal_value,
        upper_tolerance: newToleranceSpec.upper_tolerance,
        lower_tolerance: newToleranceSpec.lower_tolerance,
        unit: newToleranceSpec.unit,
      };
      setFormData({
        ...formData,
        tolerance_specs: [...(formData.tolerance_specs || []), toleranceSpec],
      });
      setNewToleranceSpec({
        parameter: '',
        nominal_value: 0,
        upper_tolerance: 0,
        lower_tolerance: 0,
        unit: '',
      });
    }
  };

  const removeToleranceSpec = (index: number) => {
    const specs = [...(formData.tolerance_specs || [])];
    specs.splice(index, 1);
    setFormData({
      ...formData,
      tolerance_specs: specs,
    });
  };

  return (
    <Container safeArea>
      <Header
        title={isEdit ? 'Edit Production Plan' : 'New Production Plan'}
        gradient={false}
        rightIcon="checkmark"
        onRightPress={handleSubmit}
      />
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
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter production plan title"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe the production plan"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Type *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowTypePicker(!showTypePicker)}
                >
                  <Text style={styles.pickerText}>
                    {ProductionService.getTypeIcon(formData.production_type)} {ProductionService.getTypeLabel(formData.production_type)}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                {showTypePicker && (
                  <View style={styles.pickerContainer}>
                    {typeOptions.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.pickerOption}
                        onPress={() => {
                          setFormData({ ...formData, production_type: type });
                          setShowTypePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.production_type === type && styles.pickerOptionTextActive,
                          ]}
                        >
                          {ProductionService.getTypeIcon(type)} {ProductionService.getTypeLabel(type)}
                        </Text>
                        {formData.production_type === type && (
                          <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Priority *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowPriorityPicker(!showPriorityPicker)}
                >
                  <Text style={styles.pickerText}>
                    {ProductionService.getPriorityLabel(formData.priority || ProductionPriority.MEDIUM)}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                {showPriorityPicker && (
                  <View style={styles.pickerContainer}>
                    {priorityOptions.map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={styles.pickerOption}
                        onPress={() => {
                          setFormData({ ...formData, priority });
                          setShowPriorityPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.priority === priority && styles.pickerOptionTextActive,
                          ]}
                        >
                          {ProductionService.getPriorityLabel(priority)}
                        </Text>
                        {formData.priority === priority && (
                          <Ionicons name="checkmark" size={20} color={colors.primary.main} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Target Quantity *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.target_quantity?.toString() || '0'}
                  onChangeText={(text) =>
                    setFormData({ ...formData, target_quantity: parseFloat(text) || 0 })
                  }
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Unit of Measure</Text>
                <TextInput
                  style={styles.input}
                  value={formData.unit_of_measure}
                  onChangeText={(text) => setFormData({ ...formData, unit_of_measure: text })}
                  placeholder="pieces"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Production Line</Text>
              <TextInput
                style={styles.input}
                value={formData.production_line}
                onChangeText={(text) => setFormData({ ...formData, production_line: text })}
                placeholder="Production line identifier"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduling</Text>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Planned Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.planned_start_date}
                  onChangeText={(text) => setFormData({ ...formData, planned_start_date: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>Planned End Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.planned_end_date}
                  onChangeText={(text) => setFormData({ ...formData, planned_end_date: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materials Required</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newMaterial.material_name || ''}
                  onChangeText={(text) => setNewMaterial({ ...newMaterial, material_name: text })}
                  placeholder="Material name"
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={newMaterial.quantity?.toString() || ''}
                  onChangeText={(text) => setNewMaterial({ ...newMaterial, quantity: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="Qty"
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={[styles.input, { width: 80 }]}
                  value={newMaterial.unit || ''}
                  onChangeText={(text) => setNewMaterial({ ...newMaterial, unit: text })}
                  placeholder="Unit"
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={[styles.input, { width: 100 }]}
                  value={newMaterial.cost_per_unit?.toString() || ''}
                  onChangeText={(text) => setNewMaterial({ ...newMaterial, cost_per_unit: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="Cost"
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity style={styles.addButtonIcon} onPress={addMaterial}>
                  <Ionicons name="add" size={20} color={colors.background.default} />
                </TouchableOpacity>
              </View>
            </View>
            {formData.materials_required && formData.materials_required.length > 0 && (
              <View style={styles.itemsContainer}>
                {formData.materials_required.map((material, index) => (
                  <View key={index} style={styles.itemChip}>
                    <View style={styles.itemChipContent}>
                      <Text style={styles.itemChipText}>{material.material_name}</Text>
                      <Text style={styles.itemChipSubtext}>
                        {material.quantity} {material.unit} @ {getCurrencySymbol()}{material.cost_per_unit}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeMaterial(index)}>
                      <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Material Cost:</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(formData.estimated_material_cost || 0)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Labor Requirements</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newLabor.role || ''}
                  onChangeText={(text) => setNewLabor({ ...newLabor, role: text })}
                  placeholder="Role"
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={[styles.input, { width: 100 }]}
                  value={newLabor.hours_required?.toString() || ''}
                  onChangeText={(text) => setNewLabor({ ...newLabor, hours_required: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="Hours"
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={[styles.input, { width: 100 }]}
                  value={newLabor.hourly_rate?.toString() || ''}
                  onChangeText={(text) => setNewLabor({ ...newLabor, hourly_rate: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="Rate/hr"
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity style={styles.addButtonIcon} onPress={addLabor}>
                  <Ionicons name="add" size={20} color={colors.background.default} />
                </TouchableOpacity>
              </View>
            </View>
            {formData.labor_requirements && formData.labor_requirements.length > 0 && (
              <View style={styles.itemsContainer}>
                {formData.labor_requirements.map((labor, index) => (
                  <View key={index} style={styles.itemChip}>
                    <View style={styles.itemChipContent}>
                      <Text style={styles.itemChipText}>{labor.role}</Text>
                      <Text style={styles.itemChipSubtext}>
                        {labor.hours_required}h @ {formatCurrency(labor.hourly_rate)}/hr
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeLabor(index)}>
                      <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Labor Cost:</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(formData.estimated_labor_cost || 0)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Required</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newEquipment}
                  onChangeText={setNewEquipment}
                  placeholder="Equipment name"
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity style={styles.addButtonIcon} onPress={addEquipment}>
                  <Ionicons name="add" size={20} color={colors.background.default} />
                </TouchableOpacity>
              </View>
            </View>
            {formData.equipment_required && formData.equipment_required.length > 0 && (
              <View style={styles.itemsContainer}>
                {formData.equipment_required.map((equipment, index) => (
                  <View key={index} style={styles.itemChip}>
                    <Text style={styles.itemChipText}>{equipment}</Text>
                    <TouchableOpacity onPress={() => removeEquipment(equipment)}>
                      <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quality Standards</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.quality_standards}
                onChangeText={(text) => setFormData({ ...formData, quality_standards: text })}
                placeholder="Quality standards and requirements"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inspection Points</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                value={newInspectionPoint.point_name || ''}
                onChangeText={(text) => setNewInspectionPoint({ ...newInspectionPoint, point_name: text })}
                placeholder="Point name"
                placeholderTextColor={colors.text.secondary}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newInspectionPoint.description || ''}
                onChangeText={(text) => setNewInspectionPoint({ ...newInspectionPoint, description: text })}
                placeholder="Description"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                placeholderTextColor={colors.text.secondary}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newInspectionPoint.location || ''}
                  onChangeText={(text) => setNewInspectionPoint({ ...newInspectionPoint, location: text })}
                  placeholder="Location"
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: spacing.sm }]}
                  value={newInspectionPoint.frequency || ''}
                  onChangeText={(text) => setNewInspectionPoint({ ...newInspectionPoint, frequency: text })}
                  placeholder="Frequency"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <TextInput
                style={styles.input}
                value={newInspectionPoint.inspector_role || ''}
                onChangeText={(text) => setNewInspectionPoint({ ...newInspectionPoint, inspector_role: text })}
                placeholder="Inspector role"
                placeholderTextColor={colors.text.secondary}
              />
              <TouchableOpacity style={styles.addButton} onPress={addInspectionPoint}>
                <Ionicons name="add" size={20} color={colors.background.default} />
                <Text style={styles.addButtonText}>Add Inspection Point</Text>
              </TouchableOpacity>
            </View>
            {formData.inspection_points && formData.inspection_points.length > 0 && (
              <View style={styles.itemsContainer}>
                {formData.inspection_points.map((point, index) => (
                  <View key={index} style={styles.itemChip}>
                    <View style={styles.itemChipContent}>
                      <Text style={styles.itemChipText}>{point.point_name}</Text>
                      <Text style={styles.itemChipSubtext}>
                        {point.location} - {point.frequency} - {point.inspector_role}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeInspectionPoint(index)}>
                      <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tolerance Specifications</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                value={newToleranceSpec.parameter || ''}
                onChangeText={(text) => setNewToleranceSpec({ ...newToleranceSpec, parameter: text })}
                placeholder="Parameter name"
                placeholderTextColor={colors.text.secondary}
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newToleranceSpec.nominal_value?.toString() || ''}
                  onChangeText={(text) => setNewToleranceSpec({ ...newToleranceSpec, nominal_value: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="Nominal value"
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: spacing.sm }]}
                  value={newToleranceSpec.unit || ''}
                  onChangeText={(text) => setNewToleranceSpec({ ...newToleranceSpec, unit: text })}
                  placeholder="Unit"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newToleranceSpec.upper_tolerance?.toString() || ''}
                  onChangeText={(text) => setNewToleranceSpec({ ...newToleranceSpec, upper_tolerance: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="Upper tolerance"
                  placeholderTextColor={colors.text.secondary}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginLeft: spacing.sm }]}
                  value={newToleranceSpec.lower_tolerance?.toString() || ''}
                  onChangeText={(text) => setNewToleranceSpec({ ...newToleranceSpec, lower_tolerance: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                  placeholder="Lower tolerance"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>
              <TouchableOpacity style={styles.addButton} onPress={addToleranceSpec}>
                <Ionicons name="add" size={20} color={colors.background.default} />
                <Text style={styles.addButtonText}>Add Tolerance Spec</Text>
              </TouchableOpacity>
            </View>
            {formData.tolerance_specs && formData.tolerance_specs.length > 0 && (
              <View style={styles.itemsContainer}>
                {formData.tolerance_specs.map((spec, index) => (
                  <View key={index} style={styles.itemChip}>
                    <View style={styles.itemChipContent}>
                      <Text style={styles.itemChipText}>{spec.parameter}</Text>
                      <Text style={styles.itemChipSubtext}>
                        {spec.nominal_value} {spec.unit} (+{spec.upper_tolerance}/-{spec.lower_tolerance})
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeToleranceSpec(index)}>
                      <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add tag"
                  placeholderTextColor={colors.text.secondary}
                />
                <TouchableOpacity style={styles.addButtonIcon} onPress={addTag}>
                  <Ionicons name="add" size={20} color={colors.background.default} />
                </TouchableOpacity>
              </View>
            </View>
            {formData.tags && formData.tags.length > 0 && (
              <View style={styles.itemsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.itemChip}>
                    <Text style={styles.itemChipText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!isFormValid() || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background.default} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.background.default} />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Production Plan' : 'Create Production Plan'}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
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
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  textArea: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  pickerText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  pickerContainer: {
    marginTop: spacing.xs,
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  pickerOptionTextActive: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  addItemRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
    minHeight: 44,
  },
  addButtonIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.background.default,
    fontSize: 14,
    fontWeight: '600',
  },
  itemsContainer: {
    gap: spacing.xs,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.muted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  itemChipContent: {
    flex: 1,
  },
  itemChipText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  itemChipSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
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
