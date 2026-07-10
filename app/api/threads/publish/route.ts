import { NextRequest, NextResponse } from "next/server";
import { publishToThreads } from "@/lib/publish";

export async function POST(req: NextRequest) {
  const { posts, media, threads_account_id } = await req.json();

  if (
    !Array.isArray(posts) ||
    posts.length === 0 ||
    !posts.every((p: unknown) => typeof p === "string" && p.trim().length > 0)
  ) {
    return NextResponse.json(
      { error: "posts must be a non-empty array of strings" },
      { status: 400 }
    );
  }

  const result = await publishToThreads(posts, media, threads_account_id);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error,
        details: result.details,
        published: result.post_ids,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, post_ids: result.post_ids });
}
