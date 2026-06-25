import { NextResponse } from "next/server";
import { getUserForLogin, publicUser, setSessionCookie, verifyPassword } from "@/lib/auth";
import { hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";

    const user = await getUserForLogin(username);
    if (!user || !user.enabled || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ message: "账号或密码不正确。" }, { status: 401 });
    }

    const response = NextResponse.json({
      user: publicUser(user),
      source: hasDatabaseConfig() ? "database" : "static",
    });
    setSessionCookie(response, user.id, request);
    return response;
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "登录失败。" },
      { status: 500 },
    );
  }
}
