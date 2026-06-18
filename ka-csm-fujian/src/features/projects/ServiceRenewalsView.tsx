"use client";

import { Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { Table } from "@/components/common/Table";
import type { Customer, ServiceRenewal } from "@/lib/data";
import { serviceRenewalFieldLabels, serviceRenewalFields, serviceRenewalNumericFields, type ServiceRenewalField } from "@/lib/service-renewal-fields";
import type { ManagerOption } from "@/lib/user-service";

type RenewalDraft = Record<ServiceRenewalField, string>;

const defaultVisibleFields: ServiceRenewalField[] = [
  "customerName",
  "owner",
  "managementSheet",
  "renewalTarget",
  "renewedOrderAmount",
  "deviceRenewalRate",
  "remainingRenewalAmount",
  "eosReplacementTarget",
  "eosExpiredDevices",
  "eosReplacementRate",
];

const emptyDraft = (customers: Customer[], managerOptions: ManagerOption[]): RenewalDraft => ({
  customerName: customers[0]?.actualCustomerName ?? customers[0]?.name ?? "",
  owner: customers[0]?.manager ?? managerOptions[0]?.name ?? "",
  managementSheet: "",
  renewalTarget: "0",
  nonEosExpiredDevices: "0",
  renewedDevices: "0",
  renewedOrderAmount: "0",
  deviceRenewalRate: "0",
  remainingRenewalAmount: "0",
  eosReplacementTarget: "0",
  eosExpiredDevices: "0",
  replacedDevices: "0",
  replacementOrderAmount: "0",
  eosReplacementRate: "0",
  remainingReplacementAmount: "0",
});

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || "请求失败。";
}

function toDraft(row: ServiceRenewal): RenewalDraft {
  return Object.fromEntries(serviceRenewalFields.map((field) => [field, String(row[field] ?? "")])) as RenewalDraft;
}

function managerIdForName(managerOptions: ManagerOption[], name: string) {
  return managerOptions.find((manager) => manager.name === name)?.id;
}

