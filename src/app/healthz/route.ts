import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      version: "1.0.0",
      timestamp: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
      environment: "development",
      database: "connected",
      uptime: process.uptime(),
    },
    { status: 200 },
  );
}