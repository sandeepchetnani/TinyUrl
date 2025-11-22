import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "'code' query parameter is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.linkGenerator.findUnique({
    where: { code },
  });

  return NextResponse.json({ available: !existing });
}
