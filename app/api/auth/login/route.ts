import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createStudentSession,
  setStudentCookie,
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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

  const ip = getClientIp(request.headers);
  const ipLimit = checkRateLimit(`student-login:ip:${ip}`, 20, 60_000);
  const accountLimit = checkRateLimit(
    `student-login:account:${username}`,
    8,
    60_000
  );
  if (!ipLimit.allowed || !accountLimit.allowed) {
    const retryAfter = Math.max(ipLimit.retryAfter, accountLimit.retryAfter);
    return NextResponse.json(
      { error: "Too many login attempts" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
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
