import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateAndProcessPosts } from "@/lib/generate";
import { publishToThreads } from "@/lib/publish";
import type { Tone } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: account } = await supabase
    .from("threads_accounts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!account) {
    return NextResponse.json({ error: "No connected account" }, { status: 400 });
  }

  if (!account.is_enabled) {
    return NextResponse.json({ message: "Auto-post is disabled" });
  }

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("threads_account_id", account.id)
    .maybeSingle();

  if (!prefs || !prefs.business_description) {
    return NextResponse.json({ error: "No preferences configured" }, { status: 400 });
  }

  after(async () => {
    try {
      const posts = await generateAndProcessPosts({
        businessDescription: prefs.business_description,
        websiteUrl: prefs.website_url || undefined,
        tone: (prefs.default_tone as Tone) || "rage-bait",
        charMin: prefs.char_min || 240,
        charMax: prefs.char_max || 480,
        targetAudience: prefs.target_audience || undefined,
        mainProblem: prefs.main_problem || undefined,
        keyFeatures: prefs.key_features || undefined,
      });

      const result = await publishToThreads(posts);

      await supabase.from("post_log").insert({
        posts: JSON.parse(JSON.stringify(posts)),
        was_published: result.success,
        error: result.success ? null : result.error || null,
      });

      if (result.success) {
        await supabase
          .from("threads_accounts")
          .update({ last_posted_at: new Date().toISOString() })
          .eq("id", account.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await supabase.from("post_log").insert({
        posts: [],
        was_published: false,
        error: message,
      });
    }
  });

  return NextResponse.json({ message: "auto-post started" });
}
