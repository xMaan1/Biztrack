export enum QualityStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
  CONDITIONAL_PASS = 'conditional_pass',
  REQUIRES_REVIEW = 'requires_review',
}

export enum QualityPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum InspectionType {
  VISUAL = 'visual',
  DIMENSIONAL = 'dimensional',
  FUNCTIONAL = 'functional',
  MATERIAL = 'material',
  SAFETY = 'safety',
  ENVIRONMENTAL = 'environmental',
  DOCUMENTATION = 'documentation',
}

export enum DefectSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  CRITICAL = 'critical',
  BLOCKER = 'blocker',
}

export enum QualityStandard {
  ISO_9001 = 'iso_9001',
  ISO_14001 = 'iso_14001',
  ISO_45001 = 'iso_45001',
  FDA = 'fda',
  CE = 'ce',
  CUSTOM = 'custom',
}

export interface QualityCheckBase {
  title: string;
  description?: string;
  inspection_type: InspectionType;
  priority: QualityPriority;
  quality_standard: QualityStandard;
  criteria: string[];
  acceptance_criteria: Record<string, any>;
  tolerance_limits: Record<string, any>;
  required_equipment: string[];
  required_skills: string[];
  estimated_duration_minutes: number;
  production_plan_id?: string;
  work_order_id?: string;
  project_id?: string;
  assigned_to_id?: string;
  scheduled_date?: string;
  tags: string[];
}

export interface QualityCheckCreate extends QualityCheckBase {}

export interface QualityCheckUpdate {
  title?: string;
  description?: string;
  inspection_type?: InspectionType;
  priority?: QualityPriority;
  quality_standard?: QualityStandard;
  criteria?: string[];
  acceptance_criteria?: Record<string, any>;
  tolerance_limits?: Record<string, any>;
  required_equipment?: string[];
  required_skills?: string[];
  estimated_duration_minutes?: number;
  production_plan_id?: string;
  work_order_id?: string;
  project_id?: string;
  assigned_to_id?: string;
  scheduled_date?: string;
  tags?: string[];
}

export interface QualityCheckResponse extends QualityCheckBase {
  id: string;
  tenant_id: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  status: QualityStatus;
  completion_percentage: number;
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  pending_inspections: number;
}

export interface QualityChecksResponse {
  quality_checks: QualityCheckResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface QualityCheckFilters {
  status?: QualityStatus;
  priority?: QualityPriority;
  inspection_type?: InspectionType;
  quality_standard?: QualityStandard;
  production_plan_id?: string;
  work_order_id?: string;
  project_id?: string;
  assigned_to_id?: string;
  scheduled_date_from?: string;
  scheduled_date_to?: string;
  search?: string;
}

export interface QualityDashboardStats {
  total_checks: number;
  pending_checks: number;
  in_progress_checks: number;
  completed_checks: number;
  passed_inspections: number;
  failed_inspections: number;
  open_defects: number;
  critical_defects: number;
  average_compliance_score: number;
  total_cost_impact: number;
}

export interface QualityDashboard {
  stats: QualityDashboardStats;
  recent_checks: QualityCheckResponse[];
  recent_inspections: any[];
  critical_defects: any[];
  upcoming_checks: QualityCheckResponse[];
}

export const getQualityStatusColor = (status: QualityStatus): { bg: string; border: string } => {
  const statusColors: Record<string, { bg: string; border: string }> = {
    pending: { bg: '#fef3c7', border: '#f59e0b' },
    in_progress: { bg: '#dbeafe', border: '#3b82f6' },
    passed: { bg: '#d1fae5', border: '#10b981' },
    failed: { bg: '#fee2e2', border: '#ef4444' },
    conditional_pass: { bg: '#fed7aa', border: '#f97316' },
    requires_review: { bg: '#e9d5ff', border: '#8b5cf6' },
  };
  return statusColors[status] || { bg: '#f3f4f6', border: '#6b7280' };
};

export const getQualityPriorityColor = (priority: QualityPriority): { bg: string; border: string } => {
  const priorityColors: Record<string, { bg: string; border: string }> = {
    low: { bg: '#f3f4f6', border: '#6b7280' },
    medium: { bg: '#dbeafe', border: '#3b82f6' },
    high: { bg: '#fed7aa', border: '#f97316' },
    critical: { bg: '#fee2e2', border: '#ef4444' },
  };
  return priorityColors[priority] || { bg: '#f3f4f6', border: '#6b7280' };
};

export const getQualityStatusLabel = (status: QualityStatus | string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    passed: 'Passed',
    failed: 'Failed',
    conditional_pass: 'Conditional Pass',
    requires_review: 'Requires Review',
  };
  return statusLabels[status] || status;
};

