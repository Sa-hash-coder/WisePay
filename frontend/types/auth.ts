export type UserRole = 'AP / FINANCE REVIEWER' | 'FINANCE MANAGER' | 'AUDITOR';

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  avatar?: string;
}

export interface RolePermissions {
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
  'AP / FINANCE REVIEWER': {
    role: 'AP / FINANCE REVIEWER',
    title: 'AP / Finance Reviewer',
    department: 'Accounts Payable Operations',
    description: 'First-line invoice verification, documentation review, and escalation of high-risk policy exceptions.',
    badgeClasses: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      indicator: 'bg-sky-500',
    },
    permissions: {
      canApproveStandard: true,
      canApproveHighRisk: false,
      canOverrideQuarantine: false,
      canReject: true,
      canEscalate: true,
      canVerifyLedger: false,
      isAuditorReadOnly: false,
      approvalLimit: 500000, // ₹5,00,000 threshold
    },
    defaultUser: {
      name: 'Priya Sharma',
      email: 'priya.sharma@wisepay.internal',
      role: 'AP / FINANCE REVIEWER',
      organization: 'Global Enterprise Corp',
    },
  },
  'FINANCE MANAGER': {
    role: 'FINANCE MANAGER',
    title: 'Finance Manager',
    department: 'Treasury & Financial Control',
    description: 'Executive disbursement approval, high-risk quarantine release, heuristic override, and financial policy governance.',
    badgeClasses: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      indicator: 'bg-indigo-500',
    },
    permissions: {
      canApproveStandard: true,
      canApproveHighRisk: true,
      canOverrideQuarantine: true,
      canReject: true,
      canEscalate: false,
      canVerifyLedger: true,
      isAuditorReadOnly: false,
      approvalLimit: -1, // Unlimited approval authority
    },
    defaultUser: {
      name: 'Marcus Vance',
      email: 'marcus.vance@wisepay.internal',
      role: 'FINANCE MANAGER',
      organization: 'Global Enterprise Corp',
    },
  },
  'AUDITOR': {
    role: 'AUDITOR',
    title: 'Compliance Auditor',
    department: 'Independent Compliance & SOX Audit',
    description: 'Segregation of duties enforcement, forensic transaction inspection, and Solana cryptographic ledger verification.',
    badgeClasses: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      indicator: 'bg-emerald-500',
    },
    permissions: {
      canApproveStandard: false, // Segregation of duties: cannot approve disbursements
      canApproveHighRisk: false,
      canOverrideQuarantine: false,
      canReject: false,
      canEscalate: false,
      canVerifyLedger: true,
      isAuditorReadOnly: true,
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
  'AP / FINANCE REVIEWER',
  'FINANCE MANAGER',
  'AUDITOR',
];
