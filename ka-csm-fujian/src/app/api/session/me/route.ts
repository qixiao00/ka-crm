import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "未登录。" }, { status: 401 });
    }

    return NextResponse.json({
      user,
      source: hasDatabaseConfig() ? "database" : "static",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "读取登录状态失败。" },
      { status: 500 },
    );
  }
}
