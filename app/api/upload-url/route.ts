import { NextRequest, NextResponse } from "next/server";
import { verifyStudentSession } from "@/lib/auth";
import { createPresignedUploadUrl, getPublicUrl } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const session = await verifyStudentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let contentType: string;
  let purpose: string;
  try {
    const body = await request.json();
    contentType = body.contentType;
    purpose = body.purpose;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!contentType) {
    return NextResponse.json(
      { error: "contentType required" },
      { status: 400 }
    );
  }

  const uploadPurpose = purpose === "avatar" ? "avatar" : "image";

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json(
      { error: "Only jpg, png, webp allowed" },
      { status: 400 }
    );
  }

  if (uploadPurpose === "image") {
    const imageCount = await prisma.image.count({
      where: { personId: session.personId, hidden: false },
    });

    if (imageCount >= 4) {
      return NextResponse.json(
        { error: "Maximum 4 images allowed" },
        { status: 409 }
      );
    }
  }

  const ext = contentType.split("/")[1] || "webp";
  const key = `${session.personId}/${uploadPurpose}/${nanoid()}.${ext}`;

  const putUrl = await createPresignedUploadUrl(key, contentType);
  const publicUrl = getPublicUrl(key);

  return NextResponse.json({ putUrl, publicUrl, key });
}
