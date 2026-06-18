"use client";

import { Plus, Save, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { ProgressCard } from "@/components/common/ProgressCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Contact, Customer, SuccessPlan } from "@/lib/data";
import type { ManagerOption } from "@/lib/user-service";

type CreatePlanDraft = {
  customerId: string;
  ownerManagerId: string;
  scenario: string;
  stage: string;
  inKcp: boolean;
  revenueProgress: number;
  relationProgress: number;
  valueProgress: number;
  contactId: string;
  nextAction: string;
};

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || "请求失败。";
}

function contactsForCustomer(contacts: Contact[], customerName?: string) {
  return customerName ? contacts.filter((contact) => contact.customer === customerName) : [];
}

function selectedContactId(plan: SuccessPlan, contacts: Contact[]) {
  const customerContacts = contactsForCustomer(contacts, plan.customer);
  const selectedName = plan.contacts[0];
  return customerContacts.find((contact) => contact.name === selectedName)?.id ?? "";
}

function defaultDraft(customers: Customer[], managerOptions: ManagerOption[], contacts: Contact[]): CreatePlanDraft {
  const customer = customers[0];
  const manager = managerOptions.find((item) => item.name === customer?.manager) ?? managerOptions[0];
  const contact = contactsForCustomer(contacts, customer?.name)[0];

  return {
    customerId: customer?.id ?? "",
    ownerManagerId: manager ? String(manager.id) : "",
    scenario: "",
    stage: "",
    inKcp: false,
    revenueProgress: 0,
    relationProgress: 0,
    valueProgress: 0,
    contactId: contact?.id ?? "",
    nextAction: "",
  };
}

function uniquePlanStatuses(plans: SuccessPlan[]) {
  return Array.from(new Set(plans.map((plan) => plan.status)));
}

