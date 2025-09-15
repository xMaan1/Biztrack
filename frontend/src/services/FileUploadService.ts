// Use the same pattern as other services
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface FileUploadResponse {
  success: boolean;
  message: string;
  file_url: string;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string;
}

export interface LogoInfoResponse {
  success: boolean;
  has_logo: boolean;
  message?: string;
  file_url?: string;
  filename?: string;
  file_size?: number;
  upload_date?: string;
}

class FileUploadService {
  async uploadLogo(file: File): Promise<FileUploadResponse> {
    const token = localStorage.getItem('auth_token');  // Fixed: use correct key
    const tenantId = localStorage.getItem('currentTenantId');  // Fixed: use correct key
    
    if (!token || !tenantId) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}file-upload/logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload logo');
    }

    return await response.json();
  }

  async deleteLogo(filename: string): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('currentTenantId');
    
    if (!token || !tenantId) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}file-upload/logo/${filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete logo');
    }

    return await response.json();
  }

  async getLogoInfo(): Promise<LogoInfoResponse> {
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('currentTenantId');
    
    if (!token || !tenantId) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}file-upload/logo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get logo info');
    }

    return await response.json();
  }

  getLogoUrl(fileUrl: string): string {
    // Convert relative URL to full URL
    if (fileUrl.startsWith('/static/')) {
      return `${API_BASE_URL}${fileUrl}`;
    }
    return fileUrl;
  }
}

export default new FileUploadService();
