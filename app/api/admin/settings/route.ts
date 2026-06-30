import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.systemSetting.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { key, value } = body;
  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "key and value required" },
      { status: 400 }
    );
  }

  await prisma.systemSetting.upsert({
    where: { key: String(key) },
    update: { value: String(value) },
    create: { key: String(key), value: String(value) },
  });

  return NextResponse.json({ ok: true, key: String(key), value: String(value) });
}
