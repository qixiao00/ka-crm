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
type DbValue = string | number | null;

type CustomerAccessRow = RowDataPacket & {
  id: number;
  name: string;
  manager_id: number;
  manager_name: string;
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

async function getAllowedCustomer(customerId: number, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  if (!Number.isSafeInteger(customerId)) return null;

  const db = getDb();
  const [rows] = await db.query<CustomerAccessRow[]>(
    `
      SELECT c.id, c.name, c.manager_id, m.name AS manager_name
      FROM customers c
      JOIN managers m ON m.id = c.manager_id
      WHERE c.id = :customerId
      LIMIT 1
    `,
    { customerId },
  );
  const customer = rows[0];
  if (!customer) return null;
  if (!canWriteForManager(user, customer.manager_id, customer.manager_name)) return null;
  return customer;
}

function managerIdForBody(body: Record<string, unknown>, user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, fallbackId?: number) {
  if (isPrivileged(user) && Number.isSafeInteger(Number(body.ownerManagerId))) return Number(body.ownerManagerId);
  return user.boundManagerId ?? fallbackId ?? null;
}

async function managerNameForId(managerId: number | null) {
  if (!managerId) return "";
  const db = getDb();
  const [rows] = await db.query<(RowDataPacket & { name: string })[]>("SELECT name FROM managers WHERE id = :managerId LIMIT 1", { managerId });
  return rows[0]?.name ?? "";
}

function makeInsert(table: string, values: Record<string, DbValue>) {
  const columns = Object.keys(values);
  const placeholders = columns.map((column) => `:${column}`).join(", ");
  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    params: values,
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "请先登录。" }, { status: 401 });
  if (!hasDatabaseConfig()) return NextResponse.json({ message: "当前未配置数据库，无法写入数据。" }, { status: 400 });

  const { resource: rawResource } = await params;
  const resource = rawResource as Resource;
  if (!supportedResources.includes(resource)) {
    return NextResponse.json({ message: "不支持的资源类型。" }, { status: 400 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const db = getDb();

  if (resource === "customers") {
    const name = String(body.name ?? "").trim();
    const managerId = managerIdForBody(body, user);
    if (!name || !managerId) return NextResponse.json({ message: "客户名称和客户经理不能为空。" }, { status: 400 });
    if (!canWriteForManager(user, managerId)) return NextResponse.json({ message: "无权为该经理新增客户。" }, { status: 403 });

    const status = isOneOf(body.status, customerStatuses) ? body.status : "信任支持";
    const risk = isOneOf(body.risk, riskLevels) ? body.risk : "中";
    const [result] = await db.query<ResultSetHeader>(
      `
        INSERT INTO customers
          (name, city, industry, satisfaction_status, risk_level, manager_id, break_amount, renewal_amount, repurchase_amount, eos_amount, remark, last_updated_at)
        VALUES
          (:name, :city, :industry, :status, :risk, :managerId, :breakAmount, :renewalAmount, :repurchaseAmount, :eosAmount, :remark, NOW())
      `,
      {
        name,
        city: String(body.city ?? "").trim(),
        industry: String(body.industry ?? "").trim(),
        status,
        risk,
        managerId,
        breakAmount: numberValue(body.breakAmount),
        renewalAmount: numberValue(body.renewalAmount),
        repurchaseAmount: numberValue(body.repurchaseAmount),
        eosAmount: numberValue(body.eosAmount),
        remark: String(body.remark ?? "").trim(),
      },
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  }

  if (resource === "contacts") {
    const customer = await getAllowedCustomer(Number(body.customerId), user);
    if (!customer) return NextResponse.json({ message: "无权为该客户新增关键人。" }, { status: 403 });

    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ message: "关键人姓名不能为空。" }, { status: 400 });

    const ownerManagerId = managerIdForBody(body, user, customer.manager_id) ?? customer.manager_id;
    const level = isOneOf(body.level, contactLevels) ? body.level : "基层";
    const attitude = isOneOf(body.attitude, customerStatuses) ? body.attitude : "信任支持";
    const [result] = await db.query<ResultSetHeader>(
      `
        INSERT INTO contacts
          (customer_id, name, department, title, level, attitude, owner_manager_id, last_touch_date)
        VALUES
          (:customerId, :name, :department, :title, :level, :attitude, :ownerManagerId, :lastTouch)
      `,
      {
        customerId: customer.id,
        name,
        department: String(body.department ?? "").trim(),
        title: String(body.title ?? "").trim(),
        level,
        attitude,
        ownerManagerId,
        lastTouch: dateValue(body.lastTouch) || new Date().toISOString().slice(0, 10),
      },
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  }

  if (resource === "weekly") {
    const customer = await getAllowedCustomer(Number(body.customerId), user);
    if (!customer) return NextResponse.json({ message: "无权为该客户新增周工作。" }, { status: 403 });

    const title = String(body.title ?? "").trim();
    const planDate = dateValue(body.planDate);
    if (!title || !planDate) return NextResponse.json({ message: "工作计划和预计完成日期不能为空。" }, { status: 400 });

    const ownerManagerId = managerIdForBody(body, user, customer.manager_id) ?? customer.manager_id;
    const status = isOneOf(body.status, weeklyStatuses) ? body.status : "未开始";
    const [result] = await db.query<ResultSetHeader>(
      `
        INSERT INTO weekly_tasks
          (customer_id, title, owner_manager_id, source, plan_date, status, result_note)
        VALUES
          (:customerId, :title, :ownerManagerId, '主管安排', :planDate, :status, :resultNote)
      `,
      {
        customerId: customer.id,
        title,
        ownerManagerId,
        planDate,
        status,
        resultNote: String(body.resultNote ?? "").trim(),
      },
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  }

  if (resource === "key-scenarios") {
    const ownerManagerId = managerIdForBody(body, user);
    const owner = isPrivileged(user) ? String(body.owner ?? (await managerNameForId(ownerManagerId))).trim() : user.boundManagerName ?? "";
    const customer = String(body.customer ?? "").trim();
    const scenario = String(body.scenario ?? "").trim();
    if (!customer || !scenario || !owner) return NextResponse.json({ message: "客户、项目场景和服务经理不能为空。" }, { status: 400 });
    if (!canWriteForManager(user, ownerManagerId, owner)) return NextResponse.json({ message: "无权为该经理新增客户成功计划。" }, { status: 403 });

    const values = Object.fromEntries(
      successPlanFields.map((field) => [successPlanDbColumns[field], String(body[field] ?? "").trim()]),
    );
    const { sql, params: insertParams } = makeInsert("key_scenarios", {
      ...values,
      customer_name: customer,
      scenario_name: scenario,
      owner_name: owner,
      last_updated_at: new Date().toISOString().slice(0, 10),
    });
    const [result] = await db.query<ResultSetHeader>(sql, insertParams);
    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  }

  if (resource === "end-to-end-projects") {
    const ownerManagerId = managerIdForBody(body, user);
    const owner = isPrivileged(user) ? String(body.owner ?? (await managerNameForId(ownerManagerId))).trim() : user.boundManagerName ?? "";
    const groupCustomer = String(body.groupCustomer ?? "").trim();
    const projectName = String(body.projectName ?? "").trim();
    if (!groupCustomer || !projectName || !owner) return NextResponse.json({ message: "集团客户、项目名称和负责人不能为空。" }, { status: 400 });
    if (!canWriteForManager(user, ownerManagerId, owner)) return NextResponse.json({ message: "无权为该负责人新增项目。" }, { status: 403 });

    const values = Object.fromEntries(
      endToEndProjectFields.map((field) => [endToEndProjectDbColumns[field], String(body[field] ?? "").trim()]),
    );
    const { sql, params: insertParams } = makeInsert("end_to_end_projects", {
      ...values,
      group_customer: groupCustomer,
      project_name: projectName,
      owner_name: owner,
      last_updated_at: new Date().toISOString().slice(0, 10),
    });
    const [result] = await db.query<ResultSetHeader>(sql, insertParams);
    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  }

  const ownerManagerId = managerIdForBody(body, user);
  const owner = isPrivileged(user) ? String(body.owner ?? (await managerNameForId(ownerManagerId))).trim() : user.boundManagerName ?? "";
  const customerName = String(body.customerName ?? "").trim();
  if (!customerName || !owner) return NextResponse.json({ message: "客户名称和服务经理不能为空。" }, { status: 400 });
  if (!canWriteForManager(user, ownerManagerId, owner)) return NextResponse.json({ message: "无权为该经理新增服务续费记录。" }, { status: 403 });

  const values = Object.fromEntries(
    serviceRenewalFields.map((field) => {
      const column = serviceRenewalDbColumns[field];
      const isText = field === "customerName" || field === "owner" || field === "managementSheet";
      return [column, isText ? String(body[field] ?? "").trim() : numberValue(body[field])];
    }),
  );
  const { sql, params: insertParams } = makeInsert("service_renewals", {
    ...values,
    customer_name: customerName,
    owner_name: owner,
    last_updated_at: new Date().toISOString().slice(0, 10),
  });
  const [result] = await db.query<ResultSetHeader>(sql, insertParams);
  return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
}
