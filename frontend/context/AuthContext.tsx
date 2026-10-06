'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile, RoleConfig, RolePermissions, ROLE_CONFIGS, ALL_ROLES } from '@/types/auth';

interface AuthContextValue {
  user: UserProfile;
  role: UserRole;
  roleConfig: RoleConfig;
  permissions: RolePermissions;
  allRoles: UserRole[];
  switchRole: (role: UserRole) => void;
  setUserProfile: (profile: Partial<UserProfile>) => void;
  canApproveTransaction: (amount: number, isHighRisk: boolean) => {
    allowed: boolean;
    reason?: string;
  };
  canExecuteOverride: () => boolean;
  canVerifySolanaLedger: () => boolean;
  isAuditor: boolean;
}

const STORAGE_KEY = 'wisepay_user';

// Default role is AP / FINANCE REVIEWER for primary review operations
const DEFAULT_ROLE: UserRole = 'AP / FINANCE REVIEWER';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(() => {
    return ROLE_CONFIGS[DEFAULT_ROLE].defaultUser;
  });

  // On mount, load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure role is one of the valid 3 roles
        if (ALL_ROLES.includes(parsed.role as UserRole)) {
          const validRole = parsed.role as UserRole;
          setUser({
            name: parsed.name || ROLE_CONFIGS[validRole].defaultUser.name,
            email: parsed.email || ROLE_CONFIGS[validRole].defaultUser.email,
            role: validRole,
            organization: parsed.organization || 'Global Enterprise Corp',
          });
          return;
        }
      }
    } catch {
      // Fallback to default
    }
  }, []);

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

  const canApproveTransaction = (amount: number, isHighRisk: boolean): { allowed: boolean; reason?: string } => {
    if (permissions.isAuditorReadOnly) {
      return {
        allowed: false,
        reason: 'Segregation of Duties (SoD): Auditors cannot submit disbursement authorizations.',
      };
    }

    if (isHighRisk && !permissions.canApproveHighRisk) {
      return {
        allowed: false,
        reason: 'High-Risk policy hold requires Finance Manager override sign-off.',
      };
    }

    if (permissions.approvalLimit !== -1 && amount > permissions.approvalLimit) {
      return {
        allowed: false,
        reason: `Exceeds AP Reviewer policy threshold (₹${permissions.approvalLimit.toLocaleString('en-IN')}). Finance Manager sign-off required.`,
      };
    }

    return { allowed: true };
  };

  const canExecuteOverride = () => permissions.canOverrideQuarantine;
  const canVerifySolanaLedger = () => permissions.canVerifyLedger;
  const isAuditor = permissions.isAuditorReadOnly;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        roleConfig,
        permissions,
        allRoles: ALL_ROLES,
        switchRole,
        setUserProfile,
        canApproveTransaction,
        canExecuteOverride,
        canVerifySolanaLedger,
        isAuditor,
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