export const getQualityPriorityLabel = (priority: QualityPriority | string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export const getInspectionTypeLabel = (type: InspectionType | string): string => {
  const typeLabels: Record<string, string> = {
    visual: 'Visual Inspection',
    dimensional: 'Dimensional Check',
    functional: 'Functional Test',
    material: 'Material Test',
    safety: 'Safety Check',
    environmental: 'Environmental Test',
    documentation: 'Documentation Review',
  };
  return typeLabels[type] || type;
};

export const getInspectionTypeIcon = (type: InspectionType | string): string => {
  const typeIcons: Record<string, string> = {
    visual: '👁️',
    dimensional: '📏',
    functional: '⚙️',
    material: '🧪',
    safety: '🛡️',
    environmental: '🌱',
    documentation: '📋',
  };
  return typeIcons[type] || '❓';
};

export const getQualityStandardLabel = (standard: QualityStandard | string): string => {
  const standardLabels: Record<string, string> = {
    iso_9001: 'ISO 9001',
    iso_14001: 'ISO 14001',
    iso_45001: 'ISO 45001',
    fda: 'FDA',
    ce: 'CE',
    custom: 'Custom',
  };
  return standardLabels[standard] || standard;
};

export interface QualityInspectionBase {
  quality_check_id: string;
  inspector_id: string;
  inspection_date: string;
  status: QualityStatus;
  results: Record<string, any>;
  measurements: Record<string, any>;
  defects_found: Record<string, any>[];
  corrective_actions: string[];
  notes?: string;
  photos: string[];
  documents: string[];
  compliance_score: number;
}

export interface QualityInspectionCreate extends QualityInspectionBase {}

export interface QualityInspectionUpdate {
  status?: QualityStatus;
  results?: Record<string, any>;
  measurements?: Record<string, any>;
  defects_found?: Record<string, any>[];
  corrective_actions?: string[];
  notes?: string;
  photos?: string[];
  documents?: string[];
  compliance_score?: number;
}

export interface QualityInspectionResponse extends QualityInspectionBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  inspector_name: string;
  quality_check_title: string;
}

export interface QualityInspectionsResponse {
  quality_inspections: QualityInspectionResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface QualityInspectionFilters {
  status?: QualityStatus;
  inspector_id?: string;
  quality_check_id?: string;
  inspection_date_from?: string;
  inspection_date_to?: string;
  compliance_score_min?: number;
  compliance_score_max?: number;
  search?: string;
}

export interface QualityDefectBase {
  title: string;
  description: string;
  severity: DefectSeverity;
  category: string;
  location?: string;
  detected_date: string;
  detected_by_id: string;
  quality_check_id?: string;
  production_plan_id?: string;
  work_order_id?: string;
  status: string;
  priority: QualityPriority;
  assigned_to_id?: string;
  estimated_resolution_date?: string;
  actual_resolution_date?: string;
  resolution_notes?: string;
  cost_impact: number;
  tags: string[];
}

export interface QualityDefectCreate extends QualityDefectBase {}

export interface QualityDefectUpdate {
  title?: string;
  description?: string;
  severity?: DefectSeverity;
  category?: string;
  location?: string;
  status?: string;
  priority?: QualityPriority;
  assigned_to_id?: string;
  estimated_resolution_date?: string;
  actual_resolution_date?: string;
  resolution_notes?: string;
  cost_impact?: number;
  tags?: string[];
}

export interface QualityDefectResponse extends QualityDefectBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  detected_by_name: string;
  assigned_to_name?: string;
}

export interface QualityDefectsResponse {
  quality_defects: QualityDefectResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface QualityDefectFilters {
  severity?: DefectSeverity;
  status?: string;
  priority?: QualityPriority;
  category?: string;
  assigned_to_id?: string;
  detected_date_from?: string;
  detected_date_to?: string;
  cost_impact_min?: number;
  cost_impact_max?: number;
  search?: string;
}

export interface QualityReportBase {
  title: string;
  report_type: string;
  period_start: string;
  period_end: string;
  summary: string;
  key_findings: string[];
  recommendations: string[];
  metrics: Record<string, any>;
  generated_by_id: string;
  tags: string[];
}

export interface QualityReportCreate extends QualityReportBase {}

export interface QualityReportUpdate {
  title?: string;
  summary?: string;
  key_findings?: string[];
  recommendations?: string[];
  metrics?: Record<string, any>;
  tags?: string[];
}

export interface QualityReportResponse extends QualityReportBase {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  generated_by_name: string;
}

export interface QualityReportsResponse {
  quality_reports: QualityReportResponse[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const getDefectSeverityColor = (severity: DefectSeverity): { bg: string; border: string } => {
  const severityColors: Record<string, { bg: string; border: string }> = {
    minor: { bg: '#f3f4f6', border: '#6b7280' },
    major: { bg: '#fef3c7', border: '#f59e0b' },
    critical: { bg: '#fed7aa', border: '#f97316' },
    blocker: { bg: '#fee2e2', border: '#ef4444' },
  };
  return severityColors[severity] || { bg: '#f3f4f6', border: '#6b7280' };
};

export const getDefectSeverityLabel = (severity: DefectSeverity | string): string => {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
};
