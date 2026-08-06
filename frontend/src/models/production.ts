// Production Planning Models

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

// Base Models
export interface ProductionPlanBase {
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

export interface ProductionStepBase {
  step_number: number;
  step_name: string;
  description?: string;
  estimated_duration_minutes: number;
  equipment_required: string[];
  materials_consumed: MaterialConsumption[];
  labor_required: LaborRequirement[];
  quality_checkpoints: QualityCheckpoint[];
  inspection_required: boolean;
  depends_on_steps: number[];
  notes?: string;
}

export interface ProductionScheduleBase {
  scheduled_start: string;
  scheduled_end: string;
  resource_allocation: ResourceAllocation;
  capacity_utilization: number;
  constraints: string[];
  dependencies: string[];
}

// Create Models
export interface ProductionPlanCreate extends ProductionPlanBase {}

export interface ProductionStepCreate extends ProductionStepBase {}

export interface ProductionScheduleCreate extends ProductionScheduleBase {
  production_plan_id: string;
}

// Update Models
export interface ProductionPlanUpdate {
  title?: string;
  description?: string;
  production_type?: ProductionType;
  status?: ProductionStatus;
  priority?: ProductionPriority;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  target_quantity?: number;
  actual_quantity?: number;
  unit_of_measure?: string;
  production_line?: string;
  equipment_required?: string[];
  materials_required?: MaterialRequirement[];
  labor_requirements?: LaborRequirement[];
  estimated_material_cost?: number;
  estimated_labor_cost?: number;
  actual_material_cost?: number;
  actual_labor_cost?: number;
  quality_standards?: string;
  inspection_points?: InspectionPoint[];
  tolerance_specs?: ToleranceSpec[];
  project_id?: string;
  work_order_id?: string;
  assigned_to_id?: string;
  completion_percentage?: number;
  current_step?: string;
  notes?: ProductionNote[];
  tags?: string[];
}

export interface ProductionStepUpdate {
  step_name?: string;
  description?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  status?: string;
  equipment_required?: string[];
  materials_consumed?: MaterialConsumption[];
  labor_required?: LaborRequirement[];
  quality_checkpoints?: QualityCheckpoint[];
  inspection_required?: boolean;
  depends_on_steps?: number[];
  notes?: string;
}

export interface ProductionScheduleUpdate {
  scheduled_start?: string;
  scheduled_end?: string;
  resource_allocation?: ResourceAllocation;
  capacity_utilization?: number;
  constraints?: string[];
  dependencies?: string[];
  status?: string;
}

// Response Models
export interface ProductionStepResponse extends ProductionStepBase {
  id: string;
  production_plan_id: string;
  status: string;
  actual_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface ProductionScheduleResponse extends ProductionScheduleBase {
  id: string;
  production_plan_id: string;
  tenant_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionPlanResponse extends ProductionPlanBase {
  id: string;
  tenant_id: string;
  plan_number: string;
  status: ProductionStatus;
  actual_start_date?: string;
  actual_end_date?: string;
  estimated_duration_hours: number;
  actual_duration_hours: number;
  actual_quantity: number;
  completion_percentage: number;
  current_step?: string;
  notes: ProductionNote[];
  created_at: string;
  updated_at: string;
  production_steps: ProductionStepResponse[];
  production_schedules: ProductionScheduleResponse[];
}

// List Response Models
export interface ProductionPlansResponse {
  production_plans: ProductionPlanResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ProductionStepsResponse {
  production_steps: ProductionStepResponse[];
  total: number;
}

export interface ProductionSchedulesResponse {
  production_schedules: ProductionScheduleResponse[];
  total: number;
}

// Dashboard Models
export interface ProductionDashboardStats {
  total_plans: number;
  status_counts: Record<string, number>;
  priority_counts: Record<string, number>;
  completion_rate: number;
  completed_plans: number;
  in_progress_plans: number;
  planned_plans: number;
  on_hold_plans: number;
  cancelled_plans: number;
}

export interface ProductionDashboard {
  stats: ProductionDashboardStats;
  recent_plans: ProductionPlanResponse[];
  upcoming_deadlines: ProductionPlanResponse[];
  priority_alerts: ProductionPlanResponse[];
}

// Filter Models
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

// Supporting Interfaces
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

export interface ProductionNote {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  timestamp: string;
  type: 'general' | 'quality' | 'safety' | 'technical';
}

// Utility Types
export type ProductionPlanFormData = Omit<
  ProductionPlanCreate,
  | 'materials_required'
  | 'labor_requirements'
  | 'inspection_points'
  | 'tolerance_specs'
  | 'tags'
> & {
  materials_required: MaterialRequirement[];
  labor_requirements: LaborRequirement[];
  inspection_points: InspectionPoint[];
  tolerance_specs: ToleranceSpec[];
  tags: string[];
};

export type ProductionStepFormData = Omit<
  ProductionStepCreate,
  | 'equipment_required'
  | 'materials_consumed'
  | 'labor_required'
  | 'quality_checkpoints'
  | 'depends_on_steps'
> & {
  equipment_required: string[];
  materials_consumed: MaterialConsumption[];
  labor_required: LaborRequirement[];
  quality_checkpoints: QualityCheckpoint[];
  depends_on_steps: number[];
};
