import { NextResponse } from "next/server";

export async function POST() {
  // Meta will call this when a user disconnects your app.
  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({ success: true });
}