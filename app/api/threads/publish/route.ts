import { NextRequest, NextResponse } from "next/server";
import { publishToThreads } from "@/lib/publish";

export async function POST(req: NextRequest) {
  const { post, media, threads_account_id } = await req.json();

  if (!post || typeof post !== "string" || !post.trim()) {
    return NextResponse.json(
      { error: "post is required" },
      { status: 400 }
    );
  }

  const result = await publishToThreads(post, media, threads_account_id);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        details: result.details,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, post_id: result.post_id });
}
