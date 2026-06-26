import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createStudentSession,
  setStudentCookie,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  let username: string;
  let password: string;
  try {
    const body = await request.json();
    username = body.username;
    password = body.password;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!username || !password) {
    return NextResponse.json(
      { error: "username and password required" },
      { status: 400 }
    );
  }

  const person = await prisma.person.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });

  if (
    !person ||
    !person.passwordHash ||
    !verifyPassword(password, person.passwordHash)
  ) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const sessionToken = await createStudentSession(person.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(setStudentCookie(sessionToken));
  return response;
}
