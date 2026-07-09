import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_TONES = ["rage-bait", "hot-take", "storytelling", "educational"];

export async function GET() {
  const { data: account, error: queryError } = await supabase
    .from("threads_accounts")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (queryError || !account) {
    return NextResponse.json(
      { error: "No connected Threads account found" },
      { status: 404 }
    );
  }

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("threads_account_id", account.id)
    .maybeSingle();

  if (!prefs) {
    const defaultPrefs = {
      default_tone: "rage-bait",
      business_description: "",
      website_url: "",
      char_min: 240,
      char_max: 480,
    };
    return NextResponse.json(defaultPrefs);
  }

  return NextResponse.json({
    default_tone: prefs.default_tone,
    business_description: prefs.business_description,
    website_url: prefs.website_url,
    char_min: prefs.char_min,
    char_max: prefs.char_max,
  });
}

export async function PUT(req: NextRequest) {
  const { data: account, error: queryError } = await supabase
    .from("threads_accounts")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (queryError || !account) {
    return NextResponse.json(
      { error: "No connected Threads account found" },
      { status: 404 }
    );
  }

  const body = await req.json();
  const default_tone =
    typeof body.default_tone === "string" &&
    VALID_TONES.includes(body.default_tone)
      ? body.default_tone
      : "rage-bait";
  const business_description =
    typeof body.business_description === "string"
      ? body.business_description
      : "";
  const website_url =
    typeof body.website_url === "string" ? body.website_url : "";
  const char_min =
    typeof body.char_min === "number" && body.char_min >= 30 && body.char_min < body.char_max
      ? body.char_min
      : 240;
  const char_max =
    typeof body.char_max === "number" && body.char_max <= 500 && body.char_max > (typeof body.char_min === "number" ? body.char_min : 240)
      ? body.char_max
      : 480;

  const { data: prefs, error: upsertError } = await supabase
    .from("user_preferences")
    .upsert(
      {
        threads_account_id: account.id,
        default_tone,
        business_description,
        website_url,
        char_min,
        char_max,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "threads_account_id", ignoreDuplicates: false }
    )
    .select()
    .maybeSingle();

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    default_tone: prefs!.default_tone,
    business_description: prefs!.business_description,
    website_url: prefs!.website_url,
    char_min: prefs!.char_min,
    char_max: prefs!.char_max,
  });
}
