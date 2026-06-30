import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCsv } from "@/lib/csv";

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const persons = await prisma.person.findMany({
    orderBy: { createdAt: "asc" },
  });

  const rows = persons.map((p: typeof persons[number]) =>
    [
      p.chineseName || "",
      p.englishName || "",
      p.username || "",
      p.code,
      `${baseUrl}/u/${p.code}`,
      `${baseUrl}/loc/${p.code}`,
    ]
  );

  const csv = serializeCsv([
    ["chineseName", "englishName", "username", "code", "homepage", "location"],
    ...rows,
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="owek-export.csv"',
    },
  });
}
