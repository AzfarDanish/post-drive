import { NextRequest, NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { generatePost, splitPostByCharLimit, stripLeadingPostLabel, type Tone } from "@/lib/ai";

const validTones: Tone[] = ["rage-bait", "hot-take", "storytelling", "educational"];

function getOpenAI() {
  return createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const FIX_SYSTEM = `You help fix a single post in a Threads thread.
Respond with ONLY the corrected post text and nothing else.
Do not include any label, prefix, or number like "Post 1" or "Reply 2".
No separators. No markdown. No quotation marks around the text.
Write at B2 level or below. Simple English. Short words. Broken grammar is okay.
No questions. Keep the same tone and style as the surrounding posts.`;

function fixPrompt(
  businessDescription: string,
  posts: string[],
  index: number,
  charMin: number,
  charMax: number,
  targetAudience?: string,
  mainProblem?: string,
  keyFeatures?: string
): string {
  let biz = `Business: ${businessDescription}`;
  if (targetAudience) biz += `\nTarget audience: ${targetAudience}`;
  if (mainProblem) biz += `\nMain problem: ${mainProblem}`;
  if (keyFeatures) biz += `\nKey features: ${keyFeatures}`;

  const context = posts
    .map((p, i) => {
      if (i === index) return `[POST TO FIX]\n${p || "(empty)"}`;
      return `[CONTEXT POST]\n${p}`;
    })
    .join("\n\n");

  return `${biz}

Thread:
${context}

Rewrite the post marked [POST TO FIX]. Output only the corrected text, no label, no prefix.
It must be between ${charMin} and ${charMax} characters.
Keep it connected to the surrounding context posts. Same tone and style.`;
}

export async function POST(req: NextRequest) {
  const { businessDescription, websiteUrl, tone, charMin, charMax, targetAudience, mainProblem, keyFeatures } = await req.json();

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
      resolvedCharMax,
      typeof targetAudience === "string" ? targetAudience.trim() || undefined : undefined,
      typeof mainProblem === "string" ? mainProblem.trim() || undefined : undefined,
      typeof keyFeatures === "string" ? keyFeatures.trim() || undefined : undefined,
    );

    const link = typeof websiteUrl === "string" ? websiteUrl.trim() : "";
    const openai = getOpenAI();

    const posts: string[] = [];
    for (const post of rawPosts) {
      let cleaned = stripLeadingPostLabel(post.trim());

      if (cleaned.length > resolvedCharMax) {
        const chunks = splitPostByCharLimit(cleaned, resolvedCharMin, resolvedCharMax).map(stripLeadingPostLabel);

        for (let i = 0; i < chunks.length - 1; i++) {
          posts.push(chunks[i]);
        }

        let remainder = chunks[chunks.length - 1];

        if (remainder.length < resolvedCharMin && link && !remainder.includes(link)) {
          const withLink = remainder + "\n\n" + link;
          if (withLink.length >= resolvedCharMin && withLink.length <= resolvedCharMax) {
            remainder = withLink;
          }
        }

        if (remainder.length < resolvedCharMin) {
          let fixed: string | null = null;
          let lastAttempt = remainder;

          for (let attempt = 0; attempt < 3 && !fixed; attempt++) {
            try {
              const { text } = await generateText({
                model: openai("gpt-4o-mini"),
                system: FIX_SYSTEM,
                prompt:
                  fixPrompt(
                    businessDescription,
                    [...rawPosts, ""],
                    rawPosts.length,
                    resolvedCharMin,
                    resolvedCharMax,
                    typeof targetAudience === "string" ? targetAudience.trim() || undefined : undefined,
                    typeof mainProblem === "string" ? mainProblem.trim() || undefined : undefined,
                    typeof keyFeatures === "string" ? keyFeatures.trim() || undefined : undefined,
                  ) +
                  (attempt > 0
                    ? `\n\nYour last attempt was ${lastAttempt.length} characters. That is under the ${resolvedCharMin} minimum. Add more relevant detail. Do not pad with filler.`
                    : ""),
                temperature: 0.7,
              });
              const candidate = stripLeadingPostLabel(text.trim()).slice(0, resolvedCharMax);
              lastAttempt = candidate;
              if (candidate.length >= resolvedCharMin) {
                fixed = candidate;
              }
            } catch {
              // try again on next loop iteration
            }
          }

          if (fixed) {
            remainder = fixed;
          } else {
            const previous = posts[posts.length - 1];
            const merged = previous ? `${previous}\n\n${remainder}` : remainder;
            if (previous && merged.length <= resolvedCharMax) {
              posts[posts.length - 1] = merged;
              remainder = "";
            } else {
              console.warn(
                `Post stayed under charMin (${resolvedCharMin}) after all fallbacks. Published at ${remainder.length} characters.`
              );
            }
          }
        }

        if (remainder) {
          posts.push(remainder);
        }
      } else {
        posts.push(cleaned);
      }
    }

    return NextResponse.json({ posts });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
