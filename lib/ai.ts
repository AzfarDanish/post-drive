import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export type Tone = "rage-bait" | "hot-take" | "storytelling" | "educational";

function getOpenAI() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const writingStyle = `# FOLLOW THIS WRITING STYLE:

• Write at B2 level or below. Simple English. Short words. No advanced vocabulary.
• Broken grammar is okay. Choppy sentences. Imperfect structure.
• Use short, simple sentences.
• Each post can have multiple paragraphs. Separate paragraphs with a blank line.
• Each paragraph must have at least 3 sentences.
• The first post in the thread must be longer than the other posts.
• Speak directly to the reader. Use "you" and "your".
• If a website URL is provided, include it as a link at the end of the final post.
• AVOID questions. Do not ask the reader anything.
• AVOID metaphors and clichés.
• AVOID generalizations.
• AVOID hashtags.
• AVOID unnecessary adjectives and adverbs.
• AVOID these words:
"can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, delve, embark, enlightening, esteemed, shed light, craft, crafting, imagine, realm, game-changer, unlock, discover, skyrocket, abyss, not alone, in a world where, revolutionize, disruptive, utilize, utilizing, dive deep, tapestry, illuminate, unveil, pivotal, intricate, elucidate, hence, furthermore, realm, however, harness, exciting, groundbreaking, cutting-edge, remarkable, it, remains to be seen, glimpse into, navigating, landscape, stark, testament, in summary, in conclusion, moreover, boost, skyrocketing, opened up, powerful, inquiries, ever-evolving"

# SOCIAL MEDIA CAPTION BEST PRACTICES (follow these strictly):
• Include a clear call-to-action — tell the audience exactly what to do next (visit website, share thoughts, tag someone, claim discount, etc.)
• Lead with a strong opening line — the first sentence must grab attention (bold statement or relatable observation)
• Tell a story — create connection through a single moment, insight, or transformation
• Know your audience — speak to their needs, interests, and pain points

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

Example output format (follow this format exactly):
First paragraph of first post. This is the second sentence. This is the third sentence.

Second paragraph of first post. Sentence two. Sentence three.
---
Second post first paragraph. Sentence two. Sentence three. Sentence four.
---
Third post text here. Sentence two. Sentence three.`;
}

const systemPrompts: Record<Tone, string> = {
  "rage-bait": tonePrompt(`- Post 1: A strong opinionated hook that grabs attention. Do NOT mention the business yet.
- Final post: Reveal what the business does as the natural solution. End with a bold statement.
- Sound like a human, not a brand. No corporate language.`),

  "hot-take": tonePrompt(`- Post 1: A contrarian take that challenges what most people assume. Do NOT mention the business yet.
- Final post: Reveal what the business does as the natural solution. End with a confident statement.
- Sound definitive. No corporate language.`),

  storytelling: tonePrompt(`- Post 1: A short relatable moment or anecdote that hooks the reader. Do NOT mention the business yet.
- Middle posts: Build the story.
- Final post: Reveal what the business does as the natural solution. End with a reflective line.
- Sound personal and real. No corporate language.`),

  educational: tonePrompt(`- Post 1: A specific useful insight or little-known fact. Do NOT mention the business yet.
- Middle posts: Build the insight.
- Final post: Reveal what the business does as the natural solution. End with a clear takeaway.
- Sound like someone who knows their stuff. No corporate language.`),
};

export async function generatePost(
  businessDescription: string,
  websiteUrl?: string,
  tone: Tone = "rage-bait",
  charMin: number = 240,
  charMax: number = 480
): Promise<string[]> {
  let context = `Business description: ${businessDescription}`;

  if (websiteUrl) {
    context += `\n\nWebsite URL: ${websiteUrl}`;
  }

  const openai = getOpenAI();

  let system = systemPrompts[tone];
  system += `\n\n- Each post between ${charMin} and ${charMax} characters.`;

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
