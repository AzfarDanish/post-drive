import { NextRequest, NextResponse } from "next/server";
import { generateAndProcessPosts, type GenerateOptions } from "@/lib/generate";
import type { Tone } from "@/lib/ai";

const validTones: Tone[] = ["rage-bait", "hot-take", "storytelling", "educational"];

export async function POST(req: NextRequest) {
  const { businessDescription, websiteUrl, tone, charMin, charMax, targetAudience, mainProblem, keyFeatures, recentPostSummaries } = await req.json();

  if (!businessDescription || typeof businessDescription !== "string") {
    return NextResponse.json(
      { error: "businessDescription is required" },
      { status: 400 }
    );
  }

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

    const posts = await generateAndProcessPosts(options);

    return NextResponse.json({ posts });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
