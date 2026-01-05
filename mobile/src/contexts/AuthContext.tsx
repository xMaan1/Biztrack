import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials } from '@/models';
import { apiService } from '@/services';
import { SessionManager } from '@/services/SessionManager';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  role: string;
  joined_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  tenants: Tenant[];
  currentTenant: Tenant | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const sessionManager = new SessionManager();

        const isSessionValid = await sessionManager.isSessionValid();
        if (!isSessionValid) {
          await sessionManager.clearSession();
          setUser(null);
          setTenants([]);
          setCurrentTenant(null);
          setLoading(false);
          return;
        }

        if (isSessionValid) {
          const isTokenExpired = await sessionManager.isTokenExpired();
          if (isTokenExpired) {
            const refreshSuccess = await sessionManager.refreshAccessToken();
            if (!refreshSuccess) {
              await sessionManager.clearSession();
              setUser(null);
              setLoading(false);
              return;
            }
          }

          const session = await sessionManager.getSession();

          if (session && session.token && session.user) {
            const userWithId = {
              ...session.user,
              id: session.user.userId || session.user.id,
            };
            setUser(userWithId);

            const storedTenants = await apiService.getUserTenants();
            if (storedTenants.length > 0) {
              setTenants(storedTenants);

              const currentTenant = await apiService.getCurrentTenant();
              if (currentTenant) {
                setCurrentTenant(currentTenant);
              } else {
                setCurrentTenant(storedTenants[0]);
                apiService.setTenantId(storedTenants[0].id);
              }
            }
          } else {
            await sessionManager.clearSession();
            setUser(null);
          }
        } else {
          await sessionManager.clearSession();
          setUser(null);
        }
      } catch (error) {
        const sessionManager = new SessionManager();
        await sessionManager.clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiService.login(credentials);

      if (response.success && response.user) {
        const userWithId = {
          ...response.user,
          id: response.user.userId || response.user.id,
        };
        setUser(userWithId);

        const storedTenants = await apiService.getUserTenants();
        if (storedTenants.length > 0) {
          setTenants(storedTenants);

          const currentTenant = await apiService.getCurrentTenant();
          if (currentTenant) {
            setCurrentTenant(currentTenant);
          }
        }

        return true;
      }
      return false;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error: any) {
    } finally {
      const sessionManager = new SessionManager();
      setUser(null);
      setTenants([]);
      setCurrentTenant(null);
      await sessionManager.clearSession();
      apiService.setTenantId(null);
    }
  };

  const switchTenant = async (tenantId: string): Promise<boolean> => {
    try {
      const tenant = await apiService.switchTenant(tenantId);
      setCurrentTenant(tenant);
      return true;
    } catch (error) {
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await apiService.getCurrentUser();
      if (userData) {
        const userWithId = {
          ...userData,
          id: userData.userId || userData.id,
        };
        setUser(userWithId);
      }
    } catch (error) {
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    tenants,
    currentTenant,
    login,
    logout,
    switchTenant,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

