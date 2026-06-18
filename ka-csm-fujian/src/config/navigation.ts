import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  Send,
  ShieldCheck,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import type { AppRole, CustomerSubTab, NavigationItem } from "@/types/app";

export const ALL_MANAGERS_LABEL = "全部经理";

export const navigationItems: NavigationItem[] = [
  { key: "dashboard", label: "仪表盘", icon: BarChart3, roles: ["admin", "supervisor", "manager"] },
  { key: "customers", label: "客户管理", icon: Users, roles: ["admin", "supervisor", "manager"] },
  { key: "plans", label: "客户成功计划", icon: Target, roles: ["admin", "supervisor", "manager"] },
  { key: "projectManagement", label: "项目管理", icon: BriefcaseBusiness, roles: ["admin", "supervisor", "manager"] },
  { key: "projects", label: "服务续费管理", icon: ClipboardList, roles: ["admin", "supervisor", "manager"] },
  { key: "weekly", label: "周执行工作", icon: CalendarDays, roles: ["admin", "supervisor", "manager"] },
  { key: "account", label: "我的账号", icon: UserRound, roles: ["admin", "supervisor", "manager"] },
  { key: "push", label: "执行推送配置", icon: Send, roles: ["admin", "supervisor"] },
  { key: "users", label: "账号管理", icon: ShieldCheck, roles: ["admin", "supervisor"] },
];

export const customerSubTabs: CustomerSubTab[] = ["客户清单", "关键人清单", "服务续费管理", "客户清单导入导出"];

export function getNavigationForRole(role: AppRole) {
  return navigationItems.filter((item) => item.roles.includes(role));
}
