import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyStudentSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await verifyStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Find target person by code
  const target = await prisma.person.findUnique({
    where: { code },
    select: { id: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  // Reject self-favorite
  if (target.id === session.personId) {
    return NextResponse.json(
      { error: "Cannot favorite yourself" },
      { status: 400 }
    );
  }

  // Toggle favorite: create if not exists, delete if exists
  const existing = await prisma.favorite.findUnique({
    where: {
      favoriterId_favoriteeId: {
        favoriterId: session.personId,
        favoriteeId: target.id,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ favorited: false });
  } else {
    await prisma.favorite.create({
      data: {
        favoriterId: session.personId,
        favoriteeId: target.id,
      },
    });
    return NextResponse.json({ favorited: true });
  }
}