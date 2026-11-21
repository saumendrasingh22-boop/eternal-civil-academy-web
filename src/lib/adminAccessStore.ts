export interface AdminPermissions {
  manageBatches: boolean;
  manageCoverPage: boolean;
  manageContent: boolean;
  manageAnswerEval: boolean;
  managePayments: boolean;
  manageAutomation: boolean;
  manageTelegram: boolean;
  viewAnalytics: boolean;
  manageSiteSettings: boolean;
  manageAdmins: boolean;
  lockContent: boolean;
}

export interface AdminUserAccount {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin";
  isPermanentOwner: boolean;
  isActive: boolean;
  permissions: AdminPermissions;
  createdAt: string;
}

export const PERMISSION_DEFINITIONS: {
  key: keyof AdminPermissions;
  label: string;
  category: "Standard" | "Super Admin Controlled";
  description: string;
}[] = [
  {
    key: "manageBatches",
    label: "Batches Management",
    category: "Standard",
    description: "Add, edit, and publish new coaching batches (without payment controls).",
  },
  {
    key: "manageCoverPage",
    label: "Cover Page Showcase",
    category: "Standard",
    description: "Pin any batch, notes, test series, or current affairs item to the Home Cover Page.",
  },
  {
    key: "manageContent",
    label: "Upload & Manage Content",
    category: "Standard",
    description: "Upload PDFs, notes, current affairs, PYQs, and manage own unlocked posts.",
  },
  {
    key: "manageAnswerEval",
    label: "Answer Evaluation",
    category: "Standard",
    description: "Review student answer copies, award marks, and upload checked PDFs.",
  },
  {
    key: "managePayments",
    label: "Payment System (UPI & Revenue)",
    category: "Super Admin Controlled",
    description: "View UPI Payment Orders, approve/reject UTRs, verify evaluation payments, and view revenue.",
  },
  {
    key: "manageAutomation",
    label: "Auto-Sync & Automation Engine",
    category: "Super Admin Controlled",
    description: "View/control PIB, DD News, Akashvani, Prasar Bharati & State Current Affairs auto-sync.",
  },
  {
    key: "manageTelegram",
    label: "Telegram Bot Bridge",
    category: "Super Admin Controlled",
    description: "Access Telegram Bot sync configuration, webhook status, and quiz bridge controls.",
  },
  {
    key: "viewAnalytics",
    label: "Website Growth Analytics",
    category: "Super Admin Controlled",
    description: "View total views, PDF downloads, test attempts, and growth metrics.",
  },
  {
    key: "manageSiteSettings",
    label: "Join Us & Contact Settings",
    category: "Super Admin Controlled",
    description: "Edit social media links, Telegram/WhatsApp channels, email, and contact numbers.",
  },
  {
    key: "lockContent",
    label: "Master Content Lock",
    category: "Super Admin Controlled",
    description: "Lock or unlock content items and cover page slides against edits/deletion.",
  },
  {
    key: "manageAdmins",
    label: "Team Admin Management",
    category: "Super Admin Controlled",
    description: "Add or manage other regular admins (CANNOT ever remove or modify Super Admin).",
  },
];

export const ALL_PERMISSIONS_TRUE: AdminPermissions = {
  manageBatches: true,
  manageCoverPage: true,
  manageContent: true,
  manageAnswerEval: true,
  managePayments: true,
  manageAutomation: true,
  manageTelegram: true,
  viewAnalytics: true,
  manageSiteSettings: true,
  manageAdmins: true,
  lockContent: true,
};

export const DEFAULT_REGULAR_ADMIN_PERMISSIONS: AdminPermissions = {
  manageBatches: true,
  manageCoverPage: true,
  manageContent: true,
  manageAnswerEval: true,
  managePayments: false,
  manageAutomation: false,
  manageTelegram: false,
  viewAnalytics: false,
  manageSiteSettings: false,
  manageAdmins: false,
  lockContent: false,
};

export const PERMANENT_SUPER_ADMIN: AdminUserAccount = {
  id: "super_admin",
  name: "Super Admin (Owner)",
  email: "owner@eternalcivilacademy.com",
  role: "super_admin",
  isPermanentOwner: true,
  isActive: true,
  permissions: { ...ALL_PERMISSIONS_TRUE },
  createdAt: "Permanent Owner",
};

export const DEFAULT_ADMIN_ACCOUNTS: AdminUserAccount[] = [
  PERMANENT_SUPER_ADMIN,
  {
    id: "admin_1",
    name: "Content Editor 1",
    email: "editor1@eternalcivilacademy.com",
    role: "admin",
    isPermanentOwner: false,
    isActive: true,
    permissions: { ...DEFAULT_REGULAR_ADMIN_PERMISSIONS },
    createdAt: "20 Nov 2026",
  },
  {
    id: "admin_2",
    name: "Test Coordinator",
    email: "tests@eternalcivilacademy.com",
    role: "admin",
    isPermanentOwner: false,
    isActive: true,
    permissions: { ...DEFAULT_REGULAR_ADMIN_PERMISSIONS },
    createdAt: "20 Nov 2026",
  },
];

