import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { generatePost, splitPostByCharLimit, stripLeadingPostLabel, type Tone } from "@/lib/ai";

const FIX_SYSTEM = `You help fix a single post for Threads.
Respond with ONLY the corrected post text and nothing else.
Do not include any label or prefix.
No markdown. No quotation marks around the text.
Write at B2 level or below. Simple English. Short words. Broken grammar is okay.
No questions.`;

function fixPrompt(
  businessDescription: string,
  post: string,
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

  return `${biz}

Post to fix:
${post}

Rewrite this post. Output only the corrected text, no label, no prefix.
It must be between ${charMin} and ${charMax} characters. Keep the same tone and style.`;
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
  recentPostSummaries?: string[];
}

export async function generateAndProcessPosts(
  options: GenerateOptions
): Promise<string> {
  const {
    businessDescription,
    websiteUrl,
    tone,
    charMin,
    charMax,
    targetAudience,
    mainProblem,
    keyFeatures,
    recentPostSummaries,
  } = options;

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let post = await generatePost(
    businessDescription,
    websiteUrl,
    tone,
    charMin,
    charMax,
    targetAudience,
    mainProblem,
    keyFeatures,
    recentPostSummaries
  );

  const link = websiteUrl || "";

  if (post.length > charMax) {
    post = stripLeadingPostLabel(post.slice(0, charMax));
  }

  if (post.length < charMin) {
    if (link && !post.includes(link)) {
      const withLink = post + "\n\n" + link;
      if (withLink.length >= charMin && withLink.length <= charMax) {
        post = withLink;
      }
    }
  }

  if (post.length < charMin) {
    let fixed: string | null = null;
    let lastAttempt = post;

    for (let attempt = 0; attempt < 3 && !fixed; attempt++) {
      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: FIX_SYSTEM,
          prompt:
            fixPrompt(businessDescription, post, charMin, charMax, targetAudience, mainProblem, keyFeatures) +
            (attempt > 0
              ? `\n\nYour last attempt was ${lastAttempt.length} characters. That is under the ${charMin} minimum. Add more relevant detail. Do not pad with filler.`
              : ""),
          temperature: 0.7,
          frequencyPenalty: 0.4,
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
      post = fixed;
    } else {
      console.warn(
        `Post stayed under charMin (${charMin}) after all fallbacks. Published at ${post.length} characters.`
      );
    }
  }

  return post;
}
