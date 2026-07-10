import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { data: accounts } = await supabase
    .from("threads_accounts")
    .select("id, threads_user_id, access_token, is_enabled, post_hour_utc")
    .eq("user_id", user.id);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({
      connected: false,
      accounts: [],
      message: "No connected Threads accounts found. Connect at /connect",
    });
  }

  const results = await Promise.all(
    accounts.map(async (account) => {
      const base = "https://graph.threads.net/v1.0";

      const [meRes, limitRes] = await Promise.all([
        fetch(
          `${base}/me?fields=id,username,name&access_token=${account.access_token}`
        ),
        fetch(
          `${base}/${account.threads_user_id}/threads_publishing_limit?access_token=${account.access_token}`
        ),
      ]);

      const meData = await meRes.json();
      const limitData = await limitRes.json();

      return {
        id: account.id,
        threads_user_id: account.threads_user_id,
        username: meRes.ok ? meData.username || meData.name || null : null,
        is_enabled: account.is_enabled,
        post_hour_utc: account.post_hour_utc,
        token_preview: account.access_token.slice(0, 20) + "...",
        me: { ok: meRes.ok, data: meData },
        publishing_limit: { ok: limitRes.ok, data: limitData },
      };
    })
  );

  return NextResponse.json({ connected: true, accounts: results });
}
