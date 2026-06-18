"use client";

import { KeyRound, Power, RefreshCw, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel } from "@/components/common/Panel";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Table } from "@/components/common/Table";
import type { UserRole } from "@/lib/auth";
import type { ManagerOption, UserAccount } from "@/lib/user-service";

type UsersViewProps = {
  source: "database" | "static";
  users: UserAccount[];
  managerOptions: ManagerOption[];
  onRefresh: () => Promise<void>;
};

type UserForm = {
  username: string;
  displayName: string;
  role: UserRole;
  boundManagerId: number | null;
  phone: string;
  password: string;
};

const defaultPassword = "123456";

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || "请求失败。";
}

export function UsersView({ source, users, managerOptions, onRefresh }: UsersViewProps) {
  const firstManagerId = managerOptions[0]?.id ?? null;
  const [form, setForm] = useState<UserForm>({
    username: "",
    displayName: "",
    role: "manager",
    boundManagerId: firstManagerId,
    phone: "",
    password: defaultPassword,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selectedManagerId = form.boundManagerId ?? firstManagerId;

  const missingManagers = useMemo(() => {
    return managerOptions.filter((manager) => !users.some((user) => user.managerId === manager.id));
  }, [managerOptions, users]);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await action();
      await onRefresh();
      setMessage(successMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "操作失败。");
    } finally {
      setSaving(false);
    }
  };

  const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction(async () => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          ...form,
          boundManagerId: form.role === "manager" ? selectedManagerId : null,
        }),
      });

      if (!response.ok) throw new Error(await readApiMessage(response));

      setForm({
        username: "",
        displayName: "",
        role: "manager",
        boundManagerId: firstManagerId,
        phone: "",
        password: defaultPassword,
      });
    }, "账号已创建。");
  };

  const ensureManagerAccounts = async () => {
    await runAction(async () => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ensure-managers" }),
      });

      if (!response.ok) throw new Error(await readApiMessage(response));
    }, "已补齐缺失的经理账号。");
  };

  const updateUser = async (user: UserAccount, patch: { enabled?: boolean; password?: string }) => {
    await runAction(async () => {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!response.ok) throw new Error(await readApiMessage(response));
    }, "账号已更新。");
  };

  return (
    <Panel title="账号管理" subtitle="管理员、主管与大客户服务经理账号">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="muted-text text-sm">
          经理账号缺失：{missingManagers.length ? missingManagers.map((manager) => manager.name).join("、") : "0"}
        </div>
        <button className="secondary-button" disabled={saving || source === "static"} onClick={ensureManagerAccounts}>
          <RefreshCw size={16} />
          补齐经理账号
        </button>
      </div>

      {source === "static" ? <div className="notice-line mb-4">当前为演示数据，配置数据库后可新增、启停或重置账号。</div> : null}
      {message ? <div className="success-line mb-4">{message}</div> : null}
      {error ? <div className="notice-line mb-4">{error}</div> : null}

      <form className="surface-card mb-5 grid gap-4 md:grid-cols-3 xl:grid-cols-6" onSubmit={createUser}>
        <label className="field">
          <span>账号</span>
          <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} />
        </label>
        <label className="field">
          <span>姓名</span>
          <input
            value={form.displayName}
            onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
          />
        </label>
        <label className="field">
          <span>账号类型</span>
          <select
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as UserRole,
                boundManagerId: event.target.value === "manager" ? current.boundManagerId ?? firstManagerId : null,
              }))
            }
          >
            <option value="manager">大客户服务经理</option>
            <option value="supervisor">大客户服务主管</option>
            <option value="admin">管理员</option>
          </select>
        </label>
        <label className="field">
          <span>绑定经理</span>
          <select
            disabled={form.role !== "manager"}
            value={selectedManagerId ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, boundManagerId: Number(event.target.value) || null }))}
          >
            {managerOptions.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>初始密码</span>
          <input
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            type="password"
          />
        </label>
        <label className="field">
          <span>手机号</span>
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
        </label>
        <button className="primary-button md:col-span-3 xl:col-span-6" disabled={saving || source === "static"} type="submit">
          <UserPlus size={16} />
          新建账号
        </button>
      </form>

      <Table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>账号</th>
            <th>账号类型</th>
            <th>绑定经理</th>
            <th>手机号</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="font-medium">{user.name}</td>
              <td>{user.username}</td>
              <td>{user.roleLabel}</td>
              <td>{user.manager ?? "-"}</td>
              <td>{user.phone || "-"}</td>
              <td>
                <StatusBadge status={user.enabled ? "启用" : "停用"} />
              </td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="secondary-button"
                    disabled={saving || source === "static"}
                    onClick={() => updateUser(user, { enabled: !user.enabled })}
                    type="button"
                  >
                    <Power size={15} />
                    {user.enabled ? "停用" : "启用"}
                  </button>
                  <button
                    className="secondary-button"
                    disabled={saving || source === "static"}
                    onClick={() => updateUser(user, { password: defaultPassword })}
                    type="button"
                  >
                    <KeyRound size={15} />
                    重置密码
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  );
}
