import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { generateAndProcessPosts } from "@/lib/generate";
import { publishAsAccount } from "@/lib/publish";
import type { Tone } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";

  const { data: accounts } = await getSupabase()
    .from("threads_accounts")
    .select("*")
    .eq("is_enabled", true);

  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ message: "No enabled accounts" });
  }

  const results: { accountId: string; success: boolean; error?: string }[] = [];

  for (const account of accounts) {
    try {
      const { data: prefs } = await getSupabase()
        .from("user_preferences")
        .select("*")
        .eq("threads_account_id", account.id)
        .maybeSingle();

      if (!prefs || !prefs.business_description) {
        results.push({ accountId: account.id, success: false, error: "no preferences" });
        continue;
      }

      const { data: history } = await getSupabase()
        .from("post_log")
        .select("posts")
        .eq("threads_account_id", account.id)
        .eq("was_published", true)
        .order("created_at", { ascending: false })
        .limit(5);

      const recentPostSummaries = (history ?? [])
        .map((row) => {
          const posts = row.posts as string[];
          return posts?.[0]?.slice(0, 140);
        })
        .filter((s): s is string => Boolean(s));

      const posts = await generateAndProcessPosts({
        businessDescription: prefs.business_description,
        websiteUrl: prefs.website_url || undefined,
        tone: (prefs.default_tone as Tone) || "rage-bait",
        charMin: prefs.char_min || 240,
        charMax: prefs.char_max || 480,
        targetAudience: prefs.target_audience || undefined,
        mainProblem: prefs.main_problem || undefined,
        keyFeatures: prefs.key_features || undefined,
        recentPostSummaries,
      });

      let result;
      if (dryRun) {
        result = { success: false, post_ids: [], published_count: 0 };
      } else {
        result = await publishAsAccount(posts, undefined, account);
      }

      await getSupabase().from("post_log").insert({
        posts: JSON.parse(JSON.stringify(posts)),
        was_published: result.success,
        error: result.success ? null : result.error || null,
        threads_account_id: account.id,
      });

      if (result.success) {
        await getSupabase()
          .from("threads_accounts")
          .update({ last_posted_at: new Date().toISOString() })
          .eq("id", account.id);
      }

      results.push({ accountId: account.id, success: result.success, error: result.error });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await getSupabase().from("post_log").insert({
        posts: [],
        was_published: false,
        error: message,
        threads_account_id: account.id,
      });
      results.push({ accountId: account.id, success: false, error: message });
    }
  }

  return NextResponse.json({
    message: dryRun ? "dry-run complete" : "auto-post complete",
    dryRun,
    accountCount: accounts.length,
    results,
  });
}
