export enum ProductionStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProductionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ProductionType {
  BATCH = 'batch',
  CONTINUOUS = 'continuous',
  JOB_SHOP = 'job_shop',
  ASSEMBLY = 'assembly',
  CUSTOM = 'custom',
}

export interface MaterialRequirement {
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
}

export interface MaterialConsumption {
  material_id: string;
  material_name: string;
  quantity_consumed: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
}

export interface LaborRequirement {
  role: string;
  hours_required: number;
  hourly_rate: number;
  total_cost: number;
}

export interface QualityCheckpoint {
  checkpoint_name: string;
  description: string;
  acceptance_criteria: string;
  measurement_method: string;
  tolerance: string;
}

export interface ToleranceSpec {
  parameter: string;
  nominal_value: number;
  upper_tolerance: number;
  lower_tolerance: number;
  unit: string;
}

export interface InspectionPoint {
  point_name: string;
  description: string;
  location: string;
  frequency: string;
  inspector_role: string;
}

export interface ProductionNote {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  timestamp: string;
  type: 'general' | 'quality' | 'safety' | 'technical';
}

export interface ResourceAllocation {
  equipment: EquipmentAllocation[];
  labor: LaborAllocation[];
  materials: MaterialAllocation[];
}

export interface EquipmentAllocation {
  equipment_id: string;
  equipment_name: string;
  start_time: string;
  end_time: string;
  utilization_percentage: number;
}

export interface LaborAllocation {
  role: string;
  employee_id?: string;
  employee_name?: string;
  hours_allocated: number;
  start_time: string;
  end_time: string;
}

export interface MaterialAllocation {
  material_id: string;
  material_name: string;
  quantity_allocated: number;
  unit: string;
  delivery_time: string;
}

export interface ProductionStepResponse {
  id: string;
  production_plan_id: string;
  step_number: number;
  step_name: string;
  description?: string;
  estimated_duration_minutes: number;
  actual_duration_minutes: number;
  status: string;
  equipment_required: string[];
  materials_consumed: MaterialConsumption[];
  labor_required: LaborRequirement[];
  quality_checkpoints: QualityCheckpoint[];
  inspection_required: boolean;
  depends_on_steps: number[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionScheduleResponse {
  id: string;
  production_plan_id: string;
  tenant_id: string;
  scheduled_start: string;
  scheduled_end: string;
  resource_allocation: ResourceAllocation;
  capacity_utilization: number;
  constraints: string[];
  dependencies: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionPlan {
  id: string;
  tenant_id: string;
  plan_number: string;
  title: string;
  description?: string;
  production_type: ProductionType;
  status: ProductionStatus;
  priority: ProductionPriority;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  target_quantity: number;
  actual_quantity: number;
  unit_of_measure: string;
  production_line?: string;
  equipment_required: string[];
  materials_required: MaterialRequirement[];
  labor_requirements: LaborRequirement[];
  estimated_material_cost: number;
  estimated_labor_cost: number;
  actual_material_cost: number;
  actual_labor_cost: number;
  quality_standards?: string;
  inspection_points: InspectionPoint[];
  tolerance_specs: ToleranceSpec[];
  project_id?: string;
  work_order_id?: string;
  assigned_to_id?: string;
  estimated_duration_hours: number;
  actual_duration_hours: number;
  completion_percentage: number;
  current_step?: string;
  notes: ProductionNote[];
  tags: string[];
  production_steps: ProductionStepResponse[];
  production_schedules: ProductionScheduleResponse[];
  created_at: string;
  updated_at: string;
}

export interface ProductionPlanCreate {
  title: string;
  description?: string;
  production_type: ProductionType;
  priority: ProductionPriority;
  planned_start_date?: string;
  planned_end_date?: string;
  target_quantity: number;
  unit_of_measure: string;
  production_line?: string;
  equipment_required: string[];
  materials_required: MaterialRequirement[];
  labor_requirements: LaborRequirement[];
  estimated_material_cost: number;
  estimated_labor_cost: number;
  quality_standards?: string;
  inspection_points: InspectionPoint[];
  tolerance_specs: ToleranceSpec[];
  project_id?: string;
  work_order_id?: string;
  assigned_to_id?: string;
  tags: string[];
}

export interface ProductionPlanUpdate extends Partial<ProductionPlanCreate> {
  status?: ProductionStatus;
  actual_start_date?: string;
  actual_end_date?: string;
  actual_quantity?: number;
  actual_material_cost?: number;
  actual_labor_cost?: number;
  completion_percentage?: number;
  current_step?: string;
  notes?: ProductionNote[];
}

export interface ProductionPlanFilters {
  status?: ProductionStatus;
  priority?: ProductionPriority;
  production_type?: ProductionType;
  project_id?: string;
  work_order_id?: string;
  assigned_to_id?: string;
  planned_start_date_from?: string;
  planned_start_date_to?: string;
  planned_end_date_from?: string;
  planned_end_date_to?: string;
  search?: string;
}
