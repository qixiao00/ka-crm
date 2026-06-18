import { NextResponse } from "next/server";
import { getCurrentUser, isPrivileged, type UserRole } from "@/lib/auth";
import { createUserAccount, ensureManagerAccounts, getManagerRows, getUserAccounts } from "@/lib/user-service";
import { hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireManagerAccess() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: NextResponse.json({ message: "未登录。" }, { status: 401 }) };
  if (!isPrivileged(user)) return { user: null, response: NextResponse.json({ message: "无账号管理权限。" }, { status: 403 }) };
  return { user, response: null };
}

export async function GET() {
  const { response } = await requireManagerAccess();
  if (response) return response;

  return NextResponse.json({
    source: hasDatabaseConfig() ? "database" : "static",
    managers: await getManagerRows(),
    users: await getUserAccounts(),
  });
}

export async function POST(request: Request) {
  const { response } = await requireManagerAccess();
  if (response) return response;

  try {
    const body = (await request.json()) as {
      action?: "ensure-managers" | "create";
      username?: string;
      displayName?: string;
      role?: UserRole;
      phone?: string;
      password?: string;
      boundManagerId?: number | null;
    };

    if (body.action === "ensure-managers") {
      const created = await ensureManagerAccounts();
      return NextResponse.json({ ok: true, created, users: await getUserAccounts() });
    }

    await createUserAccount({
      username: body.username ?? "",
      displayName: body.displayName ?? "",
      role: body.role ?? "manager",
      phone: body.phone,
      password: body.password,
      boundManagerId: body.boundManagerId ?? null,
    });

    return NextResponse.json({ ok: true, users: await getUserAccounts() });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "保存账号失败。" },
      { status: 400 },
    );
  }
}
