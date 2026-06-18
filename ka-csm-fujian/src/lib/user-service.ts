import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getFallbackUsers, makePasswordHash, type AuthUser, type UserRole } from "./auth";
import { managerPhones } from "./data";
import { getDb, hasDatabaseConfig } from "./db";

export type UserAccount = {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  roleLabel: string;
  manager: string | null;
  managerId: number | null;
  phone: string | null;
  enabled: boolean;
};

export type ManagerOption = {
  id: number;
  name: string;
};

type UserAccountRow = RowDataPacket & {
  id: number;
  username: string;
  display_name: string;
  role: UserRole;
  phone: string | null;
  enabled: 0 | 1;
  bound_manager_id: number | null;
  manager_name: string | null;
};

type ManagerRow = RowDataPacket & {
  id: number;
  name: string;
};

export function roleLabel(role: UserRole) {
  if (role === "admin") return "管理员";
  if (role === "supervisor") return "大客户服务主管";
  return "大客户服务经理";
}

function mapAccount(row: UserAccountRow): UserAccount {
  return {
    id: row.id,
    name: row.display_name,
    username: row.username,
    role: row.role,
    roleLabel: roleLabel(row.role),
    manager: row.manager_name,
    managerId: row.bound_manager_id,
    phone: row.phone,
    enabled: Boolean(row.enabled),
  };
}

export async function getManagerRows(scopedUser?: AuthUser) {
  if (!hasDatabaseConfig()) {
    return getFallbackUsers()
      .filter((user) => scopedUser?.role !== "manager" || user.boundManagerId === scopedUser.boundManagerId)
      .map<ManagerRow>((user) => ({ id: user.boundManagerId ?? user.id, name: user.boundManagerName ?? user.displayName } as ManagerRow));
  }

  const db = getDb();
  const where = scopedUser?.role === "manager" ? "WHERE id = :managerId" : "";
  const [rows] = await db.query<ManagerRow[]>(
    `
      SELECT id, name
      FROM managers
      ${where}
      ORDER BY id
    `,
    { managerId: scopedUser?.boundManagerId ?? 0 },
  );

  return rows;
}

export async function getUserAccounts(): Promise<UserAccount[]> {
  if (!hasDatabaseConfig()) {
    return getFallbackUsers().map((user) => ({
      id: user.id,
      name: user.displayName,
      username: user.username,
      role: user.role,
      roleLabel: roleLabel(user.role),
      manager: user.boundManagerName,
      managerId: user.boundManagerId,
      phone: user.phone,
      enabled: user.enabled,
    }));
  }

  const db = getDb();
  const [rows] = await db.query<UserAccountRow[]>(`
    SELECT
      u.id,
      u.username,
      u.display_name,
      u.role,
      u.phone,
      u.enabled,
      u.bound_manager_id,
      m.name AS manager_name
    FROM users u
    LEFT JOIN managers m ON m.id = u.bound_manager_id
    ORDER BY FIELD(u.role, 'admin', 'supervisor', 'manager'), m.id, u.id
  `);

  return rows.map(mapAccount);
}

export async function ensureManagerAccounts() {
  if (!hasDatabaseConfig()) {
    throw new Error("当前未配置数据库，无法写入账号。");
  }

  const db = getDb();
  const cases = Object.entries(managerPhones)
    .map(([name, phone]) => `WHEN '${name}' THEN '${phone}'`)
    .join("\n          ");
  const managedNames = Object.keys(managerPhones).map((name) => `'${name}'`).join(", ");

  const [result] = await db.query<ResultSetHeader>(
    `
      INSERT INTO users (username, display_name, password_hash, role, phone, enabled, bound_manager_id)
      SELECT
        CASE m.name
          ${cases}
          ELSE m.phone
        END,
        m.name,
        :passwordHash,
        CASE WHEN m.name = '林喆' THEN 'supervisor' ELSE 'manager' END,
        CASE m.name
          ${cases}
          ELSE m.phone
        END,
        1,
        m.id
      FROM managers m
      WHERE m.name IN (${managedNames})
        AND NOT EXISTS (
          SELECT 1
          FROM users u
          WHERE u.bound_manager_id = m.id
        )
    `,
    { passwordHash: makePasswordHash("123456") },
  );

  return result.affectedRows;
}

export async function createUserAccount(input: {
  username: string;
  displayName: string;
  role: UserRole;
  phone?: string | null;
  password?: string;
  boundManagerId?: number | null;
}) {
  if (!hasDatabaseConfig()) {
    throw new Error("当前未配置数据库，无法写入账号。");
  }

  const username = input.username.trim();
  const displayName = input.displayName.trim();
  const phone = input.phone?.trim() || null;
  const password = input.password?.trim() || "123456";
  const boundManagerId = input.role === "manager" || input.role === "supervisor" ? input.boundManagerId : null;

  if (!username || !displayName) {
    throw new Error("账号和姓名不能为空。");
  }

  if (!["admin", "supervisor", "manager"].includes(input.role)) {
    throw new Error("账号类型不正确。");
  }

  if ((input.role === "manager" || input.role === "supervisor") && !boundManagerId) {
    throw new Error("经理或主管账号必须绑定服务经理。");
  }

  const db = getDb();
  await db.query<ResultSetHeader>(
    `
      INSERT INTO users (username, display_name, password_hash, role, phone, enabled, bound_manager_id)
      VALUES (:username, :displayName, :passwordHash, :role, :phone, 1, :boundManagerId)
    `,
    {
      username,
      displayName,
      passwordHash: makePasswordHash(password),
      role: input.role,
      phone,
      boundManagerId,
    },
  );
}

export async function updateUserAccount(
  userId: number,
  input: {
    enabled?: boolean;
    password?: string;
  },
  currentUser: AuthUser,
) {
  if (!hasDatabaseConfig()) {
    throw new Error("当前未配置数据库，无法写入账号。");
  }

  const updates: string[] = [];
  const params: Record<string, string | number | boolean> = { userId };

  if (typeof input.enabled === "boolean") {
    if (userId === currentUser.id && !input.enabled) {
      throw new Error("不能停用当前登录账号。");
    }

    updates.push("enabled = :enabled");
    params.enabled = input.enabled ? 1 : 0;
  }

  if (input.password?.trim()) {
    updates.push("password_hash = :passwordHash");
    params.passwordHash = makePasswordHash(input.password.trim());
  }

  if (!updates.length) return;

  const db = getDb();
  await db.query<ResultSetHeader>(
    `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = :userId
    `,
    params,
  );
}
