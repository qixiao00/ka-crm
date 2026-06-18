"use client";

import { useState } from "react";

function FeatureCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="login-feature-card">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}

export function LoginScreen({
  error,
  onLogin,
}: {
  error?: string;
  onLogin: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("19852");
  const [password, setPassword] = useState("123456");
  const [submitting, setSubmitting] = useState(false);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-topbar">
        <div>
          <p className="login-logo">Sangfor KA Success</p>
          <p className="login-topbar-subtitle">福建区客户成功服务门户</p>
        </div>
        <span className="login-topbar-badge">Customer Success Portal</span>
      </div>
      <div className="login-card">
        <section className="login-brand-panel">
          <div className="login-brand-copy">
            <p className="login-kicker">Fujian KA Customer Success</p>
            <h1 className="text-4xl font-semibold leading-tight lg:text-[44px]">
              <span className="block">福建区 KA 客户成功</span>
              <span className="block">管理系统</span>
            </h1>
            <p className="login-hero-copy mt-5 max-w-2xl text-base leading-7">
              集中管理福建区 KA 客户、关键人、客户成功计划、服务续费和周执行事项，帮助主管与客户经理统一目标、风险和下一步动作。
            </p>
            <div className="login-search-preview">
              <span>快速定位客户、场景、续费和周执行事项</span>
              <strong>统一工作入口</strong>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <FeatureCard title="一客一成功目标承载" value="客户、场景、关键人、动作闭环" />
            <FeatureCard title="多类经营目标" value="突破、续费、复购、EOS" />
            <FeatureCard title="周执行工作台" value="按经理拆分待办与推进" />
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-panel">
            <h2 className="text-xl font-semibold">账号登录</h2>
            <p className="muted-text mt-1 text-sm">默认密码：123456；客户经理账号使用工号登录。</p>
            <form className="mt-6 space-y-4" onSubmit={submitLogin}>
              <label className="field">
                <span>账号</span>
                <input value={username} onChange={(event) => setUsername(event.target.value)} />
              </label>
              <label className="field">
                <span>密码</span>
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
              </label>
              {error ? <div className="notice-line">{error}</div> : null}
              <button className="login-submit-button w-full" disabled={submitting} type="submit">
                {submitting ? "登录中" : "登录"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
