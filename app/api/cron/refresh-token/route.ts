import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: accounts } = await getSupabase()
    .from("threads_accounts")
    .select("*");

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ error: "No connected accounts" }, { status: 400 });
  }

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const accountsToRefresh = accounts.filter((a) => {
    if (!a.token_expires_at) return true;
    return new Date(a.token_expires_at).getTime() - now <= sevenDays;
  });

  if (accountsToRefresh.length === 0) {
    return NextResponse.json({ message: "All tokens valid, no refresh needed" });
  }

  after(async () => {
    for (const account of accountsToRefresh) {
      try {
        const refreshRes = await fetch(
          `https://graph.threads.net/access_token?${new URLSearchParams({
            grant_type: "th_refresh_token",
            access_token: account.access_token,
          })}`
        );

        const data = await refreshRes.json();

        if (!refreshRes.ok) {
          console.error(`Token refresh failed for account ${account.id}:`, data);
          continue;
        }

        const newToken: string = data.access_token;
        const expiresIn: number = data.expires_in;
        const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        await getSupabase()
          .from("threads_accounts")
          .update({
            access_token: newToken,
            token_expires_at: tokenExpiresAt,
          })
          .eq("id", account.id);
      } catch (err) {
        console.error(`Token refresh error for account ${account.id}:`, err);
      }
    }
  });

  return NextResponse.json({
    message: "token refresh started",
    accountCount: accountsToRefresh.length,
  });
}