function formatValue(field: ServiceRenewalField, value: string | number) {
  if (!serviceRenewalNumericFields.includes(field)) return String(value || "-");
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (field.includes("Rate")) return `${(number * 100).toFixed(1)}%`;
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

export function ServiceRenewalsView({
  embedded = false,
  renewals,
  customers = [],
  managerOptions = [],
  onRefresh,
}: {
  embedded?: boolean;
  renewals: ServiceRenewal[];
  customers?: Customer[];
  managerOptions?: ManagerOption[];
  onRefresh?: () => Promise<void>;
}) {
  const [showFields, setShowFields] = useState(false);
  const [visibleFields, setVisibleFields] = useState<ServiceRenewalField[]>(defaultVisibleFields);
  const [draft, setDraft] = useState<RenewalDraft>(() => emptyDraft(customers, managerOptions));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const orderedFields = useMemo(() => serviceRenewalFields.filter((field) => visibleFields.includes(field)), [visibleFields]);
  const canWrite = Boolean(onRefresh);

  const syncScroll = (source: "top" | "table") => {
    const top = topScrollRef.current;
    const table = tableScrollRef.current;
    if (!top || !table) return;
    if (source === "top") table.scrollLeft = top.scrollLeft;
    else top.scrollLeft = table.scrollLeft;
  };

  const toggleField = (field: ServiceRenewalField) => {
    setVisibleFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]));
  };

  const openCreate = () => {
    setError("");
    setEditingId(null);
    setDraft(emptyDraft(customers, managerOptions));
    setFormOpen(true);
  };

  const openEdit = (renewal: ServiceRenewal) => {
    setError("");
    setEditingId(renewal.id);
    setDraft(toDraft(renewal));
    setFormOpen(true);
  };

  const updateDraft = (field: ServiceRenewalField, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    if (!onRefresh) return;
    setSaving(true);
    setError("");
    try {
      const ownerManagerId = managerIdForName(managerOptions, draft.owner);
      const response = await fetch(`/api/customer-management/service-renewals${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, ownerManagerId }),
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

  const remove = async (renewal: ServiceRenewal) => {
    if (!onRefresh || !window.confirm(`确定删除 ${renewal.customerName} 的服务续费记录吗？`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/service-renewals/${renewal.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiMessage(response));
      await onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "删除失败。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title={embedded ? "服务续费管理" : "服务续费管理"}
      subtitle="按服务续费管理表展示续费目标、过保设备、续费金额、换新目标和剩余可控金额。"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {error ? <div className="notice-line">{error}</div> : <div className="muted-text text-sm">共 {renewals.length} 条服务续费记录</div>}
        <div className="flex gap-2">
          <button className="secondary-button" onClick={() => setShowFields((value) => !value)} type="button">
            <Settings2 size={16} />
            显示字段
          </button>
          <button className="primary-button" disabled={!canWrite || saving} onClick={openCreate} type="button">
            <Plus size={16} />
            新增服务续费
          </button>
        </div>
      </div>

      {showFields ? (
        <div className="surface-card mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {serviceRenewalFields.map((field) => (
            <label key={field} className="flex items-center gap-2 text-sm">
              <input checked={visibleFields.includes(field)} onChange={() => toggleField(field)} type="checkbox" />
              <span>{serviceRenewalFieldLabels[field]}</span>
            </label>
          ))}
        </div>
      ) : null}

      {formOpen ? (
        <div className="surface-card mb-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="field">
              <span>客户名称</span>
              <input list="renewal-customers" value={draft.customerName} onChange={(event) => updateDraft("customerName", event.target.value)} />
              <datalist id="renewal-customers">
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.actualCustomerName ?? customer.name} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>服务经理</span>
              <select value={draft.owner} onChange={(event) => updateDraft("owner", event.target.value)}>
                {[...new Set([...managerOptions.map((manager) => manager.name), draft.owner].filter(Boolean))].map((manager) => (
                  <option key={manager}>{manager}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>服务续费管理表</span>
              <input value={draft.managementSheet} onChange={(event) => updateDraft("managementSheet", event.target.value)} />
            </label>
            {serviceRenewalNumericFields.map((field) => (
              <label key={field} className="field">
                <span>{serviceRenewalFieldLabels[field]}</span>
                <input type="number" step="0.01" value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} />
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="secondary-button" disabled={saving} onClick={() => setFormOpen(false)} type="button">取消</button>
            <button className="primary-button" disabled={saving || !draft.customerName || !draft.owner} onClick={save} type="button">保存</button>
          </div>
        </div>
      ) : null}

      {renewals.length ? (
        <>
          <div ref={topScrollRef} className="table-top-scroll" onScroll={() => syncScroll("top")}>
            <div style={{ width: Math.max(orderedFields.length * 180 + 160, 1000) }} />
          </div>
          <Table scrollRef={tableScrollRef} onScroll={() => syncScroll("table")}>
            <thead>
              <tr>
                {orderedFields.map((field) => (
                  <th key={field}>{serviceRenewalFieldLabels[field]}</th>
                ))}
                <th className="sticky-action-col">操作</th>
              </tr>
            </thead>
            <tbody>
              {renewals.map((renewal) => (
                <tr key={renewal.id}>
                  {orderedFields.map((field) => (
                    <td key={field} className="min-w-44 align-top">
                      {formatValue(field, renewal[field])}
                    </td>
                  ))}
                  <td className="sticky-action-col">
                    <div className="table-actions">
                      <button className="icon-button" disabled={!canWrite || saving} onClick={() => openEdit(renewal)} title="编辑" type="button">
                        <Pencil size={15} />
                      </button>
                      <button className="icon-button danger-action" disabled={!canWrite || saving} onClick={() => remove(renewal)} title="删除" type="button">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      ) : (
        <EmptyState />
      )}
    </Panel>
  );
}
