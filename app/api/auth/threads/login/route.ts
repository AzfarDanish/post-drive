import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const state = JSON.stringify({
    csrf: randomUUID(),
    userId: user.id,
  });

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_THREADS_APP_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI!,
    scope: "threads_basic,threads_content_publish,threads_manage_replies",
    response_type: "code",
    state,
  });

  const url = `https://threads.net/oauth/authorize?${params.toString()}`;
  return NextResponse.redirect(url);
}
