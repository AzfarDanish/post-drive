import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: account, error: queryError } = await supabase
    .from("threads_accounts")
    .select("threads_user_id, access_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (queryError || !account) {
    return NextResponse.json({
      connected: false,
      message: "No connected Threads account found. Connect at /connect",
    });
  }

  const base = "https://graph.threads.net/v1.0";

  const meRes = await fetch(
    `${base}/me?fields=id,username,name&access_token=${account.access_token}`
  );

  const meData = await meRes.json();

  const limitRes = await fetch(
    `${base}/${account.threads_user_id}/threads_publishing_limit?access_token=${account.access_token}`
  );

  const limitData = await limitRes.json();

  return NextResponse.json({
    connected: true,
    threads_user_id: account.threads_user_id,
    token_preview: account.access_token.slice(0, 20) + "...",
    me: {
      ok: meRes.ok,
      data: meData,
    },
    publishing_limit: {
      ok: limitRes.ok,
      data: limitData,
    },
  });
}
