"use client";

import { Filter, LogOut, Search } from "lucide-react";
import { ALL_MANAGERS_LABEL } from "@/config/navigation";
import type { NavigationItem, SessionUser, TabKey } from "@/types/app";

type AppShellProps = {
  session: SessionUser;
  navigationItems: NavigationItem[];
  activeTab: TabKey;
  managerFilter: string;
  query: string;
  source: "database" | "static";
  showManagerFilter: boolean;
  updatedAt: string;
  managers: string[];
  loadingData: boolean;
  onTabChange: (tab: TabKey) => void;
  onManagerFilterChange: (manager: string) => void;
  onQueryChange: (query: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export function AppShell({
  session,
  navigationItems,
  activeTab,
  managerFilter,
  query,
  source,
  showManagerFilter,
  updatedAt,
  managers,
  loadingData,
  onTabChange,
  onManagerFilterChange,
  onQueryChange,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">福建区</p>
              <h1 className="text-xl font-semibold">KA客户成功管理系统</h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="identity-chip">{session.displayName}</span>
              <button className="icon-button" onClick={onLogout} title="退出登录" type="button">
                <LogOut size={16} />
                <span>退出登录</span>
              </button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navigationItems.map(({ key, label, icon: Icon }) => (
              <button key={key} className={`nav-pill ${activeTab === key ? "nav-pill-active" : ""}`} onClick={() => onTabChange(key)} type="button">
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {showManagerFilter ? (
              <label className="filter-control">
                <Filter size={15} />
                <select value={managerFilter} onChange={(event) => onManagerFilterChange(event.target.value)}>
                  <option>{ALL_MANAGERS_LABEL}</option>
                  {managers.map((manager) => (
                    <option key={manager}>{manager}</option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="filter-control">
                <Filter size={15} />
                {session.managerName ?? "未绑定经理"}
              </span>
            )}
            <label className="filter-control min-w-[260px]">
              <Search size={15} />
              <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索客户、行业、城市、经理" />
            </label>
          </div>
          <p className="muted-text text-sm">最后更新时间：{updatedAt}</p>
          <p className="muted-text text-sm">
            {source === "static" ? "演示数据" : "数据库数据"}
            {loadingData ? " · 同步中" : ""}
          </p>
        </div>
        {children}
      </main>
    </div>
  );
}
