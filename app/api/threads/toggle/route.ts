import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { accountId, isActive } = await req.json();

  if (!accountId || typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "Missing accountId or isActive" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("threads_accounts")
    .update({ is_active: isActive })
    .eq("id", accountId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}