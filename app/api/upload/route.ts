import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  let mediaType: "IMAGE" | "VIDEO";

  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    mediaType = "IMAGE";
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
    }
  } else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
    mediaType = "VIDEO";
    if (file.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: "Video must be under 100MB" }, { status: 400 });
    }
  } else {
    return NextResponse.json(
      { error: "Unsupported file type. Accepted: JPEG, PNG, GIF, WebP, MP4, MOV, AVI" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() || "bin";
  const filename = `${user.id}-${randomUUID()}.${ext}`;
  const dir = join(tmpdir(), "post-media");
  const path = join(dir, filename);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const bytes = await file.arrayBuffer();
  await writeFile(path, Buffer.from(bytes));

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const url = `${protocol}://${host}/api/media/${filename}`;

  return NextResponse.json({ url, mediaType });
}
