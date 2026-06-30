import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { createUniqueCode, createUniqueEditToken, newPlainPassword } from "@/lib/code";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ImportRow {
  englishName?: string;
  chineseName: string;
  grade?: string;
  username?: string;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rows: ImportRow[];
  try {
    const body = (await request.json()) as { rows: ImportRow[] };
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

  const validRows = rows.filter((row) => row.chineseName);
  if (validRows.length === 0) {
    return NextResponse.json({ error: "no valid rows" }, { status: 400 });
  }

  const created: { chineseName: string; code: string; username: string; password: string }[] =
    [];
  const createData = [];

  for (const row of validRows) {
    const code = await createUniqueCode();
    const editToken = await createUniqueEditToken();
    const username = row.username || code;
    const plainPassword = newPlainPassword();
    const passwordHash = hashPassword(plainPassword);

    createData.push({
      data: {
        code,
        editToken,
        username,
        passwordHash,
        englishName: row.englishName || null,
        chineseName: row.chineseName,
        grade: row.grade || null,
        location: {
          create: {
            code,
            name: row.chineseName,
            grade: row.grade || null,
            room: "",
            seat: "",
          },
        },
      },
    });

    created.push({
      chineseName: row.chineseName,
      code,
      username,
      password: plainPassword,
    });
  }

  await prisma.$transaction(
    createData.map((data) => prisma.person.create(data))
  );

  return NextResponse.json({ created });
}
