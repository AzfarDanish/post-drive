import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

async function safeJson(res: Response): Promise<{ ok: boolean; data: unknown }> {
  const text = await res.text();
  try {
    return { ok: res.ok, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, data: text };
  }
}

function parseState(state: string): { csrf?: string; userId?: string } | null {
  try {
    return JSON.parse(state);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const errorParam = req.nextUrl.searchParams.get("error");
  const returnedState = req.nextUrl.searchParams.get("state");

  if (errorParam) {
    return NextResponse.json({ error: errorParam }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  cookieStore.delete("oauth_state");

  if (storedState && returnedState !== storedState) {
    return NextResponse.json(
      { error: "State mismatch — possible CSRF attack" },
      { status: 403 }
    );
  }

  const stateData = parseState(returnedState ?? storedState ?? "");
  const userId = stateData?.userId;

  if (!userId) {
    return NextResponse.json(
      { error: "Invalid OAuth state — missing userId" },
      { status: 400 }
    );
  }

  const admin = getSupabase();
  const { data: appUser } = await admin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!appUser) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 403 }
    );
  }

  const tokenRes = await fetch(
    "https://graph.threads.net/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.THREADS_APP_ID!,
        client_secret: process.env.THREADS_APP_SECRET!,
        redirect_uri: process.env.THREADS_REDIRECT_URI!,
        grant_type: "authorization_code",
        code,
      }),
    }
  );

  const { data: tokenData } = await safeJson(tokenRes);

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "Token exchange failed", details: tokenData },
      { status: 400 }
    );
  }

  const { access_token: shortLivedToken, user_id } = tokenData as Record<
    string,
    unknown
  >;

  if (!shortLivedToken || !user_id) {
    return NextResponse.json(
      { error: "Invalid token response — missing access_token or user_id", details: tokenData },
      { status: 500 }
    );
  }

  const longLivedRes = await fetch(
    `https://graph.threads.net/access_token?${new URLSearchParams({
      grant_type: "th_exchange_token",
      client_secret: process.env.THREADS_APP_SECRET!,
      access_token: shortLivedToken as string,
    })}`
  );

  const { data: longLivedData } = await safeJson(longLivedRes);

  if (!longLivedRes.ok) {
    return NextResponse.json(
      { error: "Long-lived token exchange failed", details: longLivedData },
      { status: 500 }
    );
  }

  const accessToken =
    (longLivedData as Record<string, unknown>)?.access_token ||
    shortLivedToken;

  const meRes = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id&access_token=${accessToken}`
  );

  const { data: meData } = await safeJson(meRes);

  if (!meRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch Threads user ID", details: meData },
      { status: 500 }
    );
  }

  const threadsUserId =
    (meData as Record<string, unknown>)?.id || user_id;

  const { data: existing } = await admin
    .from("threads_accounts")
    .select("id")
    .eq("user_id", appUser.id)
    .eq("threads_user_id", threadsUserId)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await admin
      .from("threads_accounts")
      .update({ access_token: accessToken })
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await admin
      .from("threads_accounts")
      .insert({
        threads_user_id: threadsUserId,
        access_token: accessToken,
        user_id: appUser.id,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.redirect(new URL("/connected", req.url));
}
