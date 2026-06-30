import { NextRequest, NextResponse } from "next/server";
import { createAdminSession, setAdminCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  let password: string;
  try {
    const body = await request.json();
    password = body.password;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(`admin-login:ip:${ip}`, 8, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const token = await createAdminSession(password);
  if (!token) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(setAdminCookie(token));
  return response;
}
