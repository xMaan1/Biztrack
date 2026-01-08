export interface User {
  id?: string;
  userId?: string;
  userName: string;
  userRole:
    | 'super_admin'
    | 'admin'
    | 'project_manager'
    | 'team_member'
    | 'client'
    | 'viewer';
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  tenantLogoUrl?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  userName: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

