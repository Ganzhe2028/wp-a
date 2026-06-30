import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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

  const { code, name, grade, room, seat } = body;
  if (!code || !name || room === undefined || seat === undefined) {
    return NextResponse.json(
      { error: "code, name, room, seat required" },
      { status: 400 }
    );
  }

  const location = await prisma.locationCard.upsert({
    where: { code: String(code) },
    update: { name: String(name), grade: grade ? String(grade) : null, room: String(room), seat: String(seat) },
    create: {
      code: String(code),
      name: String(name),
      grade: grade ? String(grade) : null,
      room: String(room),
      seat: String(seat),
      person: {
        connect: { code: String(code) },
      },
    },
  });

  return NextResponse.json({ ok: true, location });
}
