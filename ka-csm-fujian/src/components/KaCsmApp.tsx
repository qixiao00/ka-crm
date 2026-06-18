"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { AppShell } from "@/components/layout/AppShell";
import { ALL_MANAGERS_LABEL, getNavigationForRole } from "@/config/navigation";
import { AccountView } from "@/features/account/AccountView";
import { CustomersView } from "@/features/customers/CustomersView";
import { KeyScenariosView } from "@/features/customers/KeyScenariosView";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { ProjectsView } from "@/features/projects/ProjectsView";
import { ServiceRenewalsView } from "@/features/projects/ServiceRenewalsView";
import { PushConfigView } from "@/features/push/PushConfigView";
import { UsersView } from "@/features/users/UsersView";
import { WeeklyView } from "@/features/weekly/WeeklyView";
import { useScopedCsmData } from "@/hooks/useScopedCsmData";
import type { AppData } from "@/lib/app-data";
import type { CustomerSubTab, SessionUser, TabKey } from "@/types/app";

const defaultTab: TabKey = "dashboard";

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || "请求失败。";
}

function toSessionUser(user: AppData["user"]): SessionUser {
  return {
    ...user,
    managerName: user.boundManagerName ?? undefined,
  };
}

export function KaCsmApp() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [appError, setAppError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [customerSubTab, setCustomerSubTab] = useState<CustomerSubTab>("客户清单");
  const [managerFilter, setManagerFilter] = useState(ALL_MANAGERS_LABEL);
  const [query, setQuery] = useState("");

  const session = appData ? toSessionUser(appData.user) : null;
  const managers = appData?.managerOptions.map((manager) => manager.name) ?? [];

  const navigationItems = useMemo(() => getNavigationForRole(session?.role ?? "admin"), [session?.role]);
  const effectiveActiveTab = navigationItems.some((item) => item.key === activeTab) ? activeTab : defaultTab;

  const scopedData = useScopedCsmData({
    contacts: appData?.contacts ?? [],
    customers: appData?.customers ?? [],
    keyScenarios: appData?.keyScenarios ?? [],
    plans: appData?.plans ?? [],
    projects: appData?.projects ?? [],
    serviceRenewals: appData?.serviceRenewals ?? [],
    weeklyTasks: appData?.weeklyTasks ?? [],
    managerFilter,
    query,
    role: session?.role ?? "admin",
    currentManager: session?.managerName,
  });

  const loadAppData = useCallback(async () => {
    setLoadingData(true);
    setAppError("");

    try {
      const response = await fetch("/api/app-data");
      if (!response.ok) throw new Error(await readApiMessage(response));

      const data = (await response.json()) as AppData;
      setAppData(data);
      setManagerFilter(data.user.role === "manager" && data.user.boundManagerName ? data.user.boundManagerName : ALL_MANAGERS_LABEL);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : "读取数据失败。");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const response = await fetch("/api/session/me");
        if (response.ok && !cancelled) {
          await loadAppData();
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [loadAppData]);

  const handleLogin = async (username: string, password: string) => {
    setLoginError("");
    setAppError("");

    const response = await fetch("/api/session/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      setLoginError(await readApiMessage(response));
      return;
    }

    await loadAppData();
    setActiveTab(defaultTab);
    setCustomerSubTab("客户清单");
    setQuery("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleLogout = async () => {
    await fetch("/api/session/logout", { method: "POST" });
    setAppData(null);
    setActiveTab(defaultTab);
    setCustomerSubTab("客户清单");
    setManagerFilter(ALL_MANAGERS_LABEL);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  if (initializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef6ff] px-6">
        <div className="login-panel text-center">
          <h1 className="text-xl font-semibold">正在连接系统</h1>
          <p className="muted-text mt-2 text-sm">读取登录状态与数据库数据。</p>
        </div>
      </main>
    );
  }

  if (!session || !appData) {
    return <LoginScreen error={loginError || appError} onLogin={handleLogin} />;
  }

  return (
    <AppShell
      session={session}
      navigationItems={navigationItems}
      activeTab={effectiveActiveTab}
      managerFilter={managerFilter}
      query={query}
      source={appData.source}
      showManagerFilter={session.role !== "manager"}
      updatedAt={appData.summary.updatedAt}
      managers={managers}
      loadingData={loadingData}
      onTabChange={setActiveTab}
      onManagerFilterChange={setManagerFilter}
      onQueryChange={setQuery}
      onLogout={handleLogout}
    >
      <ActiveMenu
        session={session}
        activeTab={effectiveActiveTab}
        customerSubTab={customerSubTab}
        onCustomerSubTabChange={setCustomerSubTab}
        appData={appData}
        onRefresh={loadAppData}
        scopedData={scopedData}
      />
    </AppShell>
  );
}

function ActiveMenu({
  session,
  activeTab,
  customerSubTab,
  onCustomerSubTabChange,
  appData,
  onRefresh,
  scopedData,
}: {
  session: SessionUser;
  activeTab: TabKey;
  customerSubTab: CustomerSubTab;
  onCustomerSubTabChange: (tab: CustomerSubTab) => void;
  appData: AppData;
  onRefresh: () => Promise<void>;
  scopedData: ReturnType<typeof useScopedCsmData>;
}) {
  switch (activeTab) {
    case "dashboard":
      return (
        <DashboardView
          customers={scopedData.filteredCustomers}
          contacts={scopedData.filteredContacts}
          keyScenarios={scopedData.filteredKeyScenarios}
          projects={scopedData.filteredProjects}
          serviceRenewals={scopedData.filteredServiceRenewals}
          weeklyTasks={scopedData.filteredWeeklyTasks}
          summary={appData.summary}
        />
      );
    case "customers":
      return (
        <CustomersView
          active={customerSubTab}
          onChange={onCustomerSubTabChange}
          customers={scopedData.filteredCustomers}
          contacts={scopedData.filteredContacts}
          serviceRenewals={scopedData.filteredServiceRenewals}
          managerOptions={appData.managerOptions}
          onRefresh={onRefresh}
        />
      );
    case "plans":
      return (
        <KeyScenariosView
          title="客户成功计划"
          subtitle="按客户成功计划工作表展示目标意图、组织关系、业务成功目标、关键过程变化和后续重点工作。"
          createLabel="新增客户成功计划"
          mergeCustomerCells
          scenarios={scopedData.filteredKeyScenarios}
          customers={scopedData.filteredCustomers}
          managerOptions={appData.managerOptions}
          onRefresh={onRefresh}
        />
      );
    case "projectManagement":
      return (
        <ProjectsView
          projects={scopedData.filteredProjects}
          customers={scopedData.filteredCustomers}
          managerOptions={appData.managerOptions}
          onRefresh={onRefresh}
        />
      );
    case "projects":
      return (
        <ServiceRenewalsView
          renewals={scopedData.filteredServiceRenewals}
          customers={scopedData.filteredCustomers}
          managerOptions={appData.managerOptions}
          onRefresh={onRefresh}
        />
      );
    case "weekly":
      return (
        <WeeklyView
          tasks={scopedData.filteredWeeklyTasks}
          customers={scopedData.filteredCustomers}
          managerOptions={appData.managerOptions}
          onRefresh={onRefresh}
        />
      );
    case "account":
      return <AccountView session={session} source={appData.source} />;
    case "push":
      return <PushConfigView managers={appData.managerOptions.map((manager) => manager.name)} />;
    case "users":
      return <UsersView source={appData.source} users={appData.users} managerOptions={appData.managerOptions} onRefresh={onRefresh} />;
    default:
      return null;
  }
}
