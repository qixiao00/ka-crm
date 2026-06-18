"use client";

import { Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { Panel } from "@/components/common/Panel";
import { Table } from "@/components/common/Table";
import type { Customer, Project } from "@/lib/data";
import {
  endToEndProjectEnumFields,
  endToEndProjectEnumOptions,
  endToEndProjectFieldLabels,
  endToEndProjectFields,
  getProjectEnumTone,
  type EndToEndProjectField,
} from "@/lib/project-fields";
import type { ManagerOption } from "@/lib/user-service";

type ProjectDraft = Record<EndToEndProjectField, string>;

const defaultVisibleFields: EndToEndProjectField[] = [
  "region",
  "groupCustomer",
  "secondaryUnit",
  "owner",
  "projectName",
  "solution",
  "product",
  "projectLevel",
  "productionStage",
  "projectProgress",
  "satisfactionRisk",
  "businessValue",
  "latestRecognition",
  "slaAchieved",
  "redundancyEffective",
  "knownRiskCleared",
  "nextFocus",
];

const wideTextFields: EndToEndProjectField[] = [
  "projectBackground",
  "keyRemark",
  "nextFocus",
  "projectControlRemark",
  "atxReviewMaterial",
  "pocRemark",
  "pocReviewMaterial",
  "startupRemark",
  "requirementMaterial",
  "hldMaterial",
  "externalKickoffMaterial",
  "projectManagementMaterial",
  "prrMaterial",
  "stageValueMaterial",
  "valueMaterial",
  "opsHandoverMaterial",
  "executiveReviewMaterial",
  "continuedExpansionRemark",
];

function emptyDraft(customers: Customer[], managerOptions: ManagerOption[]): ProjectDraft {
  const firstCustomer = customers[0];
  const draft = Object.fromEntries(endToEndProjectFields.map((field) => [field, ""])) as ProjectDraft;
  draft.region = "福建";
  draft.groupCustomer = firstCustomer?.actualCustomerName ?? firstCustomer?.name ?? "";
  draft.secondaryUnit = firstCustomer?.secondaryUnitName ?? "";
  draft.owner = firstCustomer?.manager ?? managerOptions[0]?.name ?? "";
  return draft;
}

function toDraft(project: Project): ProjectDraft {
  return Object.fromEntries(endToEndProjectFields.map((field) => [field, String(project[field] ?? "")])) as ProjectDraft;
}

function managerIdForName(managerOptions: ManagerOption[], name: string) {
  return managerOptions.find((manager) => manager.name === name)?.id;
}

async function readApiMessage(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  return data.message || "请求失败。";
}

function ProjectCell({ field, value }: { field: EndToEndProjectField; value: string }) {
  if (!value) return <>-</>;
  if (!endToEndProjectEnumFields.includes(field)) return <>{value}</>;
  return <span className={`enum-pill enum-pill-${getProjectEnumTone(value)}`}>{value}</span>;
}

export function ProjectsView({
  embedded = false,
  projects,
  customers = [],
  managerOptions = [],
  onRefresh,
}: {
  embedded?: boolean;
  projects: Project[];
  customers?: Customer[];
  managerOptions?: ManagerOption[];
  onRefresh?: () => Promise<void>;
}) {
  const [showFields, setShowFields] = useState(false);
  const [visibleFields, setVisibleFields] = useState<EndToEndProjectField[]>(defaultVisibleFields);
  const [draft, setDraft] = useState<ProjectDraft>(() => emptyDraft(customers, managerOptions));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const orderedVisibleFields = useMemo(
    () => endToEndProjectFields.filter((field) => visibleFields.includes(field)),
    [visibleFields],
  );
  const canWrite = Boolean(onRefresh);

  const syncScroll = (source: "top" | "table") => {
    const top = topScrollRef.current;
    const table = tableScrollRef.current;
    if (!top || !table) return;
    if (source === "top") table.scrollLeft = top.scrollLeft;
    else top.scrollLeft = table.scrollLeft;
  };

  const toggleField = (field: EndToEndProjectField) => {
    setVisibleFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]));
  };

  const updateDraft = (field: EndToEndProjectField, value: string) => {
    if (field === "groupCustomer") {
      const matchedCustomer = customers.find((customer) => customer.name === value || customer.actualCustomerName === value);
      setDraft((current) => ({
        ...current,
        groupCustomer: value,
        secondaryUnit: current.secondaryUnit || matchedCustomer?.secondaryUnitName || "",
        owner: matchedCustomer?.manager || current.owner,
      }));
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

  const openEdit = (project: Project) => {
    setError("");
    setEditingId(project.id);
    setDraft(toDraft(project));
    setFormOpen(true);
  };

  const save = async () => {
    if (!onRefresh) return;
    setSaving(true);
    setError("");
    try {
      const ownerManagerId = managerIdForName(managerOptions, draft.owner);
      const response = await fetch(`/api/customer-management/end-to-end-projects${editingId ? `/${editingId}` : ""}`, {
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

  const remove = async (project: Project) => {
    if (!onRefresh || !window.confirm(`确定删除 ${project.projectName || project.groupCustomer} 的项目记录吗？`)) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/customer-management/end-to-end-projects/${project.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiMessage(response));
      await onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "删除失败。");
    } finally {
      setSaving(false);
    }
  };

  const renderFieldInput = (field: EndToEndProjectField) => {
    if (field === "owner") {
      return (
        <select value={draft.owner} onChange={(event) => updateDraft("owner", event.target.value)}>
          {[...new Set([...managerOptions.map((manager) => manager.name), draft.owner].filter(Boolean))].map((manager) => (
            <option key={manager}>{manager}</option>
          ))}
        </select>
      );
    }

    if (field === "groupCustomer" || field === "secondaryUnit") {
      const listId = field === "groupCustomer" ? "project-group-customers" : "project-secondary-units";
      return (
        <>
          <input list={listId} value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} />
          <datalist id={listId}>
            {customers.map((customer) => (
              <option key={`${field}-${customer.id}`} value={field === "groupCustomer" ? customer.actualCustomerName ?? customer.name : customer.secondaryUnitName || customer.name} />
            ))}
          </datalist>
        </>
      );
    }

    if (field === "nextFollowDate") {
      return <input type="date" value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} />;
    }

    const enumOptions = endToEndProjectEnumOptions[field];
    if (enumOptions?.length) {
      return (
        <select value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)}>
          <option value="">未选择</option>
          {enumOptions.map((option) => (
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
    <Panel
      title={embedded ? "项目管理" : "端到端项目管理"}
      subtitle="按端到端项目管理工作表展示项目阶段、风险、价值兑现、关键人认可和下一步动作。"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {error ? <div className="notice-line">{error}</div> : <div className="muted-text text-sm">共 {projects.length} 个项目</div>}
        <div className="flex gap-2">
          <button className="secondary-button" onClick={() => setShowFields((value) => !value)} type="button">
            <Settings2 size={16} />
            显示字段
          </button>
          <button className="primary-button" disabled={!canWrite || saving} onClick={openCreate} type="button">
            <Plus size={16} />
            新增项目
          </button>
        </div>
      </div>

      {showFields ? (
        <div className="surface-card mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {endToEndProjectFields.map((field) => (
            <label key={field} className="flex items-center gap-2 text-sm">
              <input checked={visibleFields.includes(field)} onChange={() => toggleField(field)} type="checkbox" />
              <span>{endToEndProjectFieldLabels[field]}</span>
            </label>
          ))}
        </div>
      ) : null}

      {formOpen ? (
        <div className="surface-card mb-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {endToEndProjectFields.map((field) => (
              <label key={field} className={wideTextFields.includes(field) ? "field lg:col-span-3" : "field"}>
                <span>{endToEndProjectFieldLabels[field]}</span>
                {renderFieldInput(field)}
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="secondary-button" disabled={saving} onClick={() => setFormOpen(false)} type="button">
              取消
            </button>
            <button className="primary-button" disabled={saving || !draft.groupCustomer || !draft.projectName || !draft.owner} onClick={save} type="button">
              保存
            </button>
          </div>
        </div>
      ) : null}

      {projects.length ? (
        <>
          <div ref={topScrollRef} className="table-top-scroll" onScroll={() => syncScroll("top")}>
            <div style={{ width: Math.max(orderedVisibleFields.length * 180 + 160, 1000) }} />
          </div>
          <Table scrollRef={tableScrollRef} onScroll={() => syncScroll("table")}>
            <thead>
              <tr>
                {orderedVisibleFields.map((field) => (
                  <th key={field}>{endToEndProjectFieldLabels[field]}</th>
                ))}
                <th className="sticky-action-col">操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  {orderedVisibleFields.map((field) => (
                    <td key={field} className="min-w-44 align-top">
                      <ProjectCell field={field} value={project[field]} />
                    </td>
                  ))}
                  <td className="sticky-action-col">
                    <div className="table-actions">
                      <button className="icon-button" disabled={!canWrite || saving} onClick={() => openEdit(project)} title="编辑" type="button">
                        <Pencil size={15} />
                      </button>
                      <button className="icon-button danger-action" disabled={!canWrite || saving} onClick={() => remove(project)} title="删除" type="button">
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
