import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public endpoint: read a specific system setting by key.
 * Used by the edit page to check whether publish self-control is enabled.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  try {
    // quick connectivity check first
    await prisma.$queryRaw`SELECT 1`;

    const setting = await prisma.systemSetting.findUnique({
      where: { key },
      select: { value: true },
    });

    return NextResponse.json({ value: setting?.value ?? null });
  } catch (e: any) {
    return NextResponse.json({
      error: "db_error",
      message: e.message,
      code: e.code,
      meta: e.meta,
    }, { status: 500 });
  }
}
