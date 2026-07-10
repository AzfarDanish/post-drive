import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: account } = await supabase
    .from("threads_accounts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!account) {
    return NextResponse.json({ error: "No connected account" }, { status: 400 });
  }

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : null;
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (expiresAt && expiresAt - now > sevenDays) {
    return NextResponse.json({ message: "Token still valid, no refresh needed" });
  }

  after(async () => {
    try {
      const refreshRes = await fetch(
        `https://graph.threads.net/access_token?${new URLSearchParams({
          grant_type: "th_refresh_token",
          access_token: account.access_token,
        })}`
      );

      const data = await refreshRes.json();

      if (!refreshRes.ok) {
        console.error("Token refresh failed:", data);
        return;
      }

      const newToken: string = data.access_token;
      const expiresIn: number = data.expires_in; // seconds

      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      await supabase
        .from("threads_accounts")
        .update({
          access_token: newToken,
          token_expires_at: tokenExpiresAt,
        })
        .eq("id", account.id);
    } catch (err) {
      console.error("Token refresh error:", err);
    }
  });

  return NextResponse.json({ message: "token refresh started" });
}
