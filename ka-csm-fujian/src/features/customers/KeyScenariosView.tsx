"use client";

import { Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { Table } from "@/components/common/Table";
import type { Customer, KeyScenario } from "@/lib/data";
import {
  getSuccessPlanEnumTone,
  successPlanEnumFields,
  successPlanEnumOptions,
  successPlanFieldLabels,
  successPlanFields,
  type SuccessPlanField,
} from "@/lib/success-plan-fields";
import type { ManagerOption } from "@/lib/user-service";

type ScenarioField = SuccessPlanField | "owner";
type ScenarioDraft = Record<ScenarioField, string>;

const allFields = ["customer", "owner", ...successPlanFields.filter((field) => field !== "customer")] as ScenarioField[];

const fieldLabels: Record<ScenarioField, string> = {
  ...successPlanFieldLabels,
  owner: "服务经理",
};

const defaultVisibleFields: ScenarioField[] = [
  "customer",
  "owner",
  "scenario",
  "productLine",
  "isLargeVolumeScenario",
  "businessStage",
  "goalDimension",
  "achievement",
  "keyPersonLevel",
  "satisfactionCurrent",
  "projectStage",
  "satisfactionRisk",
  "juneKeyAction",
  "nextCheckDate",
];

const wideTextFields: ScenarioField[] = ["goalDescription", "keyPerson", "keyGap", "juneKeyAction"];

function emptyDraft(customers: Customer[], managerOptions: ManagerOption[]): ScenarioDraft {
  const customer = customers[0];
  const draft = Object.fromEntries(allFields.map((field) => [field, ""])) as ScenarioDraft;
  draft.customer = customer?.actualCustomerName ?? customer?.name ?? "";
  draft.owner = customer?.manager ?? managerOptions[0]?.name ?? "";
  draft.isLargeVolumeScenario = "是";
  return draft;
}

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || "请求失败。";
}

function toDraft(row: KeyScenario): ScenarioDraft {
  return Object.fromEntries(allFields.map((field) => [field, String(row[field] ?? "")])) as ScenarioDraft;
}

function managerIdForName(managerOptions: ManagerOption[], name: string) {
  return managerOptions.find((manager) => manager.name === name)?.id;
}

function buildRowGroups(items: KeyScenario[]) {
  const spans = new Map<string, number>();
  const hidden = new Set<string>();
  const first = new Set<string>();
  let index = 0;

  while (index < items.length) {
    const customer = items[index].customer;
    let end = index + 1;
    while (end < items.length && items[end].customer === customer) end += 1;
    spans.set(items[index].id, end - index);
    first.add(items[index].id);
    for (let cursor = index + 1; cursor < end; cursor += 1) hidden.add(items[cursor].id);
    index = end;
  }

  return { spans, hidden, first };
}

function isSuccessPlanField(field: ScenarioField): field is SuccessPlanField {
  return field !== "owner";
}

function ScenarioCell({ field, value }: { field: ScenarioField; value: string }) {
  if (!value) return <>-</>;
  if (!isSuccessPlanField(field) || !successPlanEnumFields.includes(field)) return <>{value}</>;
  return <span className={`enum-pill enum-pill-${getSuccessPlanEnumTone(value)}`}>{value}</span>;
}

