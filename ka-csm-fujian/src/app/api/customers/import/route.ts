import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentUser, isPrivileged } from "@/lib/auth";
import { getDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ManagerRow = RowDataPacket & {
  id: number;
  name: string;
};

const statuses = new Set(["充分信赖", "信任支持", "价值无感", "不够满意", "严重不满"]);
const risks = new Set(["低", "中", "高"]);

function text(value: unknown) {
  return String(value ?? "").trim();
}

function amount(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "未登录。" }, { status: 401 });
  if (!hasDatabaseConfig()) return NextResponse.json({ message: "当前未连接数据库。" }, { status: 400 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ message: "请选择 Excel 文件。" }, { status: 400 });

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!rows.length) return NextResponse.json({ message: "Excel 中没有可导入的数据。" }, { status: 400 });

  const db = getDb();
  const [managerRows] = await db.query<ManagerRow[]>("SELECT id, name FROM managers WHERE enabled = 1");
  const managerMap = new Map(managerRows.map((manager) => [manager.name, manager.id]));
  let imported = 0;

  for (const row of rows) {
    const name = text(row["客户名称"]);
    if (!name) continue;

    const requestedManager = text(row["服务经理"]);
    const managerId = isPrivileged(user) ? managerMap.get(requestedManager) : user.boundManagerId;
    if (!managerId) continue;

    const status = text(row["满意度状态"]);
    const risk = text(row["风险"]);
    const [result] = await db.query<ResultSetHeader>(
      `
        INSERT INTO customers
          (name, city, industry, satisfaction_status, risk_level, manager_id, break_amount, renewal_amount, repurchase_amount, eos_amount, remark, last_updated_at)
        VALUES
          (:name, :city, :industry, :status, :risk, :managerId, :breakAmount, :renewalAmount, :repurchaseAmount, :eosAmount, :remark, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          city = VALUES(city),
          industry = VALUES(industry),
          satisfaction_status = VALUES(satisfaction_status),
          risk_level = VALUES(risk_level),
          manager_id = VALUES(manager_id),
          break_amount = VALUES(break_amount),
          renewal_amount = VALUES(renewal_amount),
          repurchase_amount = VALUES(repurchase_amount),
          eos_amount = VALUES(eos_amount),
          remark = VALUES(remark),
          last_updated_at = CURRENT_TIMESTAMP
      `,
      {
        name,
        city: text(row["城市"]),
        industry: text(row["行业"]),
        status: statuses.has(status) ? status : "价值无感",
        risk: risks.has(risk) ? risk : "中",
        managerId,
        breakAmount: amount(row["突破金额"]),
        renewalAmount: amount(row["续费金额"]),
        repurchaseAmount: amount(row["复购金额"]),
        eosAmount: amount(row["EOS金额"]),
        remark: text(row["备注"]),
      },
    );

    const customerId = result.insertId || (await db.query<RowDataPacket[]>("SELECT id FROM customers WHERE name = :name", { name }))[0][0]?.id;
    if (customerId) {
      await db.query("DELETE FROM customer_branches WHERE customer_id = :customerId", { customerId });
      for (const branch of text(row["分支单位"]).split(/[；;\n]/).map((item) => item.trim()).filter(Boolean)) {
        await db.query("INSERT INTO customer_branches (customer_id, branch_name) VALUES (:customerId, :branch)", {
          customerId,
          branch,
        });
      }
    }

    imported += 1;
  }

  return NextResponse.json({ ok: true, imported });
}
