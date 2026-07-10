import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const { id, is_enabled, post_hour_utc } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 }
    );
  }

  if (post_hour_utc !== undefined && (typeof post_hour_utc !== "number" || post_hour_utc < 0 || post_hour_utc > 23)) {
    return NextResponse.json(
      { error: "post_hour_utc must be a number between 0 and 23" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof is_enabled === "boolean") updateData.is_enabled = is_enabled;
  if (post_hour_utc !== undefined) updateData.post_hour_utc = post_hour_utc;

  const { error } = await supabase
    .from("threads_accounts")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
