import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { newPlainPassword } from "@/lib/code";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const person = await prisma.person.findUnique({
    where: { code },
    select: { id: true },
  });
  if (!person) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  const plainPassword = newPlainPassword();
  const passwordHash = hashPassword(plainPassword);

  await prisma.person.update({
    where: { id: person.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true, password: plainPassword });
}
