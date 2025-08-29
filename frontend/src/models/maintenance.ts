// Maintenance Module Types and Interfaces

export enum MaintenanceStatus {
  SCHEDULED = "scheduled",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
  REQUIRES_APPROVAL = "requires_approval",
}

export enum MaintenancePriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
  EMERGENCY = "emergency",
}

export enum MaintenanceType {
  PREVENTIVE = "preventive",
  CORRECTIVE = "corrective",
  PREDICTIVE = "predictive",
  EMERGENCY = "emergency",
  INSPECTION = "inspection",
  CALIBRATION = "calibration",
  REPAIR = "repair",
  REPLACEMENT = "replacement",
}

export enum EquipmentStatus {
  OPERATIONAL = "operational",
  MAINTENANCE = "maintenance",
  REPAIR = "repair",
  OUT_OF_SERVICE = "out_of_service",
  RETIRED = "retired",
}

export enum MaintenanceCategory {
  MECHANICAL = "mechanical",
  ELECTRICAL = "electrical",
  ELECTRONIC = "electronic",
  HYDRAULIC = "hydraulic",
  PNEUMATIC = "pneumatic",
  SOFTWARE = "software",
  SAFETY = "safety",
  GENERAL = "general",
}

// Base Models
export interface MaintenanceScheduleBase {
  title: string;
  description?: string;
  maintenance_type: MaintenanceType;
  priority: MaintenancePriority;
  category: MaintenanceCategory;
  equipment_id: string;
  location?: string;
  scheduled_date: string;
  estimated_duration_hours: number;
  assigned_technician_id?: string;
  required_parts: string[];
  required_tools: string[];
  safety_requirements: string[];
  maintenance_procedures: string[];
  estimated_cost: number;
  tags: string[];
}

export interface MaintenanceWorkOrderBase {
  maintenance_schedule_id: string;
  technician_id: string;
  start_time?: string;
  end_time?: string;
  status: MaintenanceStatus;
  actual_duration_hours?: number;
  work_performed: string[];
  parts_used: Array<{ part: string; quantity: number; cost: number }>;
  tools_used: string[];
  issues_encountered: string[];
  solutions_applied: string[];
  quality_checks: Array<{ check: string; result: string; notes?: string }>;
  photos: string[];
  documents: string[];
  notes?: string;
  approval_required: boolean;
  approved_by_id?: string;
}

export interface EquipmentBase {
  name: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  category: MaintenanceCategory;
  location?: string;
  status: EquipmentStatus;
  installation_date?: string;
  warranty_expiry?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_interval_hours?: number;
  operating_hours: number;
  specifications: Record<string, any>;
  maintenance_history: string[];
  assigned_technicians: string[];
  critical_spare_parts: string[];
  operating_instructions?: string;
  safety_guidelines: string[];
  tags: string[];
}

export interface MaintenanceReportBase {
  title: string;
  description?: string;
  maintenance_work_order_id: string;
  equipment_id: string;
  report_date: string;
  maintenance_type: MaintenanceType;
  technician_id: string;
  work_summary: string;
  parts_replaced: Array<{ part: string; quantity: number; cost: number }>;
  tools_used: string[];
  issues_found: string[];
  recommendations: string[];
  next_maintenance_date?: string;
  cost_breakdown: Record<string, number>;
  total_cost: number;
  efficiency_improvement?: number;
  safety_improvements: string[];
  compliance_notes: string[];
  photos: string[];
  documents: string[];
  approval_status: string;
  approved_by_id?: string;
}

// Create Models
export interface MaintenanceScheduleCreate extends MaintenanceScheduleBase {}

export interface MaintenanceWorkOrderCreate extends MaintenanceWorkOrderBase {}

export interface EquipmentCreate extends EquipmentBase {}

export interface MaintenanceReportCreate extends MaintenanceReportBase {}

// Update Models
export interface MaintenanceScheduleUpdate {
  title?: string;
  description?: string;
  maintenance_type?: MaintenanceType;
  priority?: MaintenancePriority;
  category?: MaintenanceCategory;
  equipment_id?: string;
  location?: string;
  scheduled_date?: string;
  estimated_duration_hours?: number;
  assigned_technician_id?: string;
  required_parts?: string[];
  required_tools?: string[];
  safety_requirements?: string[];
  maintenance_procedures?: string[];
  estimated_cost?: number;
  tags?: string[];
}

export interface MaintenanceWorkOrderUpdate {
  start_time?: string;
  end_time?: string;
  status?: MaintenanceStatus;
  actual_duration_hours?: number;
  work_performed?: string[];
  parts_used?: Array<{ part: string; quantity: number; cost: number }>;
  tools_used?: string[];
  issues_encountered?: string[];
  solutions_applied?: string[];
  quality_checks?: Array<{ check: string; result: string; notes?: string }>;
  photos?: string[];
  documents?: string[];
  notes?: string;
  approval_required?: boolean;
  approved_by_id?: string;
}

