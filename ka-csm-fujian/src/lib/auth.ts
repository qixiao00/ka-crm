import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { managerPhones, managers as staticManagers } from "./data";
import { getDb, hasDatabaseConfig } from "./db";

export type UserRole = "admin" | "supervisor" | "manager";

export type AuthUser = {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
  phone: string | null;
  enabled: boolean;
  boundManagerId: number | null;
  boundManagerName: string | null;
};

type UserRow = RowDataPacket & {
  id: number;
  username: string;
  display_name: string;
  password_hash: string;
  role: UserRole;
  phone: string | null;
  enabled: 0 | 1;
  bound_manager_id: number | null;
  bound_manager_name: string | null;
};

export type LoginUser = AuthUser & {
  passwordHash: string;
};

export const SESSION_COOKIE = "ka_csm_session";

function getSessionSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "ka-csm-fujian-dev-secret";
}

function signUserId(userId: number) {
  return createHmac("sha256", getSessionSecret()).update(String(userId)).digest("base64url");
}

function createSessionToken(userId: number) {
  return `${userId}.${signUserId(userId)}`;
}

function readSessionToken(token: string | undefined) {
  if (!token) return null;

  const [rawUserId, signature] = token.split(".");
  const userId = Number(rawUserId);
  if (!Number.isSafeInteger(userId) || !signature) return null;

  const expected = signUserId(userId);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;

  return timingSafeEqual(actualBuffer, expectedBuffer) ? userId : null;
}

function mapUserRow(row: UserRow): LoginUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role,
    phone: row.phone,
    enabled: Boolean(row.enabled),
    boundManagerId: row.bound_manager_id,
    boundManagerName: row.bound_manager_name,
    passwordHash: row.password_hash,
  };
}

export function makePasswordHash(password: string) {
  return `plain:${password}`;
}

export function verifyPassword(password: string, storedHash: string) {
  if (!password || !storedHash) return false;
  if (storedHash === "replace-with-bcrypt-hash") return password === "123456";
  if (storedHash.startsWith("plain:")) return storedHash.slice("plain:".length) === password;
  if (storedHash.startsWith("sha256:")) {
    const expected = storedHash.slice("sha256:".length);
    const actual = createHash("sha256").update(password).digest("hex");
    return expected === actual;
  }
  return storedHash === password;
}

export function isPrivileged(user: AuthUser) {
  return user.role === "admin" || user.role === "supervisor";
}

export function canViewAllData(user: AuthUser) {
  return user.role === "admin" || user.role === "supervisor";
}

export function canManageUsers(user: AuthUser) {
  return user.role === "admin" || user.role === "supervisor";
}

export function canWriteForManager(user: AuthUser, managerId: number | null | undefined, managerName?: string | null) {
  if (user.role === "admin" || user.role === "supervisor") return true;
  if (!user.boundManagerId) return false;
  return managerId === user.boundManagerId || Boolean(managerName && managerName === user.boundManagerName);
}

export function publicUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    phone: user.phone,
    enabled: user.enabled,
    boundManagerId: user.boundManagerId,
    boundManagerName: user.boundManagerName,
  };
}

export function getFallbackUsers(): LoginUser[] {
  return staticManagers.filter((manager) => managerPhones[manager]).map<LoginUser>((manager, index) => {
    const username = managerPhones[manager];
    return {
      id: index + 1,
      username,
      displayName: manager,
      role: manager === "林喆" ? "supervisor" : "manager",
      phone: username,
      enabled: true,
      boundManagerId: index + 1,
      boundManagerName: manager,
      passwordHash: makePasswordHash("123456"),
    };
  });
}

export async function getUserForLogin(username: string) {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) return null;

  if (!hasDatabaseConfig()) {
    return getFallbackUsers().find((user) => user.username === normalizedUsername) ?? null;
  }

  const db = getDb();
  const [rows] = await db.query<UserRow[]>(
    `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.password_hash,
        u.role,
        u.phone,
        u.enabled,
        u.bound_manager_id,
        m.name AS bound_manager_name
      FROM users u
      LEFT JOIN managers m ON m.id = u.bound_manager_id
      WHERE u.username = :username
      LIMIT 1
    `,
    { username: normalizedUsername },
  );

  return rows[0] ? mapUserRow(rows[0]) : null;
}

export async function getUserById(userId: number): Promise<AuthUser | null> {
  if (!hasDatabaseConfig()) {
    const user = getFallbackUsers().find((item) => item.id === userId);
    return user ? publicUser(user) : null;
  }

  const db = getDb();
  const [rows] = await db.query<UserRow[]>(
    `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.password_hash,
        u.role,
        u.phone,
        u.enabled,
        u.bound_manager_id,
        m.name AS bound_manager_name
      FROM users u
      LEFT JOIN managers m ON m.id = u.bound_manager_id
      WHERE u.id = :userId
      LIMIT 1
    `,
    { userId },
  );

  return rows[0] ? publicUser(mapUserRow(rows[0])) : null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  const user = await getUserById(userId);
  if (!user?.enabled) return null;

  return user;
}

export function setSessionCookie(response: NextResponse, userId: number) {
  response.cookies.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.AUTH_COOKIE_SECURE === "true",
    path: "/",
    maxAge: 0,
  });
}
