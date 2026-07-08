import { NextResponse } from "next/server";

export async function POST() {
  // Meta will call this when a user requests data deletion.
  return NextResponse.json({
    url: "https://example.com/delete-status",
    confirmation_code: "local-test",
  });
}

export async function GET() {
  return NextResponse.json({
    url: "https://example.com/delete-status",
    confirmation_code: "local-test",
  });
}