const STORAGE_KEY = "eca_rbac_admin_accounts_v3";

function enforceSuperAdminIntegrity(accounts: AdminUserAccount[]): AdminUserAccount[] {
  const withoutSuper = accounts.filter(
    (a) => a.id !== "super_admin" && !a.isPermanentOwner && a.role !== "super_admin"
  );
  const existingSuper = accounts.find(
    (a) => a.id === "super_admin" || a.isPermanentOwner || a.role === "super_admin"
  );
  const lockedSuper: AdminUserAccount = {
    id: "super_admin",
    name: existingSuper?.name || PERMANENT_SUPER_ADMIN.name,
    email: existingSuper?.email || PERMANENT_SUPER_ADMIN.email,
    role: "super_admin",
    isPermanentOwner: true,
    isActive: true,
    permissions: { ...ALL_PERMISSIONS_TRUE },
    createdAt: "Permanent Owner",
  };
  return [lockedSuper, ...withoutSuper];
}

export function loadAdminAccounts(): AdminUserAccount[] {
  if (typeof window === "undefined") return DEFAULT_ADMIN_ACCOUNTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_ACCOUNTS;
    const parsed = JSON.parse(raw) as AdminUserAccount[];
    return enforceSuperAdminIntegrity(parsed);
  } catch {
    return DEFAULT_ADMIN_ACCOUNTS;
  }
}

export function saveAdminAccounts(accounts: AdminUserAccount[]): AdminUserAccount[] {
  const safeAccounts = enforceSuperAdminIntegrity(accounts);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeAccounts));
    window.dispatchEvent(new Event("eca-admins-updated"));
  }
  return safeAccounts;
}

export function addRegularAdmin(
  accounts: AdminUserAccount[],
  name: string,
  email: string,
  customPermissions?: Partial<AdminPermissions>
): AdminUserAccount[] {
  const newAdmin: AdminUserAccount = {
    id: `admin_${Date.now()}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: "admin",
    isPermanentOwner: false,
    isActive: true,
    permissions: {
      ...DEFAULT_REGULAR_ADMIN_PERMISSIONS,
      ...(customPermissions || {}),
    },
    createdAt: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
  return saveAdminAccounts([...accounts, newAdmin]);
}

export function removeAdminSafely(
  accounts: AdminUserAccount[],
  targetId: string
): AdminUserAccount[] {
  // HARD IMMUTABILITY GUARD: Permanent Super Admin can NEVER be removed by anyone
  const target = accounts.find((a) => a.id === targetId);
  if (!target || target.isPermanentOwner || target.role === "super_admin" || target.id === "super_admin") {
    return enforceSuperAdminIntegrity(accounts);
  }
  return saveAdminAccounts(accounts.filter((a) => a.id !== targetId));
}

export function updateAdminPermissionSafely(
  accounts: AdminUserAccount[],
  targetId: string,
  key: keyof AdminPermissions,
  value: boolean
): AdminUserAccount[] {
  // HARD IMMUTABILITY GUARD: Permanent Super Admin permissions can NEVER be reduced or altered
  const updated = accounts.map((a) => {
    if (a.id !== targetId) return a;
    if (a.isPermanentOwner || a.role === "super_admin" || a.id === "super_admin") {
      return { ...a, isPermanentOwner: true, isActive: true, permissions: { ...ALL_PERMISSIONS_TRUE } };
    }
    return {
      ...a,
      permissions: {
        ...a.permissions,
        [key]: value,
      },
    };
  });
  return saveAdminAccounts(updated);
}

export function setAllAdminPermissionsSafely(
  accounts: AdminUserAccount[],
  targetId: string,
  grantAll: boolean
): AdminUserAccount[] {
  const updated = accounts.map((a) => {
    if (a.id !== targetId) return a;
    if (a.isPermanentOwner || a.role === "super_admin" || a.id === "super_admin") {
      return { ...a, isPermanentOwner: true, isActive: true, permissions: { ...ALL_PERMISSIONS_TRUE } };
    }
    return {
      ...a,
      permissions: grantAll
        ? { ...ALL_PERMISSIONS_TRUE }
        : { ...DEFAULT_REGULAR_ADMIN_PERMISSIONS },
    };
  });
  return saveAdminAccounts(updated);
}

export function hasPermission(
  account: AdminUserAccount | undefined,
  permission: keyof AdminPermissions
): boolean {
  if (!account || !account.isActive) return false;
  if (account.isPermanentOwner || account.role === "super_admin") return true;
  return Boolean(account.permissions[permission]);
}
