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
    .select("id, threads_user_id, username, is_active")
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

  return NextResponse.json(
    { connected: true, accounts },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    }
  );
}