export function PlansView({
  embedded = false,
  plans,
  customers = [],
  contacts = [],
  managerOptions = [],
  onRefresh,
}: {
  embedded?: boolean;
  plans: SuccessPlan[];
  customers?: Customer[];
  contacts?: Contact[];
  managerOptions?: ManagerOption[];
  onRefresh?: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreatePlanDraft>(() => defaultDraft(customers, managerOptions, contacts));
  const [error, setError] = useState("");

  const statusOptions = useMemo(() => uniquePlanStatuses(plans), [plans]);
  const customerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const canCreate = Boolean(onRefresh && customers.length);
  const createContactOptions = contactsForCustomer(contacts, customerMap.get(createDraft.customerId)?.name);

  const updateCreateDraft = (next: Partial<CreatePlanDraft>) => {
    setCreateDraft((current) => ({ ...current, ...next }));
  };

  const startCreate = () => {
    setError("");
    setCreateDraft(defaultDraft(customers, managerOptions, contacts));
    setCreating(true);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customerMap.get(customerId);
    const manager = managerOptions.find((item) => item.name === customer?.manager);
    const contact = contactsForCustomer(contacts, customer?.name)[0];
    updateCreateDraft({
      customerId,
      ownerManagerId: manager ? String(manager.id) : createDraft.ownerManagerId,
      contactId: contact?.id ?? "",
    });
  };

  const createPlan = async () => {
    if (!onRefresh) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/customer-management/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createDraft),
      });
      if (!response.ok) throw new Error(await readApiMessage(response));
      setCreating(false);
      await onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "新增失败。");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!onRefresh) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/plans/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error(await readApiMessage(response));
      setEditingId("");
      await onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title={embedded ? "关键场景清单" : "客户成功计划"} subtitle="围绕收入、组织关系和价值兑现维护客户成功动作">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {error ? <div className="notice-line">{error}</div> : <div className="muted-text text-sm">共 {plans.length} 项计划</div>}
        <button className="primary-button" disabled={!canCreate || creating} onClick={startCreate} type="button">
          <Plus size={16} />
          新增客户成功计划
        </button>
      </div>

      {creating ? (
        <div className="surface-card mb-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="field">
              <span>客户</span>
              <select value={createDraft.customerId} onChange={(event) => handleCustomerChange(event.target.value)}>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>负责人</span>
              <select value={createDraft.ownerManagerId} onChange={(event) => updateCreateDraft({ ownerManagerId: event.target.value })}>
                {managerOptions.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>KCP</span>
              <span className="checkbox-line">
                <input checked={createDraft.inKcp} type="checkbox" onChange={(event) => updateCreateDraft({ inKcp: event.target.checked })} />
                <span>纳入 KCP</span>
              </span>
            </label>
            <label className="field">
              <span>关键人</span>
              <select value={createDraft.contactId} onChange={(event) => updateCreateDraft({ contactId: event.target.value })}>
                <option value="">未关联</option>
                {createContactOptions.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
              </select>
            </label>
            <label className="field lg:col-span-2">
              <span>计划名称</span>
              <input value={createDraft.scenario} onChange={(event) => updateCreateDraft({ scenario: event.target.value })} />
            </label>
            <label className="field">
              <span>当前阶段</span>
              <input value={createDraft.stage} onChange={(event) => updateCreateDraft({ stage: event.target.value })} />
            </label>
            {(["revenueProgress", "relationProgress", "valueProgress"] as const).map((field) => (
              <label key={field} className="field">
                <span>{field === "revenueProgress" ? "收入进度" : field === "relationProgress" ? "关系进度" : "价值进度"}</span>
                <input max={100} min={0} type="number" value={createDraft[field]} onChange={(event) => updateCreateDraft({ [field]: Number(event.target.value) })} />
              </label>
            ))}
            <label className="field lg:col-span-3">
              <span>下一步动作</span>
              <input value={createDraft.nextAction} onChange={(event) => updateCreateDraft({ nextAction: event.target.value })} />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="secondary-button" disabled={saving} onClick={() => setCreating(false)} type="button">取消</button>
            <button className="primary-button" disabled={saving || !createDraft.customerId || !createDraft.scenario || !createDraft.stage} onClick={createPlan} type="button">保存</button>
          </div>
        </div>
      ) : null}

      {plans.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {plans.map((plan) => {
            const editing = editingId === plan.id;
            const planContacts = contactsForCustomer(contacts, plan.customer);
            return (
              <article key={plan.id} className="surface-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="muted-text text-sm">{plan.customer}</p>
                    {editing ? <input className="table-input mt-1 w-full" value={String(draft.scenario ?? "")} onChange={(event) => setDraft((current) => ({ ...current, scenario: event.target.value }))} /> : <h3 className="mt-1 text-lg font-semibold">{plan.scenario}</h3>}
                  </div>
                  <div className="flex gap-2">
                    {editing ? (
                      <label className="checkbox-line">
                        <input checked={Boolean(draft.inKcp)} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, inKcp: event.target.checked }))} />
                        <span>KCP</span>
                      </label>
                    ) : <StatusBadge status={plan.inKcp ? "KCP" : "Non-KCP"} />}
                    {editing ? (
                      <select className="table-input" value={String(draft.status)} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                        {(statusOptions.length ? statusOptions : [plan.status]).map((item) => <option key={item}>{item}</option>)}
                      </select>
                    ) : <StatusBadge status={plan.status} />}
                  </div>
                </div>
                <div className="muted-text mt-3 text-sm">
                  负责人：{plan.owner} / 当前阶段：
                  {editing ? <input className="table-input ml-2 min-w-64" value={String(draft.stage ?? "")} onChange={(event) => setDraft((current) => ({ ...current, stage: event.target.value }))} /> : ` ${plan.stage}`}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {(["revenueProgress", "relationProgress", "valueProgress"] as const).map((field) => (
                    editing ? (
                      <label key={field} className="field">
                        <span>{field === "revenueProgress" ? "收入进度" : field === "relationProgress" ? "关系进度" : "价值进度"}</span>
                        <input className="table-input" max={100} min={0} type="number" value={String(draft[field] ?? 0)} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} />
                      </label>
                    ) : <ProgressCard key={field} label={field === "revenueProgress" ? "收入进度" : field === "relationProgress" ? "关系进度" : "价值进度"} value={plan[field]} />
                  ))}
                </div>
                <div className="mt-4 rounded-md border border-[#d7e7fb] bg-white/70 p-3 text-sm text-[#334155] backdrop-blur">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>关键人：</span>
                    {editing ? (
                      <select className="table-input min-w-40" value={String(draft.contactId ?? "")} onChange={(event) => setDraft((current) => ({ ...current, contactId: event.target.value }))}>
                        <option value="">未关联</option>
                        {planContacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
                      </select>
                    ) : (
                      <span>{plan.contacts.join("、") || "未关联"}</span>
                    )}
                    <span>/ 下一步：</span>
                    {editing ? <input className="table-input min-w-64" value={String(draft.nextAction ?? "")} onChange={(event) => setDraft((current) => ({ ...current, nextAction: event.target.value }))} /> : plan.nextAction}
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {editing ? (
                    <>
                      <button className="icon-button" disabled={saving} onClick={save} type="button"><Save size={15} /></button>
                      <button className="icon-button" disabled={saving} onClick={() => setEditingId("")} type="button"><X size={15} /></button>
                    </>
                  ) : <button className="secondary-button" disabled={!onRefresh} onClick={() => { setEditingId(plan.id); setDraft({ ...(plan as unknown as Record<string, string | number | boolean>), contactId: selectedContactId(plan, contacts) }); }} type="button">编辑</button>}
                </div>
              </article>
            );
          })}
        </div>
      ) : <EmptyState />}
    </Panel>
  );
}
