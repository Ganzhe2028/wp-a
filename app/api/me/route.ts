import { NextRequest, NextResponse } from "next/server";
import { verifyStudentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { englishName, chineseName, grade, bio, avatarUrl } = body;

  if (bio !== undefined && bio !== null && typeof bio !== "string") {
    return NextResponse.json({ error: "Bio must be text" }, { status: 400 });
  }

  if (bio !== undefined && bio !== null) {
    const codePoints = [...bio].length;
    if (codePoints > 80) {
      return NextResponse.json(
        { error: `Bio must be ≤ 80 characters (got ${codePoints})` },
        { status: 400 }
      );
    }
  }

  const current = await prisma.person.findUnique({
    where: { id: session.personId },
    select: {
      englishName: true,
      chineseName: true,
      avatarUrl: true,
    },
  });

  if (!current) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  const nextEnglishName =
    englishName !== undefined ? normalizeOptionalString(englishName) : current.englishName;
  const nextChineseName =
    chineseName !== undefined ? normalizeOptionalString(chineseName) : current.chineseName;
  const nextAvatarUrl =
    avatarUrl !== undefined ? normalizeOptionalString(avatarUrl) : current.avatarUrl;
  const isDisplayReady = Boolean(nextAvatarUrl && (nextEnglishName || nextChineseName));

  const updated = await prisma.person.update({
    where: { id: session.personId },
    data: {
      ...(englishName !== undefined && { englishName: nextEnglishName }),
      ...(chineseName !== undefined && { chineseName: nextChineseName }),
      ...(grade !== undefined && { grade: normalizeOptionalString(grade) }),
      ...(bio !== undefined && { bio: normalizeOptionalString(bio) }),
      ...(avatarUrl !== undefined && { avatarUrl: nextAvatarUrl }),
      published: isDisplayReady,
    },
  });

  return NextResponse.json({ ok: true, person: updated });
}

function normalizeOptionalString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return String(value);
  return value;
}
