import { NextRequest, NextResponse } from "next/server";
import { verifyStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await verifyStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const person = await prisma.person.findUnique({
    where: { id: session.personId },
    include: { images: { orderBy: { sort: "asc" } } },
  });

  return NextResponse.json({ person, images: person?.images ?? [] });
}

export async function PATCH(request: NextRequest) {
  const session = await verifyStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { englishName, chineseName, grade, bio, avatarUrl, published } = body;

  if (published === true) {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "allowStudentPublishControl" },
      select: { value: true },
    });
    if (setting?.value === "false") {
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
      where: { id: session.personId },
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
    where: { id: session.personId },
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
