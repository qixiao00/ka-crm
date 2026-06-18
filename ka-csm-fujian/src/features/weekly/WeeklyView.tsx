"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { StatusBadge } from "@/components/common/StatusBadge";
import { weeklyStatuses, type Customer, type TaskStatus, type WeeklyTask } from "@/lib/data";
import type { ManagerOption } from "@/lib/user-service";

type WeeklyDraft = {
  customerId: string;
  ownerManagerId: string;
  title: string;
  planDate: string;
  status: TaskStatus;
  resultNote: string;
};

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || "请求失败。";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultDraft(customers: Customer[], managerOptions: ManagerOption[]): WeeklyDraft {
  const customer = customers[0];
  const manager = managerOptions.find((item) => item.name === customer?.manager) ?? managerOptions[0];

  return {
    customerId: customer?.id ?? "",
    ownerManagerId: manager ? String(manager.id) : "",
    title: "",
    planDate: today(),
    status: "未开始",
    resultNote: "",
  };
}

function taskDraft(task: WeeklyTask, customers: Customer[], managerOptions: ManagerOption[]): WeeklyDraft {
  const customer = customers.find((item) => item.name === task.customer || item.actualCustomerName === task.customer) ?? customers[0];
  const manager = managerOptions.find((item) => item.name === task.owner) ?? managerOptions[0];
  return {
    customerId: customer?.id ?? "",
    ownerManagerId: manager ? String(manager.id) : "",
    title: task.title,
    planDate: task.planDate,
    status: task.status,
    resultNote: task.resultNote,
  };
}

export function WeeklyView({
  tasks,
  customers = [],
  managerOptions = [],
  onRefresh,
}: {
  tasks: WeeklyTask[];
  customers?: Customer[];
  managerOptions?: ManagerOption[];
  onRefresh?: () => Promise<void>;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<WeeklyDraft>(() => defaultDraft(customers, managerOptions));
  const [error, setError] = useState("");

  const customerManagerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer.manager])), [customers]);
  const canWrite = Boolean(onRefresh && customers.length);

  const updateDraft = (next: Partial<WeeklyDraft>) => setDraft((current) => ({ ...current, ...next }));

  const openCreate = () => {
    setError("");
    setEditingId(null);
    setDraft(defaultDraft(customers, managerOptions));
    setFormOpen(true);
  };

  const openEdit = (task: WeeklyTask) => {
    setError("");
    setEditingId(task.id);
    setDraft(taskDraft(task, customers, managerOptions));
    setFormOpen(true);
  };

  const handleCustomerChange = (customerId: string) => {
    const managerName = customerManagerMap.get(customerId);
    const manager = managerOptions.find((item) => item.name === managerName);
    updateDraft({ customerId, ownerManagerId: manager ? String(manager.id) : draft.ownerManagerId });
  };

  const save = async () => {
    if (!onRefresh) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/weekly${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error(await readApiMessage(response));
      setFormOpen(false);
      await onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (task: WeeklyTask) => {
    if (!onRefresh || !window.confirm(`确定删除工作计划「${task.title}」吗？`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/weekly/${task.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiMessage(response));
      await onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "删除失败。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="周执行工作" subtitle="按状态拆分本周计划、进行中、逾期和完成动作。">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {error ? <div className="notice-line">{error}</div> : <div className="muted-text text-sm">共 {tasks.length} 项工作</div>}
        <button className="primary-button" disabled={!canWrite || saving} onClick={openCreate} type="button">
          <Plus size={16} />
          新增周工作计划
        </button>
      </div>

      {formOpen ? (
        <div className="surface-card mb-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="field">
              <span>客户</span>
              <select value={draft.customerId} onChange={(event) => handleCustomerChange(event.target.value)} disabled={Boolean(editingId)}>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>负责人</span>
              <select value={draft.ownerManagerId} onChange={(event) => updateDraft({ ownerManagerId: event.target.value })}>
                {managerOptions.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>预计完成日期</span>
              <input type="date" value={draft.planDate} onChange={(event) => updateDraft({ planDate: event.target.value })} />
            </label>
            <label className="field lg:col-span-2">
              <span>工作计划</span>
              <input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} />
            </label>
            <label className="field">
              <span>状态</span>
              <select value={draft.status} onChange={(event) => updateDraft({ status: event.target.value as TaskStatus })}>
                {weeklyStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="field lg:col-span-3">
              <span>结果备注</span>
              <textarea value={draft.resultNote} onChange={(event) => updateDraft({ resultNote: event.target.value })} />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="secondary-button" disabled={saving} onClick={() => setFormOpen(false)} type="button">取消</button>
            <button className="primary-button" disabled={saving || !draft.customerId || !draft.title || !draft.planDate} onClick={save} type="button">保存</button>
          </div>
        </div>
      ) : null}

      {tasks.length ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {weeklyStatuses.map((status) => {
            const statusTasks = tasks.filter((task) => task.status === status);

            return (
              <div key={status} className="surface-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{status}</h3>
                  <StatusBadge status={String(statusTasks.length)} />
                </div>
                <div className="space-y-3">
                  {statusTasks.length ? (
                    statusTasks.map((task) => (
                      <article key={task.id} className="task-card">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{task.title}</p>
                            <p className="muted-text mt-1 text-xs">{task.customer}</p>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                        <div className="muted-text text-xs">
                          <p>负责人：{task.owner}</p>
                          <p>预计完成日期：{task.planDate}</p>
                          {task.resultNote ? <p>结果备注：{task.resultNote}</p> : null}
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <button className="icon-button" disabled={!canWrite || saving} onClick={() => openEdit(task)} title="编辑" type="button"><Pencil size={15} /></button>
                          <button className="icon-button danger-action" disabled={!canWrite || saving} onClick={() => remove(task)} title="删除" type="button"><Trash2 size={15} /></button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="muted-text text-sm">暂无</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState />
      )}
    </Panel>
  );
}
