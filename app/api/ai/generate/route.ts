import { NextRequest, NextResponse } from "next/server";
import { generatePost, type Tone } from "@/lib/ai";

const validTones: Tone[] = ["rage-bait", "hot-take", "storytelling", "educational"];

export async function POST(req: NextRequest) {
  const { businessDescription, websiteUrl, tone } = await req.json();

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

  try {
    const posts = await generatePost(
      businessDescription,
      typeof websiteUrl === "string" && websiteUrl.trim()
        ? websiteUrl.trim()
        : undefined,
      resolvedTone
    );

    return NextResponse.json({ posts });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
