import type { LucideIcon } from "lucide-react";

export type AppRole = "admin" | "supervisor" | "manager";

export type TabKey =
  | "dashboard"
  | "customers"
  | "plans"
  | "projectManagement"
  | "projects"
  | "weekly"
  | "account"
  | "push"
  | "users";

export type CustomerSubTab = "客户清单" | "关键人清单" | "服务续费管理" | "客户清单导入导出";

export type SessionUser = {
  id: number;
  username: string;
  role: AppRole;
  displayName: string;
  phone: string | null;
  enabled: boolean;
  boundManagerId: number | null;
  boundManagerName: string | null;
  managerName?: string;
};

export type NavigationItem = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  roles: AppRole[];
};
