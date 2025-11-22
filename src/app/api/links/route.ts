import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/link - return all rows
export async function GET() {
  try {
    const links = await prisma.linkGenerator.findMany();
    return NextResponse.json(links, { status: 200 });
  } catch (error) {
    console.error("Error fetching links", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/link - create a row
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, originalUrl, lastAccessedAt } = body ?? {};

    if (typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "'code' is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof originalUrl !== "string" || !originalUrl.trim()) {
      return NextResponse.json(
        { error: "'originalUrl' is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim();
    const pattern = /^[A-Za-z0-9]{6,8}$/;
    if (!pattern.test(trimmedCode)) {
      return NextResponse.json(
        {
          error:
            "'code' must be 6–8 characters long and contain only letters and numbers (A–Z, a–z, 0–9)",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.linkGenerator.findUnique({
      where: { code: trimmedCode },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Code already exists" },
        { status: 409 }
      );
    }

    let lastAccessedAtDate: Date | null = null;
    if (lastAccessedAt) {
      const parsed = new Date(lastAccessedAt);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "'lastAccessedAt' must be a valid date string" },
          { status: 400 }
        );
      }
      lastAccessedAtDate = parsed;
    }

    const link = await prisma.linkGenerator.create({
      data: {
        code: trimmedCode,
        originalUrl,
        lastAccessedAt: lastAccessedAtDate,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("Error creating link", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
