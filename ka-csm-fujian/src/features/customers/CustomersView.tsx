"use client";

import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { RiskBadge, StatusBadge } from "@/components/common/StatusBadge";
import { Table } from "@/components/common/Table";
import { customerSubTabs } from "@/config/navigation";
import { ServiceRenewalsView } from "@/features/projects/ServiceRenewalsView";
import { contactLevels, customerStatuses, riskLevels, type Contact, type Customer, type ServiceRenewal } from "@/lib/data";
import type { ManagerOption } from "@/lib/user-service";
import type { CustomerSubTab } from "@/types/app";

type CustomerDraft = {
  name: string;
  status: Customer["status"];
  managerId: string;
  city: string;
  industry: string;
  breakAmount: string;
  renewalAmount: string;
  repurchaseAmount: string;
  eosAmount: string;
  risk: Customer["risk"];
  remark: string;
};

type ContactDraft = {
  customerId: string;
  name: string;
  department: string;
  title: string;
  level: Contact["level"];
  attitude: Contact["attitude"];
  ownerManagerId: string;
  lastTouch: string;
};

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || "请求失败。";
}

function exportCustomers(customers: Customer[]) {
  const rows = customers.map((customer) => ({
    客户名称: customer.name,
    实际客户名称: customer.actualCustomerName ?? customer.name,
    二级单位: customer.secondaryUnitName ?? "",
    满意度状态: customer.status,
    突破金额: customer.breakAmount,
    续费金额: customer.renewalAmount,
    复购金额: customer.repurchaseAmount,
    EOS金额: customer.eosAmount,
    服务经理: customer.manager,
    城市: customer.city,
    行业: customer.industry,
    风险: customer.risk,
    备注: customer.remark,
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "客户清单");
  XLSX.writeFile(workbook, "客户清单.xlsx");
}

function customerDraft(customer: Customer | null, managerOptions: ManagerOption[]): CustomerDraft {
  const manager = customer ? managerOptions.find((item) => item.name === customer.manager) : managerOptions[0];
  return {
    name: customer?.actualCustomerName ?? customer?.name ?? "",
    status: customer?.status ?? "信任支持",
    managerId: manager ? String(manager.id) : "",
    city: customer?.city ?? "",
    industry: customer?.industry ?? "",
    breakAmount: String(customer?.breakAmount ?? 0),
    renewalAmount: String(customer?.renewalAmount ?? 0),
    repurchaseAmount: String(customer?.repurchaseAmount ?? 0),
    eosAmount: String(customer?.eosAmount ?? 0),
    risk: customer?.risk ?? "中",
    remark: customer?.remark ?? "",
  };
}

function contactDraft(contact: Contact | null, customers: Customer[], managerOptions: ManagerOption[]): ContactDraft {
  const customer = contact ? customers.find((item) => item.name === contact.customer || item.actualCustomerName === contact.customer) : customers[0];
  const owner = contact ? managerOptions.find((item) => item.name === contact.owner) : managerOptions.find((item) => item.name === customer?.manager) ?? managerOptions[0];
  return {
    customerId: customer?.id ?? "",
    name: contact?.name ?? "",
    department: contact?.department ?? "",
    title: contact?.title ?? "",
    level: contact?.level ?? "基层",
    attitude: contact?.attitude ?? "信任支持",
    ownerManagerId: owner ? String(owner.id) : "",
    lastTouch: contact?.lastTouch ?? new Date().toISOString().slice(0, 10),
  };
}

export function CustomersView({
  active,
  onChange,
  customers,
  contacts,
  serviceRenewals,
  managerOptions = [],
  onRefresh,
}: {
  active: CustomerSubTab;
  onChange: (tab: CustomerSubTab) => void;
  customers: Customer[];
  contacts: Contact[];
  serviceRenewals: ServiceRenewal[];
  managerOptions?: ManagerOption[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <section className="space-y-5">
      <div className="tabs-row">
        {customerSubTabs.map((tab) => (
          <button key={tab} className={`subtab ${active === tab ? "subtab-active" : ""}`} onClick={() => onChange(tab)} type="button">
            {tab}
          </button>
        ))}
      </div>

      {active === "客户清单" && <CustomerTable customers={customers} managerOptions={managerOptions} onRefresh={onRefresh} />}
      {active === "关键人清单" && <ContactsTable contacts={contacts} customers={customers} managerOptions={managerOptions} onRefresh={onRefresh} />}
      {active === "服务续费管理" && (
        <ServiceRenewalsView embedded renewals={serviceRenewals} customers={customers} managerOptions={managerOptions} onRefresh={onRefresh} />
      )}
      {active === "客户清单导入导出" && <ImportExportView customers={customers} />}
    </section>
  );
}

function CustomerTable({
  customers,
  managerOptions,
  onRefresh,
}: {
  customers: Customer[];
  managerOptions: ManagerOption[];
  onRefresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<CustomerDraft>(() => customerDraft(null, managerOptions));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateDraft = (next: Partial<CustomerDraft>) => setDraft((current) => ({ ...current, ...next }));

  const openCreate = () => {
    setError("");
    setEditingId(null);
    setDraft(customerDraft(null, managerOptions));
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setError("");
    setEditingId(customer.id);
    setDraft(customerDraft(customer, managerOptions));
    setFormOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/customers${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, ownerManagerId: Number(draft.managerId) }),
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

  const remove = async (customer: Customer) => {
    if (!window.confirm(`确定删除客户 ${customer.name} 吗？`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/customers/${customer.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiMessage(response));
      await onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "删除失败。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="客户清单" subtitle="展示客户基础信息、经营金额、满意度和风险状态。">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {error ? <div className="notice-line">{error}</div> : <div className="muted-text text-sm">共 {customers.length} 个客户</div>}
        <button className="primary-button" disabled={saving} onClick={openCreate} type="button">
          <Plus size={16} />
          新增客户
        </button>
      </div>

      {formOpen ? (
        <div className="surface-card mb-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="field lg:col-span-2">
              <span>客户名称</span>
              <input value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
            </label>
            <label className="field">
              <span>客户经理</span>
              <select value={draft.managerId} onChange={(event) => updateDraft({ managerId: event.target.value })}>
                {managerOptions.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>满意度</span>
              <select value={draft.status} onChange={(event) => updateDraft({ status: event.target.value as Customer["status"] })}>
                {customerStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="field">
              <span>城市</span>
              <input value={draft.city} onChange={(event) => updateDraft({ city: event.target.value })} />
            </label>
            <label className="field">
              <span>行业</span>
              <input value={draft.industry} onChange={(event) => updateDraft({ industry: event.target.value })} />
            </label>
            <label className="field">
              <span>突破金额</span>
              <input type="number" value={draft.breakAmount} onChange={(event) => updateDraft({ breakAmount: event.target.value })} />
            </label>
            <label className="field">
              <span>续费金额</span>
              <input type="number" value={draft.renewalAmount} onChange={(event) => updateDraft({ renewalAmount: event.target.value })} />
            </label>
            <label className="field">
              <span>复购金额</span>
              <input type="number" value={draft.repurchaseAmount} onChange={(event) => updateDraft({ repurchaseAmount: event.target.value })} />
            </label>
            <label className="field">
              <span>EOS金额</span>
              <input type="number" value={draft.eosAmount} onChange={(event) => updateDraft({ eosAmount: event.target.value })} />
            </label>
            <label className="field">
              <span>风险</span>
              <select value={draft.risk} onChange={(event) => updateDraft({ risk: event.target.value as Customer["risk"] })}>
                {riskLevels.map((risk) => <option key={risk}>{risk}</option>)}
              </select>
            </label>
            <label className="field lg:col-span-3">
              <span>备注</span>
              <textarea value={draft.remark} onChange={(event) => updateDraft({ remark: event.target.value })} />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="secondary-button" disabled={saving} onClick={() => setFormOpen(false)} type="button">取消</button>
            <button className="primary-button" disabled={saving || !draft.name || !draft.managerId} onClick={save} type="button">保存</button>
          </div>
        </div>
      ) : null}

      {customers.length ? (
        <Table>
          <thead>
            <tr>
              <th>客户</th>
              <th>二级单位</th>
              <th>满意度</th>
              <th>突破</th>
              <th>续费</th>
              <th>复购</th>
              <th>EOS</th>
              <th>服务经理</th>
              <th>城市</th>
              <th>行业</th>
              <th>风险</th>
              <th>备注</th>
              <th className="sticky-action-col">操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="font-medium">{customer.name}</td>
                <td>{customer.secondaryUnitName || "-"}</td>
                <td><StatusBadge status={customer.status} /></td>
                <td>{customer.breakAmount.toFixed(2)}</td>
                <td>{customer.renewalAmount.toFixed(2)}</td>
                <td>{customer.repurchaseAmount.toFixed(2)}</td>
                <td>{customer.eosAmount.toFixed(2)}</td>
                <td>{customer.manager}</td>
                <td>{customer.city}</td>
                <td>{customer.industry}</td>
                <td><RiskBadge risk={customer.risk} /></td>
                <td className="max-w-sm">{customer.remark}</td>
                <td className="sticky-action-col">
                  <div className="table-actions">
                    <button className="icon-button" disabled={saving} onClick={() => openEdit(customer)} title="编辑" type="button"><Pencil size={15} /></button>
                    <button className="icon-button danger-action" disabled={saving} onClick={() => remove(customer)} title="删除" type="button"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState />
      )}
    </Panel>
  );
}

function ContactsTable({
  contacts,
  customers,
  managerOptions,
  onRefresh,
}: {
  contacts: Contact[];
  customers: Customer[];
  managerOptions: ManagerOption[];
  onRefresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<ContactDraft>(() => contactDraft(null, customers, managerOptions));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const customerManagerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer.manager])), [customers]);
  const updateDraft = (next: Partial<ContactDraft>) => setDraft((current) => ({ ...current, ...next }));

  const openCreate = () => {
    setError("");
    setEditingId(null);
    setDraft(contactDraft(null, customers, managerOptions));
    setFormOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setError("");
    setEditingId(contact.id);
    setDraft(contactDraft(contact, customers, managerOptions));
    setFormOpen(true);
  };

  const handleCustomerChange = (customerId: string) => {
    const managerName = customerManagerMap.get(customerId);
    const manager = managerOptions.find((item) => item.name === managerName);
    updateDraft({ customerId, ownerManagerId: manager ? String(manager.id) : draft.ownerManagerId });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/contacts${editingId ? `/${editingId}` : ""}`, {
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

  const remove = async (contact: Contact) => {
    if (!window.confirm(`确定删除关键人 ${contact.name} 吗？`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/contacts/${contact.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiMessage(response));
      await onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "删除失败。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="关键人清单" subtitle="展示客户关键人、角色层级、态度和最近触达时间。">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {error ? <div className="notice-line">{error}</div> : <div className="muted-text text-sm">共 {contacts.length} 位关键人</div>}
        <button className="primary-button" disabled={saving || !customers.length} onClick={openCreate} type="button">
          <Plus size={16} />
          新增关键人
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
              <span>姓名</span>
              <input value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
            </label>
            <label className="field">
              <span>负责人</span>
              <select value={draft.ownerManagerId} onChange={(event) => updateDraft({ ownerManagerId: event.target.value })}>
                {managerOptions.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>部门</span>
              <input value={draft.department} onChange={(event) => updateDraft({ department: event.target.value })} />
            </label>
            <label className="field">
              <span>职务</span>
              <input value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} />
            </label>
            <label className="field">
              <span>最近触达</span>
              <input type="date" value={draft.lastTouch} onChange={(event) => updateDraft({ lastTouch: event.target.value })} />
            </label>
            <label className="field">
              <span>层级</span>
              <select value={draft.level} onChange={(event) => updateDraft({ level: event.target.value as Contact["level"] })}>
                {contactLevels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
            <label className="field">
              <span>态度</span>
              <select value={draft.attitude} onChange={(event) => updateDraft({ attitude: event.target.value as Contact["attitude"] })}>
                {customerStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="secondary-button" disabled={saving} onClick={() => setFormOpen(false)} type="button">取消</button>
            <button className="primary-button" disabled={saving || !draft.customerId || !draft.name} onClick={save} type="button">保存</button>
          </div>
        </div>
      ) : null}

      {contacts.length ? (
        <Table>
          <thead>
            <tr>
              <th>客户</th>
              <th>姓名</th>
              <th>部门</th>
              <th>职务</th>
              <th>层级</th>
              <th>态度</th>
              <th>负责人</th>
              <th>最近触达</th>
              <th className="sticky-action-col">操作</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>{contact.customer}</td>
                <td className="font-medium">{contact.name}</td>
                <td>{contact.department}</td>
                <td>{contact.title}</td>
                <td>{contact.level}</td>
                <td><StatusBadge status={contact.attitude} /></td>
                <td>{contact.owner}</td>
                <td>{contact.lastTouch}</td>
                <td className="sticky-action-col">
                  <div className="table-actions">
                    <button className="icon-button" disabled={saving} onClick={() => openEdit(contact)} title="编辑" type="button"><Pencil size={15} /></button>
                    <button className="icon-button danger-action" disabled={saving} onClick={() => remove(contact)} title="删除" type="button"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState />
      )}
    </Panel>
  );
}

function ImportExportView({ customers }: { customers: Customer[] }) {
  return (
    <Panel title="客户清单导入导出" subtitle="导出当前筛选后的客户清单。">
      <button className="primary-button" onClick={() => exportCustomers(customers)} type="button">
        <Download size={16} />
        导出客户清单
      </button>
    </Panel>
  );
}
