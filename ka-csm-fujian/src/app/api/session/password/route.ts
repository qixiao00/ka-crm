import { NextResponse } from "next/server";
import { getCurrentUser, getUserForLogin, makePasswordHash, verifyPassword } from "@/lib/auth";
import { getDb, hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "未登录。" }, { status: 401 });
  }

  if (!hasDatabaseConfig()) {
    return NextResponse.json({ message: "当前未配置数据库，演示模式不支持修改密码。" }, { status: 400 });
  }

  const body = (await request.json()) as { oldPassword?: string; newPassword?: string };
  const oldPassword = body.oldPassword ?? "";
  const newPassword = body.newPassword?.trim() ?? "";

  if (newPassword.length < 6) {
    return NextResponse.json({ message: "新密码至少需要 6 位。" }, { status: 400 });
  }

  const loginUser = await getUserForLogin(user.username);
  if (!loginUser || !verifyPassword(oldPassword, loginUser.passwordHash)) {
    return NextResponse.json({ message: "旧密码不正确。" }, { status: 400 });
  }

  const db = getDb();
  await db.query("UPDATE users SET password_hash = :passwordHash WHERE id = :userId", {
    passwordHash: makePasswordHash(newPassword),
    userId: user.id,
  });

  return NextResponse.json({ ok: true });
}
