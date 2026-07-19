import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";

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
    .select("id, threads_user_id, username, is_active, access_token")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!accounts || accounts.length === 0) {
    return NextResponse.json(
      {
        connected: false,
        accounts: [],
        message: "No connected Threads accounts found. Connect at /connect",
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
        },
      }
    );
  }

  const admin = getSupabase();

  const results = await Promise.all(
    accounts.map(async (account) => {
      if (account.username) {
        return {
          id: account.id,
          threads_user_id: account.threads_user_id,
          username: account.username,
          is_active: account.is_active,
        };
      }

      try {
        const res = await fetch(
          `https://graph.threads.net/v1.0/me?fields=username&access_token=${account.access_token}`
        );
        const data = await res.json();
        const username = res.ok ? (data.username as string) || null : null;

        if (username) {
          await admin
            .from("threads_accounts")
            .update({ username })
            .eq("id", account.id);
        }

        return {
          id: account.id,
          threads_user_id: account.threads_user_id,
          username,
          is_active: account.is_active,
        };
      } catch {
        return {
          id: account.id,
          threads_user_id: account.threads_user_id,
          username: null,
          is_active: account.is_active,
        };
      }
    })
  );

  return NextResponse.json(
    { connected: true, accounts: results },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    }
  );
}
