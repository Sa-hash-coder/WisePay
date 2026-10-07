'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile, RoleConfig, RolePermissions, ROLE_CONFIGS, ALL_ROLES } from '@/types/auth';
import { api, setAuthToken, getAuthToken } from '@/lib/api';

interface AuthContextValue {
  user: UserProfile;
  role: UserRole;
  roleConfig: RoleConfig;
  permissions: RolePermissions;
  allRoles: UserRole[];
  token: string | null;
  switchRole: (role: UserRole) => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  canApproveTransaction: (amount: number, isHighRisk: boolean) => {
    allowed: boolean;
    reason?: string;
  };
  canExecuteOverride: () => boolean;
  canVerifySolanaLedger: () => boolean;
  isAuditor: boolean;
  isOriginator: boolean;
}

const STORAGE_KEY = 'wisepay_user';
const DEFAULT_ROLE: UserRole = 'AP / FINANCE REVIEWER';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(() => {
    return ROLE_CONFIGS[DEFAULT_ROLE].defaultUser;
  });

  // Load user and verify active session on mount
  useEffect(() => {
    const existingToken = getAuthToken();
    if (existingToken) {
      setToken(existingToken);
      // Verify token with backend
      api.auth.me()
        .then((res) => {
          if (res && res.user) {
            const roleName = res.user.role_id as UserRole;
            const validRole = ALL_ROLES.includes(roleName) ? roleName : DEFAULT_ROLE;
            const updatedProfile: UserProfile = {
              name: res.user.full_name || res.user.email,
              email: res.user.email,
              role: validRole,
              organization: res.user.organization || 'Global Enterprise Corp',
            };
            setUser(updatedProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
          }
        })
        .catch(() => {
          // Token expired or server unreachable, fallback to cached
        });
    } else {
      // Auto-authenticate default demo user
      api.auth.login(ROLE_CONFIGS[DEFAULT_ROLE].defaultUser.email, 'Password123!')
        .then((res) => {
          if (res && res.access_token) {
            setToken(res.access_token);
          }
        })
        .catch(() => {});
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (ALL_ROLES.includes(parsed.role as UserRole)) {
          const validRole = parsed.role as UserRole;
          setUser({
            name: parsed.name || ROLE_CONFIGS[validRole].defaultUser.name,
            email: parsed.email || ROLE_CONFIGS[validRole].defaultUser.email,
            role: validRole,
            organization: parsed.organization || 'Global Enterprise Corp',
          });
        }
      }
    } catch {
      // Fallback to default
    }

    // Listen for global 401 unauthorized events
    const handleUnauthorized = () => {
      setToken(null);
      setAuthToken(null);
    };
    window.addEventListener('wisepay:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('wisepay:unauthorized', handleUnauthorized);
  }, []);

  const loginWithCredentials = async (emailInput: string, passwordInput: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.login(emailInput, passwordInput);
      if (res && res.access_token) {
        setToken(res.access_token);
        const roleName = res.user?.role_id as UserRole;
        const validRole = ALL_ROLES.includes(roleName) ? roleName : DEFAULT_ROLE;
        const updatedProfile: UserProfile = {
          name: res.user?.full_name || emailInput,
          email: res.user?.email || emailInput,
          role: validRole,
          organization: res.user?.organization || 'Global Enterprise Corp',
        };
        setUser(updatedProfile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
        return { success: true };
      }
      return { success: false, error: res?.error || res?.detail || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login request failed' };
    }
  };

  const logout = () => {
    api.auth.logout();
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setUser(ROLE_CONFIGS[DEFAULT_ROLE].defaultUser);
  };

  const switchRole = (newRole: UserRole) => {
    if (!ALL_ROLES.includes(newRole)) return;
    const defaultUserForRole = ROLE_CONFIGS[newRole].defaultUser;
    const updatedUser: UserProfile = {
      name: defaultUserForRole.name,
      email: defaultUserForRole.email,
      role: newRole,
      organization: user.organization || 'Global Enterprise Corp',
    };
    setUser(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    } catch {
      // ignore
    }

    // Seamlessly fetch JWT for switched demo persona
    api.auth.login(defaultUserForRole.email, 'Password123!')
      .then((res) => {
        if (res && res.access_token) {
          setToken(res.access_token);
        }
      })
      .catch(() => {});
  };

  const setUserProfile = (profile: Partial<UserProfile>) => {
    setUser((prev) => {
      const updatedRole = profile.role && ALL_ROLES.includes(profile.role) ? profile.role : prev.role;
      const updated: UserProfile = {
        ...prev,
        ...profile,
        role: updatedRole,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const currentRole = user.role && ALL_ROLES.includes(user.role) ? user.role : DEFAULT_ROLE;
  const roleConfig = ROLE_CONFIGS[currentRole];
  const permissions = roleConfig.permissions;

  const isAuditor = permissions.isAuditorReadOnly;
  const isOriginator = currentRole === 'THE ORIGINATOR';

  const canApproveTransaction = (amount: number, isHighRisk: boolean): { allowed: boolean; reason?: string } => {
    if (permissions.isAuditorReadOnly) {
      return {
        allowed: false,
        reason: 'Segregation of Duties (SoD): Compliance Auditors have read-only access and cannot authorize disbursements.',
      };
    }

    if (isOriginator) {
      return {
        allowed: false,
        reason: 'Segregation of Duties (SoD): The Originator is a submission-only role and cannot authorize disbursements.',
      };
    }

    if (!permissions.canApproveStandard) {
      return {
        allowed: false,
        reason: 'Unauthorized: You do not have permission to authorize transactions.',
      };
    }

    return { allowed: true };
  };

  const canExecuteOverride = () => permissions.canOverrideQuarantine;
  const canVerifySolanaLedger = () => permissions.canVerifyLedger;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        roleConfig,
        permissions,
        allRoles: ALL_ROLES,
        token,
        switchRole,
        setUserProfile,
        loginWithCredentials,
        logout,
        canApproveTransaction,
        canExecuteOverride,
        canVerifySolanaLedger,
        isAuditor,
        isOriginator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
