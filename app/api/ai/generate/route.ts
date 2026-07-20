import { NextRequest, NextResponse } from "next/server";
import { generateAndProcessPosts, type GenerateOptions } from "@/lib/generate";
import { generateXThread } from "@/lib/threads";
import type { Tone } from "@/lib/ai";
import type { XTone } from "@/lib/threads";

const validTones: Tone[] = ["rage-bait", "hot-take", "storytelling", "educational"];
const validXTones: XTone[] = ["authority", "storyteller", "contrarian", "educator"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { format, businessDescription, websiteUrl, tone, charMin, charMax, targetAudience, mainProblem, keyFeatures, recentPostSummaries } = body;

  if (!businessDescription || typeof businessDescription !== "string") {
    return NextResponse.json(
      { error: "businessDescription is required" },
      { status: 400 }
    );
  }

  const outputFormat = format === "thread" ? "thread" : "post";

  // Handle X thread generation
  if (outputFormat === "thread") {
    const resolvedTone: XTone =
      typeof tone === "string" && validXTones.includes(tone as XTone)
        ? (tone as XTone)
        : "authority";

    try {
      const thread = await generateXThread(
        businessDescription,
        typeof websiteUrl === "string" ? websiteUrl.trim() || undefined : undefined,
        resolvedTone,
        typeof targetAudience === "string" ? targetAudience.trim() || undefined : undefined,
        typeof mainProblem === "string" ? mainProblem.trim() || undefined : undefined,
        typeof keyFeatures === "string" ? keyFeatures.trim() || undefined : undefined,
      );

      return NextResponse.json({ thread });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "X thread generation failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Single post generation (original behavior)
  const resolvedTone: Tone =
    typeof tone === "string" && validTones.includes(tone as Tone)
      ? (tone as Tone)
      : "rage-bait";
  const resolvedCharMin =
    typeof charMin === "number" && charMin >= 30 ? charMin : 240;
  const resolvedCharMax =
    typeof charMax === "number" && charMax <= 500 && charMax > resolvedCharMin
      ? charMax
      : 480;

  try {
    const options: GenerateOptions = {
      businessDescription,
      websiteUrl: typeof websiteUrl === "string" ? websiteUrl.trim() || undefined : undefined,
      tone: resolvedTone,
      charMin: resolvedCharMin,
      charMax: resolvedCharMax,
      targetAudience: typeof targetAudience === "string" ? targetAudience.trim() || undefined : undefined,
      mainProblem: typeof mainProblem === "string" ? mainProblem.trim() || undefined : undefined,
      keyFeatures: typeof keyFeatures === "string" ? keyFeatures.trim() || undefined : undefined,
      recentPostSummaries: Array.isArray(recentPostSummaries) ? recentPostSummaries.filter((s): s is string => typeof s === "string" && s.length > 0) : undefined,
    };

    const post = await generateAndProcessPosts(options);

    return NextResponse.json({ post });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
