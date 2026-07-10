import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { text, threads_account_id } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const query = supabase
    .from("threads_accounts")
    .select("threads_user_id, access_token")
    .eq("user_id", user.id);

  if (threads_account_id) {
    query.eq("id", threads_account_id);
  }

  const { data: account } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!account) {
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
