import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { generatePost, type Tone } from "@/lib/ai";

const validTones: Tone[] = ["rage-bait", "hot-take", "storytelling", "educational"];

function getOpenAI() {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const FIX_SYSTEM = `You help fix a single post in a Threads thread.
Respond with ONLY the fixed post text. No separators. No markdown. No extra formatting.
Write at B2 level or below. Simple English. Short words. Broken grammar is okay.
No questions. Keep the same tone and style as the surrounding posts.`;

function fixPrompt(
  businessDescription: string,
  posts: string[],
  index: number,
  charMin: number,
  charMax: number
): string {
  const context = posts
    .map((p, i) => {
      const label = i === index ? "THIS POST (needs fixing)" : `Post ${i + 1}`;
      return `${label}: ${p || "(empty)"}`;
    })
    .join("\n\n");

  return `Business: ${businessDescription}

Thread:
${context}

Fix Post ${index + 1} only. It must be between ${charMin} and ${charMax} characters.
Keep it connected to the posts above and below. Same tone and style.`;

}

export async function POST(req: NextRequest) {
  const { businessDescription, websiteUrl, tone, charMin, charMax } = await req.json();

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
    const rawPosts = await generatePost(
      businessDescription,
      typeof websiteUrl === "string" && websiteUrl.trim()
        ? websiteUrl.trim()
        : undefined,
      resolvedTone,
      resolvedCharMin,
      resolvedCharMax
    );

    const link = typeof websiteUrl === "string" ? websiteUrl.trim() : "";
    const openai = getOpenAI();
    const posts = await Promise.all(
      rawPosts.map(async (post, i) => {
        let cleaned = post.trim();

        if (cleaned.length >= resolvedCharMin && cleaned.length <= resolvedCharMax) {
          return cleaned;
        }

        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: FIX_SYSTEM,
          prompt: fixPrompt(
            businessDescription,
            rawPosts,
            i,
            resolvedCharMin,
            resolvedCharMax
          ),
          temperature: 0.7,
        });

        const fixed = text.trim().slice(0, resolvedCharMax);

        if (fixed.length >= resolvedCharMin && fixed.length <= resolvedCharMax) {
          return fixed;
        }

        if (fixed.length > resolvedCharMax) {
          const trimmed = fixed.slice(0, resolvedCharMax);
          const lastSpace = trimmed.lastIndexOf(" ");
          if (lastSpace > resolvedCharMin) return trimmed.slice(0, lastSpace);
          return trimmed;
        }

        if (fixed.length < resolvedCharMin && link && !fixed.includes(link)) {
          return fixed + "\n\n" + link;
        }

        return cleaned;
      })
    );

    return NextResponse.json({ posts });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
