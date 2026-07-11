import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_TONES = ["rage-bait", "hot-take", "storytelling", "educational"];

const DEFAULT_PREFS = {
  default_tone: "rage-bait" as const,
  business_description: "",
  website_url: "",
  char_min: 240,
  char_max: 480,
  target_audience: "",
  main_problem: "",
  key_features: "",
};

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("account_id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (accountId) {
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("threads_account_id", accountId)
      .maybeSingle();
    return NextResponse.json(prefs ?? DEFAULT_PREFS);
  }

  const { data: account } = await supabase
    .from("threads_accounts")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!account) {
    return NextResponse.json(DEFAULT_PREFS);
  }

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("threads_account_id", account.id)
    .maybeSingle();

  return NextResponse.json(prefs ?? DEFAULT_PREFS);
}

export async function PUT(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("account_id");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!accountId) {
    const { data: account } = await supabase
      .from("threads_accounts")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!account) {
      return NextResponse.json(
        { error: "No connected Threads account found" },
        { status: 404 }
      );
    }

    return handleUpsert(supabase, account.id, await req.json());
  }

  const { data: account } = await supabase
    .from("threads_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account) {
    return NextResponse.json(
      { error: "Threads account not found" },
      { status: 404 }
    );
  }

  return handleUpsert(supabase, account.id, await req.json());
}

async function handleUpsert(
  supabase: Awaited<ReturnType<typeof createClient>>,
  threadsAccountId: string,
  body: Record<string, unknown>
) {
  const rawTone = body.default_tone;
  const default_tone =
    typeof rawTone === "string" && VALID_TONES.includes(rawTone)
      ? rawTone
      : "rage-bait";
  const business_description =
    typeof body.business_description === "string"
      ? body.business_description
      : "";
  const website_url =
    typeof body.website_url === "string" ? body.website_url : "";

  const rawCharMin = body.char_min;
  const rawCharMax = body.char_max;
  const parsedMin = typeof rawCharMin === "number" ? rawCharMin : 240;
  const parsedMax = typeof rawCharMax === "number" ? rawCharMax : 480;
  const char_min = parsedMin >= 30 && parsedMin < parsedMax ? parsedMin : 240;
  const char_max = parsedMax <= 500 && parsedMax > parsedMin ? parsedMax : 480;

  const target_audience =
    typeof body.target_audience === "string" ? body.target_audience : "";
  const main_problem =
    typeof body.main_problem === "string" ? body.main_problem : "";
  const key_features =
    typeof body.key_features === "string" ? body.key_features : "";

  const { data: prefs, error: upsertError } = await supabase
    .from("user_preferences")
    .upsert(
      {
        threads_account_id: threadsAccountId,
        default_tone,
        business_description,
        website_url,
        char_min,
        char_max,
        target_audience,
        main_problem,
        key_features,
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
    target_audience: prefs!.target_audience,
    main_problem: prefs!.main_problem,
    key_features: prefs!.key_features,
  });
}
