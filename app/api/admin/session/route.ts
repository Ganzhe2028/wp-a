import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";

export async function GET() {
  const authed = await verifyAdminSession();
  return NextResponse.json({ authed });
}
