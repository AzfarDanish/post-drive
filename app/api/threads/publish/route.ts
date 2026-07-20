import { NextRequest, NextResponse } from "next/server";
import { publishToThreads, publishThreadToThreads } from "@/lib/publish";

export async function POST(req: NextRequest) {
  const { post, threads, media, threads_account_id } = await req.json();

  if (threads && Array.isArray(threads) && threads.length > 0) {
    const result = await publishThreadToThreads(threads, threads_account_id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          details: result.details,
          publishedCount: result.publishedCount,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      post_ids: result.post_ids,
      publishedCount: result.publishedCount,
    });
  }

  if (!post || typeof post !== "string" || !post.trim()) {
    return NextResponse.json(
      { error: "post or threads is required" },
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
