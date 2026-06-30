import { NextRequest, NextResponse } from "next/server";
import { verifyStudentSession } from "@/lib/auth";
import { deleteFromR2, getPublicUrl } from "@/lib/r2";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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

  const { url, key } = body;
  if (typeof url !== "string" || typeof key !== "string") {
    return NextResponse.json(
      { error: "url and key required" },
      { status: 400 }
    );
  }

  const expectedPrefix = `${session.personId}/image/`;
  if (!key.startsWith(expectedPrefix) || url !== getPublicUrl(key)) {
    return NextResponse.json(
      { error: "Invalid image key" },
      { status: 400 }
    );
  }

  const imageCount = await prisma.image.count({
    where: { personId: session.personId, hidden: false },
  });

  if (imageCount >= 4) {
    return NextResponse.json(
      { error: "Maximum 4 images allowed" },
      { status: 409 }
    );
  }

  const maxSort = await prisma.image.aggregate({
    where: { personId: session.personId },
    _max: { sort: true },
  });

  const image = await prisma.image.create({
    data: {
      personId: session.personId,
      url,
      key,
      sort: (maxSort._max.sort ?? -1) + 1,
    },
  });

  return NextResponse.json({ image });
}

export async function DELETE(request: NextRequest) {
  const session = await verifyStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "id required" },
      { status: 400 }
    );
  }

  const image = await prisma.image.findUnique({ where: { id } });
  if (!image || image.personId !== session.personId) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  await deleteFromR2(image.key);
  await prisma.image.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
