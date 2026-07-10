import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { generatePost, splitPostByCharLimit, stripLeadingPostLabel, type Tone } from "@/lib/ai";

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

export interface GenerateOptions {
  businessDescription: string;
  websiteUrl?: string;
  tone: Tone;
  charMin: number;
  charMax: number;
  targetAudience?: string;
  mainProblem?: string;
  keyFeatures?: string;
}

export async function generateAndProcessPosts(
  options: GenerateOptions
): Promise<string[]> {
  const {
    businessDescription,
    websiteUrl,
    tone,
    charMin,
    charMax,
    targetAudience,
    mainProblem,
    keyFeatures,
  } = options;

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const rawPosts = await generatePost(
    businessDescription,
    websiteUrl,
    tone,
    charMin,
    charMax,
    targetAudience,
    mainProblem,
    keyFeatures
  );

  const link = websiteUrl || "";
  const posts: string[] = [];

  for (const post of rawPosts) {
    let cleaned = stripLeadingPostLabel(post.trim());

    if (cleaned.length > charMax) {
      const chunks = splitPostByCharLimit(cleaned, charMin, charMax).map(stripLeadingPostLabel);

      for (let i = 0; i < chunks.length - 1; i++) {
        posts.push(chunks[i]);
      }

      let remainder = chunks[chunks.length - 1];

      if (remainder.length < charMin && link && !remainder.includes(link)) {
        const withLink = remainder + "\n\n" + link;
        if (withLink.length >= charMin && withLink.length <= charMax) {
          remainder = withLink;
        }
      }

      if (remainder.length < charMin) {
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
                  charMin,
                  charMax,
                  targetAudience,
                  mainProblem,
                  keyFeatures
                ) +
                (attempt > 0
                  ? `\n\nYour last attempt was ${lastAttempt.length} characters. That is under the ${charMin} minimum. Add more relevant detail. Do not pad with filler.`
                  : ""),
              temperature: 0.7,
            });
            const candidate = stripLeadingPostLabel(text.trim()).slice(0, charMax);
            lastAttempt = candidate;
            if (candidate.length >= charMin) {
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
          if (previous && merged.length <= charMax) {
            posts[posts.length - 1] = merged;
            remainder = "";
          } else {
            console.warn(
              `Post stayed under charMin (${charMin}) after all fallbacks. Published at ${remainder.length} characters.`
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

  return posts;
}