export function KeyScenariosView({
  title = "客户成功计划",
  subtitle = "按客户成功计划工作表展示目标意图、组织关系、业务成功目标、关键过程变化和后续重点工作。",
  createLabel = "新增客户成功计划",
  mergeCustomerCells = false,
  scenarios,
  customers = [],
  managerOptions = [],
  onRefresh,
}: {
  title?: string;
  subtitle?: string;
  createLabel?: string;
  mergeCustomerCells?: boolean;
  scenarios: KeyScenario[];
  customers?: Customer[];
  managerOptions?: ManagerOption[];
  onRefresh?: () => Promise<void>;
}) {
  const [showFields, setShowFields] = useState(false);
  const [visibleFields, setVisibleFields] = useState<ScenarioField[]>(defaultVisibleFields);
  const [draft, setDraft] = useState<ScenarioDraft>(() => emptyDraft(customers, managerOptions));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const orderedFields = useMemo(() => allFields.filter((field) => visibleFields.includes(field)), [visibleFields]);
  const rowGroups = useMemo(() => buildRowGroups(scenarios), [scenarios]);
  const canWrite = Boolean(onRefresh);

  const syncScroll = (source: "top" | "table") => {
    const top = topScrollRef.current;
    const table = tableScrollRef.current;
    if (!top || !table) return;
    if (source === "top") table.scrollLeft = top.scrollLeft;
    else top.scrollLeft = table.scrollLeft;
  };

  const toggleField = (field: ScenarioField) => {
    setVisibleFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]));
  };

  const updateDraft = (field: ScenarioField, value: string) => {
    if (field === "customer") {
      const matchedCustomer = customers.find((customer) => customer.name === value || customer.actualCustomerName === value);
      setDraft((current) => ({ ...current, customer: value, owner: matchedCustomer?.manager || current.owner }));
      return;
    }
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const openCreate = () => {
    setError("");
    setEditingId(null);
    setDraft(emptyDraft(customers, managerOptions));
    setFormOpen(true);
  };

  const openEdit = (scenario: KeyScenario) => {
    setError("");
    setEditingId(scenario.id);
    setDraft(toDraft(scenario));
    setFormOpen(true);
  };

  const save = async () => {
    if (!onRefresh) return;
    setSaving(true);
    setError("");
    try {
      const ownerManagerId = managerIdForName(managerOptions, draft.owner);
      const response = await fetch(`/api/customer-management/key-scenarios${editingId ? `/${editingId}` : ""}`, {
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

  const remove = async (scenario: KeyScenario) => {
    if (!onRefresh || !window.confirm(`确定删除 ${scenario.customer} / ${scenario.scenario} 吗？`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/key-scenarios/${scenario.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiMessage(response));
      await onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "删除失败。");
    } finally {
      setSaving(false);
    }
  };

  const renderFieldInput = (field: ScenarioField) => {
    if (field === "customer") {
      return (
        <>
          <input list="scenario-customers" value={draft.customer} onChange={(event) => updateDraft(field, event.target.value)} />
          <datalist id="scenario-customers">
            {customers.map((customer) => (
              <option key={customer.id} value={customer.actualCustomerName ?? customer.name} />
            ))}
          </datalist>
        </>
      );
    }

    if (field === "owner") {
      return (
        <select value={draft.owner} onChange={(event) => updateDraft(field, event.target.value)}>
          {[...new Set([...managerOptions.map((manager) => manager.name), draft.owner].filter(Boolean))].map((manager) => (
            <option key={manager}>{manager}</option>
          ))}
        </select>
      );
    }

    if (field === "nextCheckDate") {
      return <input type="date" value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} />;
    }

    const enumOptions = successPlanEnumOptions[field];
    if (enumOptions?.length) {
      const options = enumOptions.includes(draft[field]) || !draft[field] ? enumOptions : [draft[field], ...enumOptions];
      return (
        <select value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)}>
          <option value="">未选择</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (wideTextFields.includes(field)) {
      return <textarea rows={3} value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} />;
    }

    return <input value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} />;
  };

  return (
    <Panel title={title} subtitle={subtitle}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {error ? <div className="notice-line">{error}</div> : <div className="muted-text text-sm">共 {scenarios.length} 条客户成功计划</div>}
        <div className="flex gap-2">
          <button className="secondary-button" onClick={() => setShowFields((value) => !value)} type="button">
            <Settings2 size={16} />
            显示字段
          </button>
          <button className="primary-button" disabled={!canWrite || saving} onClick={openCreate} type="button">
            <Plus size={16} />
            {createLabel}
          </button>
        </div>
      </div>

      {showFields ? (
        <div className="surface-card mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {allFields.map((field) => (
            <label key={field} className="flex items-center gap-2 text-sm">
              <input checked={visibleFields.includes(field)} onChange={() => toggleField(field)} type="checkbox" />
              <span>{fieldLabels[field]}</span>
            </label>
          ))}
        </div>
      ) : null}

      {formOpen ? (
        <div className="surface-card mb-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {allFields.map((field) => (
              <label key={field} className={wideTextFields.includes(field) ? "field lg:col-span-3" : "field"}>
                <span>{fieldLabels[field]}</span>
                {renderFieldInput(field)}
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="secondary-button" disabled={saving} onClick={() => setFormOpen(false)} type="button">
              取消
            </button>
            <button className="primary-button" disabled={saving || !draft.customer || !draft.scenario || !draft.owner} onClick={save} type="button">
              保存
            </button>
          </div>
        </div>
      ) : null}

      {scenarios.length ? (
        <>
          <div ref={topScrollRef} className="table-top-scroll" onScroll={() => syncScroll("top")}>
            <div style={{ width: Math.max(orderedFields.length * 180 + 160, 1000) }} />
          </div>
          <Table scrollRef={tableScrollRef} onScroll={() => syncScroll("table")}>
            <thead>
              <tr>
                {orderedFields.map((field) => (
                  <th key={field}>{fieldLabels[field]}</th>
                ))}
                <th className="sticky-action-col">操作</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario) => (
                <tr key={scenario.id} className={rowGroups.first.has(scenario.id) ? "customer-group-start" : "customer-group-row"}>
                  {orderedFields.map((field) => {
                    if (mergeCustomerCells && field === "customer") {
                      if (rowGroups.hidden.has(scenario.id)) return null;
                      return (
                        <td key={field} rowSpan={rowGroups.spans.get(scenario.id) ?? 1} className="merged-customer-cell min-w-40 align-top">
                          {scenario.customer}
                        </td>
                      );
                    }
                    return (
                      <td key={field} className="min-w-44 align-top">
                        <ScenarioCell field={field} value={scenario[field]} />
                      </td>
                    );
                  })}
                  <td className="sticky-action-col">
                    <div className="table-actions">
                      <button className="icon-button" disabled={!canWrite || saving} onClick={() => openEdit(scenario)} title="编辑" type="button">
                        <Pencil size={15} />
                      </button>
                      <button className="icon-button danger-action" disabled={!canWrite || saving} onClick={() => remove(scenario)} title="删除" type="button">
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
