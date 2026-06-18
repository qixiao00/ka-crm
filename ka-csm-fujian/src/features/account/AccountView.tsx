"use client";

import { useState } from "react";
import { Panel } from "@/components/common/Panel";
import type { SessionUser } from "@/types/app";

function roleText(role: SessionUser["role"]) {
  if (role === "admin") return "管理员";
  if (role === "supervisor") return "大客户服务主管";
  return "大客户服务经理";
}

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || "请求失败。";
}

export function AccountView({ session, source }: { session: SessionUser; source: "database" | "static" }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch("/api/session/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (!response.ok) throw new Error(await readApiMessage(response));

      setOldPassword("");
      setNewPassword("");
      setMessage("密码已保存。");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="我的账号" subtitle="当前登录账号信息与密码维护">
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="surface-card">
          <p>账号：{session.username}</p>
          <p className="mt-2">姓名：{session.displayName}</p>
          <p className="mt-2">手机号：{session.phone || "-"}</p>
          <p className="mt-2">角色：{roleText(session.role)}</p>
          {session.managerName ? <p className="mt-2">绑定经理：{session.managerName}</p> : null}
        </div>
        <form className="surface-card grid gap-4 md:grid-cols-2" onSubmit={savePassword}>
          <label className="field">
            <span>旧密码</span>
            <input value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} type="password" />
          </label>
          <label className="field">
            <span>新密码</span>
            <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" />
          </label>
          {source === "static" ? <div className="notice-line md:col-span-2">当前为演示数据，配置数据库后可修改密码。</div> : null}
          {message ? <div className="success-line md:col-span-2">{message}</div> : null}
          {error ? <div className="notice-line md:col-span-2">{error}</div> : null}
          <button className="primary-button md:col-span-2" disabled={saving || source === "static"} type="submit">
            {saving ? "保存中" : "保存密码"}
          </button>
        </form>
      </div>
    </Panel>
  );
}
