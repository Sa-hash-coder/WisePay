export type UserRole = 'THE ORIGINATOR' | 'AP / FINANCE REVIEWER' | 'AUDITOR';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  avatar?: string;
}

export interface RolePermissions {
  canSubmitData: boolean;
  canApproveStandard: boolean;
  canApproveHighRisk: boolean;
  canOverrideQuarantine: boolean;
  canReject: boolean;
  canEscalate: boolean;
  canVerifyLedger: boolean;
  isAuditorReadOnly: boolean;
  approvalLimit: number; // in INR, -1 for unlimited
}

export interface RoleConfig {
  role: UserRole;
  title: string;
  department: string;
  description: string;
  badgeClasses: {
    bg: string;
    text: string;
    border: string;
    indicator: string;
  };
  permissions: RolePermissions;
  defaultUser: UserProfile;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  'THE ORIGINATOR': {
    role: 'THE ORIGINATOR',
    title: 'The Originator',
    department: 'Accounts Payable & Invoicing',
    description: 'Unified submission portal for employees and vendors with receipt/invoice intake and batch uploads.',
    badgeClasses: {
      bg: 'bg-[#EFF6FF]',
      text: 'text-[#1D4ED8]',
      border: 'border-[#BFDBFE]',
      indicator: 'bg-[#2563EB]',
    },
    permissions: {
      canSubmitData: true,
      canApproveStandard: false,
      canApproveHighRisk: false,
      canOverrideQuarantine: false,
      canReject: false,
      canEscalate: false,
      canVerifyLedger: false,
      isAuditorReadOnly: false,
      approvalLimit: 0,
    },
    defaultUser: {
      name: 'Alex Chen',
      email: 'alex.chen@wisepay.internal',
      role: 'THE ORIGINATOR',
      organization: 'Global Enterprise Corp',
    },
  },
  'AP / FINANCE REVIEWER': {
    role: 'AP / FINANCE REVIEWER',
    title: 'AP / Finance Reviewer',
    department: 'Exception Handling & Operations',
    description: 'Primary human-in-the-loop exception handler. Operates Exception Pile dashboard with direct authority to Approve, Reject, or Escalate flagged anomalies.',
    badgeClasses: {
      bg: 'bg-[#F0FDFA]',
      text: 'text-[#0F766E]',
      border: 'border-[#99F6E4]',
      indicator: 'bg-[#0D9488]',
    },
    permissions: {
      canSubmitData: false,
      canApproveStandard: true,
      canApproveHighRisk: true,
      canOverrideQuarantine: true,
      canReject: true,
      canEscalate: true,
      canVerifyLedger: false,
      isAuditorReadOnly: false,
      approvalLimit: -1, // Full exception triage authority
    },
    defaultUser: {
      name: 'Priya Sharma',
      email: 'priya.sharma@wisepay.internal',
      role: 'AP / FINANCE REVIEWER',
      organization: 'Global Enterprise Corp',
    },
  },
  'AUDITOR': {
    role: 'AUDITOR',
    title: 'Compliance Auditor',
    department: 'Independent Compliance & SOX Audit',
    description: 'Read-only enterprise governance. Verifies the 90% auto-passed, 10% flagged exceptions, manual reviewer interventions, and cryptographic SHA-256 audit ledger.',
    badgeClasses: {
      bg: 'bg-[#FFFBEB]',
      text: 'text-[#92400E]',
      border: 'border-[#FDE68A]',
      indicator: 'bg-[#F59E0B]',
    },
    permissions: {
      canSubmitData: false,
      canApproveStandard: false,
      canApproveHighRisk: false,
      canOverrideQuarantine: false,
      canReject: false,
      canEscalate: false,
      canVerifyLedger: true,
      isAuditorReadOnly: true, // Enforces SOX 404 & SOC2 Segregation of Duties
      approvalLimit: 0,
    },
    defaultUser: {
      name: 'Elena Rostova',
      email: 'elena.rostova@sox.audit.internal',
      role: 'AUDITOR',
      organization: 'Global Enterprise Corp',
    },
  },
};

export const ALL_ROLES: UserRole[] = [
  'THE ORIGINATOR',
  'AP / FINANCE REVIEWER',
  'AUDITOR',
];
