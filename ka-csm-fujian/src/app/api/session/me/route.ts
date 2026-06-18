import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabaseConfig } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "未登录。" }, { status: 401 });
  }

  return NextResponse.json({
    user,
    source: hasDatabaseConfig() ? "database" : "static",
  });
}
