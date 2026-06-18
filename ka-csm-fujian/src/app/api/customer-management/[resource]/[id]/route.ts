import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import { canWriteForManager, getCurrentUser, isPrivileged } from "@/lib/auth";
import { contactLevels, customerStatuses, riskLevels, weeklyStatuses } from "@/lib/data";
import { getDb, hasDatabaseConfig } from "@/lib/db";
import { endToEndProjectDbColumns, endToEndProjectFields } from "@/lib/project-fields";
import { serviceRenewalDbColumns, serviceRenewalFields } from "@/lib/service-renewal-fields";
import { successPlanDbColumns, successPlanFields } from "@/lib/success-plan-fields";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Resource = "customers" | "contacts" | "key-scenarios" | "end-to-end-projects" | "service-renewals" | "weekly";
type DbValue = string | number | Date | null;

type AccessRow = RowDataPacket & {
  id: number;
  manager_id: number | null;
  owner_name: string | null;
};

const supportedResources: Resource[] = ["customers", "contacts", "key-scenarios", "end-to-end-projects", "service-renewals", "weekly"];

function isOneOf<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === "string" && allowed.includes(value);
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function dateValue(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function managerIdForBody(body: Record<string, unknown>, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, fallbackId?: number | null) {
  if (isPrivileged(user) && Number.isSafeInteger(Number(body.ownerManagerId))) return Number(body.ownerManagerId);
  return user.boundManagerId ?? fallbackId ?? null;
}

async function managerNameForId(managerId: number | null) {
  if (!managerId) return "";
  const db = getDb();
  const [rows] = await db.query<(RowDataPacket & { name: string })[]>("SELECT name FROM managers WHERE id = :managerId LIMIT 1", { managerId });
  return rows[0]?.name ?? "";
}

async function getAccess(resource: Resource, id: number) {
  const db = getDb();
  const sqlByResource: Record<Resource, string> = {
    customers: `
      SELECT c.id, c.manager_id, m.name AS owner_name
      FROM customers c
      JOIN managers m ON m.id = c.manager_id
      WHERE c.id = :id
      LIMIT 1
    `,
    contacts: `
      SELECT ct.id, c.manager_id, m.name AS owner_name
      FROM contacts ct
      JOIN customers c ON c.id = ct.customer_id
      JOIN managers m ON m.id = ct.owner_manager_id
      WHERE ct.id = :id
      LIMIT 1
    `,
    weekly: `
      SELECT wt.id, c.manager_id, m.name AS owner_name
      FROM weekly_tasks wt
      JOIN customers c ON c.id = wt.customer_id
      JOIN managers m ON m.id = wt.owner_manager_id
      WHERE wt.id = :id
      LIMIT 1
    `,
    "key-scenarios": `
      SELECT ks.id, NULL AS manager_id, ks.owner_name
      FROM key_scenarios ks
      WHERE ks.id = :id
      LIMIT 1
    `,
    "end-to-end-projects": `
      SELECT ep.id, NULL AS manager_id, ep.owner_name
      FROM end_to_end_projects ep
      WHERE ep.id = :id
      LIMIT 1
    `,
    "service-renewals": `
      SELECT sr.id, NULL AS manager_id, sr.owner_name
      FROM service_renewals sr
      WHERE sr.id = :id
      LIMIT 1
    `,
  };
  const [rows] = await db.query<AccessRow[]>(sqlByResource[resource], { id });
  return rows[0] ?? null;
}

function updateSql(table: string, id: number, values: Record<string, DbValue>) {
  const assignments = Object.keys(values).map((column) => `${column} = :${column}`);
  return {
    sql: `UPDATE ${table} SET ${assignments.join(", ")} WHERE id = :id`,
    params: { ...values, id },
  };
}

async function guard(resource: Resource, id: number) {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ message: "请先登录。" }, { status: 401 }) };
  if (!hasDatabaseConfig()) return { response: NextResponse.json({ message: "当前未配置数据库，无法写入数据。" }, { status: 400 }) };
  if (!Number.isSafeInteger(id) || id <= 0) return { response: NextResponse.json({ message: "记录编号不正确。" }, { status: 400 }) };

  const access = await getAccess(resource, id);
  if (!access) return { response: NextResponse.json({ message: "记录不存在。" }, { status: 404 }) };
  if (!canWriteForManager(user, access.manager_id, access.owner_name)) {
    return { response: NextResponse.json({ message: "无权操作该记录。" }, { status: 403 }) };
  }
  return { user, access };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: rawResource, id: rawId } = await params;
  const resource = rawResource as Resource;
  if (!supportedResources.includes(resource)) {
    return NextResponse.json({ message: "不支持的资源类型。" }, { status: 400 });
  }

  const id = Number(rawId);
  const guarded = await guard(resource, id);
  if ("response" in guarded) return guarded.response;

  const body = (await request.json()) as Record<string, unknown>;
  const db = getDb();

  if (resource === "customers") {
    const managerId = managerIdForBody(body, guarded.user, guarded.access.manager_id);
    if (!managerId || !canWriteForManager(guarded.user, managerId)) {
      return NextResponse.json({ message: "无权修改为该客户经理。" }, { status: 403 });
    }
    const status = isOneOf(body.status, customerStatuses) ? body.status : "信任支持";
    const risk = isOneOf(body.risk, riskLevels) ? body.risk : "中";
    const { sql, params: updateParams } = updateSql("customers", id, {
      name: String(body.name ?? "").trim(),
      city: String(body.city ?? "").trim(),
      industry: String(body.industry ?? "").trim(),
      satisfaction_status: status,
      risk_level: risk,
      manager_id: managerId,
      break_amount: numberValue(body.breakAmount),
      renewal_amount: numberValue(body.renewalAmount),
      repurchase_amount: numberValue(body.repurchaseAmount),
      eos_amount: numberValue(body.eosAmount),
      remark: String(body.remark ?? "").trim(),
      last_updated_at: new Date(),
    });
    await db.query<ResultSetHeader>(sql, updateParams);
    return NextResponse.json({ ok: true });
  }

  if (resource === "contacts") {
    const ownerManagerId = managerIdForBody(body, guarded.user, guarded.access.manager_id);
    const level = isOneOf(body.level, contactLevels) ? body.level : "基层";
    const attitude = isOneOf(body.attitude, customerStatuses) ? body.attitude : "信任支持";
    const { sql, params: updateParams } = updateSql("contacts", id, {
      name: String(body.name ?? "").trim(),
      department: String(body.department ?? "").trim(),
      title: String(body.title ?? "").trim(),
      level,
      attitude,
      owner_manager_id: ownerManagerId,
      last_touch_date: dateValue(body.lastTouch) || null,
    });
    await db.query<ResultSetHeader>(sql, updateParams);
    return NextResponse.json({ ok: true });
  }

  if (resource === "weekly") {
    const ownerManagerId = managerIdForBody(body, guarded.user, guarded.access.manager_id);
    const planDate = dateValue(body.planDate);
    const status = isOneOf(body.status, weeklyStatuses) ? body.status : "未开始";
    if (!planDate) return NextResponse.json({ message: "预计完成日期不正确。" }, { status: 400 });
    const { sql, params: updateParams } = updateSql("weekly_tasks", id, {
      title: String(body.title ?? "").trim(),
      owner_manager_id: ownerManagerId,
      plan_date: planDate,
      status,
      result_note: String(body.resultNote ?? "").trim(),
    });
    await db.query<ResultSetHeader>(sql, updateParams);
    return NextResponse.json({ ok: true });
  }

  if (resource === "key-scenarios") {
    const ownerManagerId = managerIdForBody(body, guarded.user);
    const owner = isPrivileged(guarded.user) ? String(body.owner ?? (await managerNameForId(ownerManagerId))).trim() : guarded.user.boundManagerName ?? "";
    if (!canWriteForManager(guarded.user, ownerManagerId, owner)) return NextResponse.json({ message: "无权修改为该经理。" }, { status: 403 });
    const values = Object.fromEntries(
      successPlanFields.map((field) => [successPlanDbColumns[field], String(body[field] ?? "").trim()]),
    );
    const { sql, params: updateParams } = updateSql("key_scenarios", id, {
      ...values,
      owner_name: owner,
      last_updated_at: new Date().toISOString().slice(0, 10),
    });
    await db.query<ResultSetHeader>(sql, updateParams);
    return NextResponse.json({ ok: true });
  }

  if (resource === "end-to-end-projects") {
    const ownerManagerId = managerIdForBody(body, guarded.user);
    const owner = isPrivileged(guarded.user) ? String(body.owner ?? (await managerNameForId(ownerManagerId))).trim() : guarded.user.boundManagerName ?? "";
    if (!canWriteForManager(guarded.user, ownerManagerId, owner)) return NextResponse.json({ message: "无权修改为该负责人。" }, { status: 403 });
    const values = Object.fromEntries(
      endToEndProjectFields.map((field) => [endToEndProjectDbColumns[field], String(body[field] ?? "").trim()]),
    );
    const { sql, params: updateParams } = updateSql("end_to_end_projects", id, {
      ...values,
      owner_name: owner,
      last_updated_at: new Date().toISOString().slice(0, 10),
    });
    await db.query<ResultSetHeader>(sql, updateParams);
    return NextResponse.json({ ok: true });
  }

  const ownerManagerId = managerIdForBody(body, guarded.user);
  const owner = isPrivileged(guarded.user) ? String(body.owner ?? (await managerNameForId(ownerManagerId))).trim() : guarded.user.boundManagerName ?? "";
  if (!canWriteForManager(guarded.user, ownerManagerId, owner)) return NextResponse.json({ message: "无权修改为该经理。" }, { status: 403 });
  const values = Object.fromEntries(
    serviceRenewalFields.map((field) => {
      const column = serviceRenewalDbColumns[field];
      const isText = field === "customerName" || field === "owner" || field === "managementSheet";
      return [column, isText ? String(body[field] ?? "").trim() : numberValue(body[field])];
    }),
  );
  const { sql, params: updateParams } = updateSql("service_renewals", id, {
    ...values,
    owner_name: owner,
    last_updated_at: new Date().toISOString().slice(0, 10),
  });
  await db.query<ResultSetHeader>(sql, updateParams);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: rawResource, id: rawId } = await params;
  const resource = rawResource as Resource;
  if (!supportedResources.includes(resource)) {
    return NextResponse.json({ message: "不支持的资源类型。" }, { status: 400 });
  }

  const id = Number(rawId);
  const guarded = await guard(resource, id);
  if ("response" in guarded) return guarded.response;

  const tableByResource: Record<Resource, string> = {
    customers: "customers",
    contacts: "contacts",
    "key-scenarios": "key_scenarios",
    "end-to-end-projects": "end_to_end_projects",
    "service-renewals": "service_renewals",
    weekly: "weekly_tasks",
  };
  await getDb().query<ResultSetHeader>(`DELETE FROM ${tableByResource[resource]} WHERE id = :id`, { id });
  return NextResponse.json({ ok: true });
}
