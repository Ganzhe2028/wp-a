import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { createUniqueCode, createUniqueEditToken, newPlainPassword } from "@/lib/code";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

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

  const { rows } = (await request.json()) as { rows: ImportRow[] };
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows array required" }, { status: 400 });
  }

  const validRows = rows.filter((row) => row.chineseName);
  const created: {
    chineseName: string;
    code: string;
    username: string;
    password: string;
    editToken: string;
    passwordHash: string;
    englishName: string | null;
    grade: string | null;
  }[] = [];

  for (const row of validRows) {
    const code = await createUniqueCode();
    const plainPassword = newPlainPassword();
    created.push({
      chineseName: row.chineseName,
      code,
      username: row.username || code,
      password: plainPassword,
      editToken: await createUniqueEditToken(),
      passwordHash: hashPassword(plainPassword),
      englishName: row.englishName || null,
      grade: row.grade || null,
    });
  }

  try {
    await prisma.$transaction(
      created.map((person) =>
        prisma.person.create({
          data: {
            code: person.code,
            editToken: person.editToken,
            username: person.username,
            passwordHash: person.passwordHash,
            englishName: person.englishName,
            chineseName: person.chineseName,
            grade: person.grade,
            location: {
              create: {
                code: person.code,
                name: person.chineseName,
                grade: person.grade,
                room: "",
                seat: "",
              },
            },
          },
        })
      )
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Import failed: duplicate code, username, or edit token" },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({
    created: created.map(({ chineseName, code, username, password }) => ({
      chineseName,
      code,
      username,
      password,
    })),
  });
}
