import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export type Tone = "rage-bait" | "hot-take" | "storytelling" | "educational";

function getOpenAI() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const writingStyle = `# FOLLOW THIS WRITING STYLE:

• SHOULD use clear, simple language.
• SHOULD be spartan and informative.
• SHOULD use short, impactful sentences.
• SHOULD use active voice; avoid passive voice.
• SHOULD focus on practical, actionable insights.
• SHOULD use bullet point lists in social media posts.
• SHOULD use data and examples to support claims when possible.
• SHOULD use "you" and "your" to directly address the reader.
• AVOID using em dashes (—) anywhere in your response. Use only commas, periods, or other standard punctuation. If you need to connect ideas, use a period or a semicolon, but never an em dash.
• AVOID constructions like "...not just this, but also this".
• AVOID metaphors and clichés.
• AVOID generalizations.
• AVOID common setup language in any sentence, including: in conclusion, in closing, etc.
• AVOID output warnings or notes, just the output requested.
• AVOID unnecessary adjectives and adverbs.
• AVOID hashtags.
• AVOID semicolons.
• AVOID markdown.
• AVOID asterisks.
• AVOID these words:
"can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it, remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving"

# IMPORTANT: No em dashes. The only exception is using "---" as the thread post separator between posts.`;

function tonePrompt(rules: string): string {
  return `${writingStyle}

You are a writer who crafts viral Threads threads.

Write a thread of 2-4 posts based on the business information provided.
No emojis. No marketing.

Rules:
${rules}
- Separate each post with exactly three hyphens "---" on its own line. No blank lines before or after. No spaces around it. Just "---" alone on its line.
- The "---" separator is the only exception to the no-em-dash rule.

Example output format (exactly this format, no extra blank lines):
First post text here...
---
Second post text here...
---
Third post text here...`;
}

const systemPrompts: Record<Tone, string> = {
  "rage-bait": tonePrompt(`- Post 1: A strong opinionated hook that grabs attention. Do NOT mention the business yet.
- Final post: Reveal what the business does as the natural solution. End with a question or provocative statement.
- Sound like a human, not a brand. No corporate language.`),

  "hot-take": tonePrompt(`- Post 1: A contrarian take that challenges what most people assume. Do NOT mention the business yet.
- Final post: Reveal what the business does as the natural solution. End with a question or provocative statement.
- Sound confident and definitive. No corporate language.`),

  storytelling: tonePrompt(`- Post 1: A short relatable moment or anecdote that hooks the reader. Do NOT mention the business yet.
- Middle posts: Build the story.
- Final post: Reveal what the business does as the natural solution. End with a reflective line or question.
- Sound personal and real. No corporate language.`),

  educational: tonePrompt(`- Post 1: A specific useful insight or little-known fact. Do NOT mention the business yet.
- Middle posts: Build the insight.
- Final post: Reveal what the business does as the natural solution. End with a takeaway or question.
- Sound like advice from someone who knows their stuff. No corporate language.`),
};

export async function generatePost(
  businessDescription: string,
  websiteUrl?: string,
  tone: Tone = "rage-bait"
): Promise<string[]> {
  let context = `Business description: ${businessDescription}`;

  if (websiteUrl) {
    try {
      const resp = await fetch(websiteUrl, {
        headers: { "User-Agent": "Post-Drive/1.0" },
        signal: AbortSignal.timeout(10_000),
      });
      const html = await resp.text();
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[^;]+;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);

      if (text.length > 50) {
        context += `\n\nWebsite content:\n${text}`;
      }
    } catch {
      context += "\n\n(Note: could not fetch website content)";
    }
  }

  const openai = getOpenAI();

  let system = systemPrompts[tone];
  system += "\n\n- Each post under 500 characters.";

  const { text: generated } = await generateText({
    model: openai("gpt-4o-mini"),
    system,
    prompt: context,
    temperature: 0.8,
  });

  const raw = generated.trim();
  const cleaned = raw.replace(/^---\s*\n?/, "").replace(/\n?\s*---$/, "");
  const posts = cleaned
    .split(/\n\s*---\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return posts.length > 0 ? posts : [raw];
}
