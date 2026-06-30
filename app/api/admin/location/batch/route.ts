import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface LocationRow {
  code?: string;
  name?: string;
  grade?: string;
  room?: string;
  seat?: string;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rows: LocationRow[];
  try {
    const body = (await request.json()) as { rows: LocationRow[] };
    rows = body.rows;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows array required" }, { status: 400 });
  }

  const normalized = rows.map((row, index) => ({
    index: index + 1,
    code: row.code?.trim() ?? "",
    name: row.name?.trim() ?? "",
    grade: row.grade?.trim() || null,
    room: row.room?.trim() ?? "",
    seat: row.seat?.trim() ?? "",
  }));

  const invalid = normalized.find((row) => !row.code || !row.name || !row.room || !row.seat);
  if (invalid) {
    return NextResponse.json(
      { error: `row ${invalid.index} requires code, name, room, seat` },
      { status: 400 }
    );
  }

  const codes = normalized.map((row) => row.code);
  const persons = await prisma.person.findMany({
    where: { code: { in: codes } },
    select: { code: true },
  });
  const knownCodes = new Set(persons.map((person) => person.code));
  const missing = normalized.find((row) => !knownCodes.has(row.code));
  if (missing) {
    return NextResponse.json(
      { error: `row ${missing.index} code not found: ${missing.code}` },
      { status: 404 }
    );
  }

  await prisma.$transaction(
    normalized.map((row) =>
      prisma.locationCard.upsert({
        where: { code: row.code },
        update: {
          name: row.name,
          grade: row.grade,
          room: row.room,
          seat: row.seat,
        },
        create: {
          code: row.code,
          name: row.name,
          grade: row.grade,
          room: row.room,
          seat: row.seat,
          person: { connect: { code: row.code } },
        },
      })
    )
  );

  return NextResponse.json({ ok: true, count: normalized.length });
}