export interface EquipmentUpdate {
  name?: string;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  category?: MaintenanceCategory;
  location?: string;
  status?: EquipmentStatus;
  installation_date?: string;
  warranty_expiry?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_interval_hours?: number;
  operating_hours?: number;
  specifications?: Record<string, any>;
  maintenance_history?: string[];
  assigned_technicians?: string[];
  critical_spare_parts?: string[];
  operating_instructions?: string;
  safety_guidelines?: string[];
  tags?: string[];
}

export interface MaintenanceReportUpdate {
  title?: string;
  description?: string;
  report_date?: string;
  work_summary?: string;
  parts_replaced?: Array<{ part: string; quantity: number; cost: number }>;
  tools_used?: string[];
  issues_found?: string[];
  recommendations?: string[];
  next_maintenance_date?: string;
  cost_breakdown?: Record<string, number>;
  total_cost?: number;
  efficiency_improvement?: number;
  safety_improvements?: string[];
  compliance_notes?: string[];
  photos?: string[];
  documents?: string[];
  approval_status?: string;
  approved_by_id?: string;
}

// Response Models
export interface MaintenanceScheduleResponse extends MaintenanceScheduleBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by_id: string;
  updated_by_id?: string;
}

export interface MaintenanceWorkOrderResponse extends MaintenanceWorkOrderBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by_id: string;
  updated_by_id?: string;
}

export interface EquipmentResponse extends EquipmentBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by_id: string;
  updated_by_id?: string;
}

export interface MaintenanceReportResponse extends MaintenanceReportBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  created_by_id: string;
  updated_by_id?: string;
}

// Dashboard and Filter Models
export interface MaintenanceDashboardStats {
  total_equipment: number;
  operational_equipment: number;
  maintenance_equipment: number;
  overdue_maintenance: number;
  scheduled_maintenance: number;
  completed_maintenance: number;
  total_cost: number;
  efficiency_score: number;
  uptime_percentage: number;
}

export interface MaintenanceFilter {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  type?: MaintenanceType;
  category?: MaintenanceCategory;
  equipment_id?: string;
  assigned_technician_id?: string;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
  tags?: string[];
}

export interface MaintenanceSearch {
  query: string;
  filters?: MaintenanceFilter;
}

// Utility Functions
export const getMaintenanceStatusColor = (
  status: MaintenanceStatus,
): string => {
  switch (status) {
    case MaintenanceStatus.SCHEDULED:
      return "bg-blue-100 text-blue-800";
    case MaintenanceStatus.IN_PROGRESS:
      return "bg-yellow-100 text-yellow-800";
    case MaintenanceStatus.COMPLETED:
      return "bg-green-100 text-green-800";
    case MaintenanceStatus.OVERDUE:
      return "bg-red-100 text-red-800";
    case MaintenanceStatus.CANCELLED:
      return "bg-gray-100 text-gray-800";
    case MaintenanceStatus.REQUIRES_APPROVAL:
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getMaintenancePriorityColor = (
  priority: MaintenancePriority,
): string => {
  switch (priority) {
    case MaintenancePriority.LOW:
      return "bg-gray-100 text-gray-800";
    case MaintenancePriority.MEDIUM:
      return "bg-blue-100 text-blue-800";
    case MaintenancePriority.HIGH:
      return "bg-orange-100 text-orange-800";
    case MaintenancePriority.CRITICAL:
      return "bg-red-100 text-red-800";
    case MaintenancePriority.EMERGENCY:
      return "bg-red-200 text-red-900";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getEquipmentStatusColor = (status: EquipmentStatus): string => {
  switch (status) {
    case EquipmentStatus.OPERATIONAL:
      return "bg-green-100 text-green-800";
    case EquipmentStatus.MAINTENANCE:
      return "bg-yellow-100 text-yellow-800";
    case EquipmentStatus.REPAIR:
      return "bg-orange-100 text-orange-800";
    case EquipmentStatus.OUT_OF_SERVICE:
      return "bg-red-100 text-red-800";
    case EquipmentStatus.RETIRED:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getMaintenanceTypeIcon = (type: MaintenanceType): string => {
  switch (type) {
    case MaintenanceType.PREVENTIVE:
      return "🛡️";
    case MaintenanceType.CORRECTIVE:
      return "🔧";
    case MaintenanceType.PREDICTIVE:
      return "📊";
    case MaintenanceType.EMERGENCY:
      return "🚨";
    case MaintenanceType.INSPECTION:
      return "🔍";
    case MaintenanceType.CALIBRATION:
      return "⚖️";
    case MaintenanceType.REPAIR:
      return "🔨";
    case MaintenanceType.REPLACEMENT:
      return "🔄";
    default:
      return "⚙️";
  }
};

export const formatMaintenanceDate = (date: string): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDuration = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours.toFixed(1)}h`;
};
