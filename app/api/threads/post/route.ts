import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
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

  const containerRes = await fetch(
    `${base}/${account.threads_user_id}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "TEXT",
        text,
        access_token: account.access_token,
      }),
    }
  );

  const containerData = await containerRes.json();

  if (!containerRes.ok) {
    return NextResponse.json(
      { error: "Failed to create media container", details: containerData },
      { status: 500 }
    );
  }

  const { id: creation_id } = containerData;

  const publishRes = await fetch(
    `${base}/${account.threads_user_id}/threads_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id,
        access_token: account.access_token,
      }),
    }
  );

  const publishData = await publishRes.json();

  if (!publishRes.ok) {
    return NextResponse.json(
      { error: "Failed to publish post", details: publishData },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, post_id: publishData.id });
}
