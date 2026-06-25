import { NextRequest, NextResponse } from "next/server";
import { verifyEditToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const auth = await verifyEditToken(token);
  if (!auth) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const person = await prisma.person.findUnique({
    where: { id: auth.id },
    include: { images: { orderBy: { sort: "asc" } } },
  });

  return NextResponse.json({ person, images: person?.images ?? [] });
}

export async function PATCH(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const auth = await verifyEditToken(token);
  if (!auth) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  const body = await request.json();
  const { englishName, chineseName, grade, bio, avatarUrl, published } = body;

  // Block publish control if admin hasn't enabled it
  if (published === true) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "allowStudentPublishControl" },
      select: { value: true },
    });
    if (setting?.value !== "true") {
      return NextResponse.json(
        { error: "Publish control is not available" },
        { status: 403 }
      );
    }
  }

  if (bio !== undefined) {
    const codePoints = [...bio].length;
    if (codePoints > 80) {
      return NextResponse.json(
        { error: `Bio must be ≤ 80 characters (got ${codePoints})` },
        { status: 400 }
      );
    }
  }

  if (published === true) {
    const person = await prisma.person.findUnique({
      where: { id: auth.id },
      select: { avatarUrl: true },
    });
    const hasAvatar = body.avatarUrl || person?.avatarUrl;
    if (!hasAvatar) {
      return NextResponse.json(
        { error: "Avatar is required before publishing" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.person.update({
    where: { id: auth.id },
    data: {
      ...(englishName !== undefined && { englishName }),
      ...(chineseName !== undefined && { chineseName }),
      ...(grade !== undefined && { grade }),
      ...(bio !== undefined && { bio }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(published !== undefined && { published }),
    },
  });

  return NextResponse.json({ ok: true, person: updated });
}
