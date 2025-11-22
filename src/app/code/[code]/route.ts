import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/links/:code - stats for a single short code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "'code' parameter is required in the URL" },
      { status: 400 }
    );
  }

  try {
    const link = await prisma.linkGenerator.findUnique({
      where: { code },
    });

    if (!link) {
      return NextResponse.json(
        {
          exists: false,
          message: "This code is not used yet. You can use it.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        exists: true,
        id: link.id,
        code: link.code,
        originalUrl: link.originalUrl,
        createdAt: link.createdAt,
        clicks: link.clicks,
        lastAccessedAt: link.lastAccessedAt,
        isActive: link.isActive,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching link stats by code", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
