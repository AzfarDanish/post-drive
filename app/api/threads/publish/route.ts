import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { posts } = await req.json();

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

  const { data: account, error: queryError } = await supabase
    .from("threads_accounts")
    .select("threads_user_id, access_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (queryError || !account) {
    return NextResponse.json(
      { error: "No connected Threads account found. Connect at /connect" },
      { status: 401 }
    );
  }

  const base = "https://graph.threads.net/v1.0";
  const userId = account.threads_user_id;
  const token = account.access_token;
  const publishedIds: string[] = [];

  for (let i = 0; i < posts.length; i++) {
    const text = posts[i].trim();

    const body: Record<string, string> = {
      media_type: "TEXT",
      text,
      access_token: token,
    };

    if (i > 0 && publishedIds[i - 1]) {
      body.reply_to = publishedIds[i - 1];
    }

    const containerRes = await fetch(
      `${base}/${userId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const containerData = await containerRes.json();

    if (!containerRes.ok) {
      return NextResponse.json(
        {
          error: `Failed to create container for post ${i + 1}`,
          details: containerData,
          published: publishedIds,
        },
        { status: 500 }
      );
    }

    const { id: creation_id } = containerData;

    const publishRes = await fetch(
      `${base}/${userId}/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id,
          access_token: token,
        }),
      }
    );

    const publishData = await publishRes.json();

    if (!publishRes.ok) {
      return NextResponse.json(
        {
          error: `Failed to publish post ${i + 1}`,
          details: publishData,
          published: publishedIds,
        },
        { status: 500 }
      );
    }

    publishedIds.push(publishData.id);
  }

  return NextResponse.json({ success: true, post_ids: publishedIds });
}
