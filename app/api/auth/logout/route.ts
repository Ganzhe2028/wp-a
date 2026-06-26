import { NextResponse } from "next/server";
import { clearStudentCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearStudentCookie());
  return response;
}
