import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  const response = await fetch(
    "https://graph.threads.net/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
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

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(data, { status: 400 });
  }

  const { access_token: short_lived_token, user_id } = data;

  if (!short_lived_token || !user_id) {
    return NextResponse.json(
      { error: "Invalid token response", data },
      { status: 500 }
    );
  }

  const longLivedRes = await fetch(
    "https://graph.threads.net/access_token?" +
      new URLSearchParams({
        grant_type: "th_exchange_token",
        client_secret: process.env.THREADS_APP_SECRET!,
        access_token: short_lived_token,
      })
  );

  const longLivedData = await longLivedRes.json();
  const access_token = longLivedData.access_token || short_lived_token;

  const meRes = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id&access_token=${access_token}`
  );

  const meData = await meRes.json();
  const threads_user_id = meData.id || user_id;

  const { error: insertError } = await supabase
    .from("threads_accounts")
    .insert({
      threads_user_id,
      access_token,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const redirectBase = new URL(process.env.THREADS_REDIRECT_URI!);
  return NextResponse.redirect(new URL("/connected", redirectBase.origin));
}
