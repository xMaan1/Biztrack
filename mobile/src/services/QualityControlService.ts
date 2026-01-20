import { apiService } from './ApiService';
import {
  QualityCheckResponse as QualityCheck,
  QualityCheckCreate,
  QualityCheckUpdate,
  QualityChecksResponse,
  QualityCheckFilters,
  QualityDashboard,
  QualityInspectionBase as QualityInspection,
  QualityInspectionCreate,
  QualityInspectionUpdate,
  QualityInspectionsResponse,
  QualityInspectionFilters,
  QualityDefectBase as QualityDefect,
  QualityDefectCreate,
  QualityDefectUpdate,
  QualityDefectsResponse,
  QualityDefectFilters,
  QualityReportBase as QualityReport,
  QualityReportCreate,
  QualityReportUpdate,
  QualityReportsResponse,
} from '../models/qualityControl';

class QualityControlService {
  private baseUrl = '/quality-control';

  async createQualityCheck(
    checkData: QualityCheckCreate,
  ): Promise<QualityCheck> {
    const response = await apiService.post(`${this.baseUrl}/checks`, checkData);
    return response;
  }

  async getQualityChecks(
    filters: QualityCheckFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<QualityChecksResponse> {
    const params = new URLSearchParams();
    params.append('skip', ((page - 1) * limit).toString());
    params.append('limit', limit.toString());

    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.inspection_type) params.append('inspection_type', filters.inspection_type);
    if (filters.quality_standard) params.append('quality_standard', filters.quality_standard);
    if (filters.production_plan_id) params.append('production_plan_id', filters.production_plan_id);
    if (filters.work_order_id) params.append('work_order_id', filters.work_order_id);
    if (filters.project_id) params.append('project_id', filters.project_id);
    if (filters.assigned_to_id) params.append('assigned_to_id', filters.assigned_to_id);
    if (filters.scheduled_date_from) params.append('scheduled_date_from', filters.scheduled_date_from);
    if (filters.scheduled_date_to) params.append('scheduled_date_to', filters.scheduled_date_to);
    if (filters.search) params.append('search', filters.search);

    const response = await apiService.get(`${this.baseUrl}/checks?${params.toString()}`);
    
    return {
      quality_checks: Array.isArray(response) ? response : response.data || [],
      total: Array.isArray(response) ? response.length : response.total || 0,
      page,
      limit,
      total_pages: Math.ceil((Array.isArray(response) ? response.length : response.total || 0) / limit),
    };
  }

  async getQualityCheck(id: string): Promise<QualityCheck> {
    const response = await apiService.get(`${this.baseUrl}/checks/${id}`);
    return response;
  }

  async updateQualityCheck(
    id: string,
    checkData: QualityCheckUpdate,
  ): Promise<QualityCheck> {
    const response = await apiService.put(
      `${this.baseUrl}/checks/${id}`,
      checkData,
    );
    return response;
  }

  async deleteQualityCheck(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/checks/${id}`);
  }

  async getQualityDashboard(): Promise<QualityDashboard> {
    const response = await apiService.get(`${this.baseUrl}/dashboard`);
    return response;
  }

  async getQualityStatistics(): Promise<any> {
    const response = await apiService.get(`${this.baseUrl}/stats`);
    return response;
  }

  async getQualityChecksByStatus(status: string): Promise<QualityCheck[]> {
    const response = await apiService.get(
      `${this.baseUrl}/checks?status=${status}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }

