import { NextResponse } from "next/server";
import { getCurrentUser, isPrivileged } from "@/lib/auth";
import { getUserAccounts, updateUserAccount } from "@/lib/user-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ message: "未登录。" }, { status: 401 });
  }

  if (!isPrivileged(currentUser)) {
    return NextResponse.json({ message: "无账号管理权限。" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isSafeInteger(userId)) {
    return NextResponse.json({ message: "账号 ID 不正确。" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { enabled?: boolean; password?: string };
    await updateUserAccount(userId, body, currentUser);
    return NextResponse.json({ ok: true, users: await getUserAccounts() });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "保存账号失败。" },
      { status: 400 },
    );
  }
}
