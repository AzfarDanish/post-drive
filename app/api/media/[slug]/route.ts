import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const path = join(tmpdir(), "post-media", slug);

  if (!existsSync(path)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = slug.split(".").pop() || "";
  const contentType = MIME_MAP[ext] || "application/octet-stream";
  const bytes = await readFile(path);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