  async getQualityChecksByPriority(priority: string): Promise<QualityCheck[]> {
    const response = await apiService.get(
      `${this.baseUrl}/checks?priority=${priority}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }

  async getQualityChecksByInspectionType(
    inspectionType: string,
  ): Promise<QualityCheck[]> {
    const response = await apiService.get(
      `${this.baseUrl}/checks?inspection_type=${inspectionType}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }

  async getQualityChecksByAssignedUser(
    userId: string,
  ): Promise<QualityCheck[]> {
    const response = await apiService.get(
      `${this.baseUrl}/checks?assigned_to_id=${userId}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }

  async getQualityInspections(
    filters: QualityInspectionFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<QualityInspectionsResponse> {
    const params = new URLSearchParams();
    params.append('skip', ((page - 1) * limit).toString());
    params.append('limit', limit.toString());

    if (filters.status) params.append('status', filters.status);
    if (filters.inspector_id) params.append('inspector_id', filters.inspector_id);
    if (filters.quality_check_id) params.append('quality_check_id', filters.quality_check_id);
    if (filters.inspection_date_from) params.append('inspection_date_from', filters.inspection_date_from);
    if (filters.inspection_date_to) params.append('inspection_date_to', filters.inspection_date_to);
    if (filters.compliance_score_min) params.append('compliance_score_min', filters.compliance_score_min.toString());
    if (filters.compliance_score_max) params.append('compliance_score_max', filters.compliance_score_max.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await apiService.get(`${this.baseUrl}/inspections?${params.toString()}`);
    
    return {
      quality_inspections: Array.isArray(response) ? response : response.data || [],
      total: Array.isArray(response) ? response.length : response.total || 0,
      page,
      limit,
      total_pages: Math.ceil((Array.isArray(response) ? response.length : response.total || 0) / limit),
    };
  }

  async getQualityInspection(id: string): Promise<QualityInspection> {
    const response = await apiService.get(`${this.baseUrl}/inspections/${id}`);
    return response;
  }

  async createQualityInspection(
    inspectionData: QualityInspectionCreate,
  ): Promise<QualityInspection> {
    const response = await apiService.post(
      `${this.baseUrl}/inspections`,
      inspectionData,
    );
    return response;
  }

  async updateQualityInspection(
    id: string,
    inspectionData: QualityInspectionUpdate,
  ): Promise<QualityInspection> {
    const response = await apiService.put(
      `${this.baseUrl}/inspections/${id}`,
      inspectionData,
    );
    return response;
  }

  async deleteQualityInspection(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/inspections/${id}`);
  }

  async getQualityInspectionsByCheck(
    checkId: string,
  ): Promise<QualityInspection[]> {
    const response = await apiService.get(
      `${this.baseUrl}/inspections?quality_check_id=${checkId}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }

  async getQualityInspectionsByInspector(
    inspectorId: string,
  ): Promise<QualityInspection[]> {
    const response = await apiService.get(
      `${this.baseUrl}/inspections?inspector_id=${inspectorId}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }

  async getQualityDefects(
    filters: QualityDefectFilters = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<QualityDefectsResponse> {
    const params = new URLSearchParams();
    params.append('skip', ((page - 1) * limit).toString());
    params.append('limit', limit.toString());

    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.category) params.append('category', filters.category);
    if (filters.assigned_to_id) params.append('assigned_to_id', filters.assigned_to_id);
    if (filters.detected_date_from) params.append('detected_date_from', filters.detected_date_from);
    if (filters.detected_date_to) params.append('detected_date_to', filters.detected_date_to);
    if (filters.cost_impact_min) params.append('cost_impact_min', filters.cost_impact_min.toString());
    if (filters.cost_impact_max) params.append('cost_impact_max', filters.cost_impact_max.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await apiService.get(`${this.baseUrl}/defects?${params.toString()}`);
    
    return {
      quality_defects: Array.isArray(response) ? response : response.data || [],
      total: Array.isArray(response) ? response.length : response.total || 0,
      page,
      limit,
      total_pages: Math.ceil((Array.isArray(response) ? response.length : response.total || 0) / limit),
    };
  }

  async getQualityDefect(id: string): Promise<QualityDefect> {
    const response = await apiService.get(`${this.baseUrl}/defects/${id}`);
    return response;
  }

  async createQualityDefect(
    defectData: QualityDefectCreate,
  ): Promise<QualityDefect> {
    const response = await apiService.post(
      `${this.baseUrl}/defects`,
      defectData,
    );
    return response;
  }

  async updateQualityDefect(
    id: string,
    defectData: QualityDefectUpdate,
  ): Promise<QualityDefect> {
    const response = await apiService.put(
      `${this.baseUrl}/defects/${id}`,
      defectData,
    );
    return response;
  }

  async deleteQualityDefect(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/defects/${id}`);
  }

  async getQualityDefectsBySeverity(
    severity: string,
  ): Promise<QualityDefect[]> {
    const response = await apiService.get(
      `${this.baseUrl}/defects?severity=${severity}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }

  async getQualityDefectsByStatus(status: string): Promise<QualityDefect[]> {
    const response = await apiService.get(
      `${this.baseUrl}/defects?status=${status}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }

  async getQualityReports(
    reportType?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<QualityReportsResponse> {
    const params = new URLSearchParams();
    params.append('skip', ((page - 1) * limit).toString());
    params.append('limit', limit.toString());

    if (reportType) params.append('report_type', reportType);

    const response = await apiService.get(`${this.baseUrl}/reports?${params.toString()}`);
    
    return {
      quality_reports: Array.isArray(response) ? response : response.data || [],
      total: Array.isArray(response) ? response.length : response.total || 0,
      page,
      limit,
      total_pages: Math.ceil((Array.isArray(response) ? response.length : response.total || 0) / limit),
    };
  }

  async getQualityReport(id: string): Promise<QualityReport> {
    const response = await apiService.get(`${this.baseUrl}/reports/${id}`);
    return response;
  }

  async createQualityReport(
    reportData: QualityReportCreate,
  ): Promise<QualityReport> {
    const response = await apiService.post(
      `${this.baseUrl}/reports`,
      reportData,
    );
    return response;
  }

  async updateQualityReport(
    id: string,
    reportData: QualityReportUpdate,
  ): Promise<QualityReport> {
    const response = await apiService.put(
      `${this.baseUrl}/reports/${id}`,
      reportData,
    );
    return response;
  }

  async deleteQualityReport(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/reports/${id}`);
  }

  async getQualityReportsByType(reportType: string): Promise<QualityReport[]> {
    const response = await apiService.get(
      `${this.baseUrl}/reports?report_type=${reportType}`,
    );
    return Array.isArray(response) ? response : response.data || [];
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export default new QualityControlService();
