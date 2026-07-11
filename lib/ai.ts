import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export type Tone = "rage-bait" | "hot-take" | "storytelling" | "educational";

function getOpenAI() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const CONTENT_ANGLES = [
  "one specific pain point the audience feels day to day, described concretely",
  "one specific feature, explained only through what it lets someone do",
  "a mistake people commonly make without this kind of solution",
  "a before and after moment, one specific change, not the whole journey",
  "a myth or wrong assumption people have about the problem being solved",
  "a quick practical tip related to the problem, not a pitch",
  "a short personal-sounding observation about the problem",
];

function pickAngle(exclude: string[] = []): string {
  const pool = CONTENT_ANGLES.filter((a) => !exclude.includes(a));
  const options = pool.length > 0 ? pool : CONTENT_ANGLES;
  return options[Math.floor(Math.random() * options.length)];
}

const writingStyle = `# FOLLOW THIS WRITING STYLE:

• Write at B2 level or below. Simple English. Short words. No advanced vocabulary.
• Broken grammar is okay. Choppy sentences. Imperfect structure.
• Use short, simple sentences.
• Each post can have multiple paragraphs. Separate paragraphs with a blank line.
• Each paragraph must have at least 3 sentences.
• Speak directly to the reader. Use "you" and "your".
• If a website URL is provided, include it at the end of the post.
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

# IMPORTANT: No em dashes.`;

function tonePrompt(rules: string): string {
  return `${writingStyle}

You are a writer who crafts viral posts for Threads.

Write a single post based on the business information provided.
No emojis. No marketing.

Rules:
${rules}
- Output only the post text. No labels, no prefixes, no separators.`;
}

const systemPrompts: Record<Tone, string> = {
  "rage-bait": tonePrompt(`- Start with a strong opinionated hook that grabs attention.
- Reveal what the business does as the natural solution halfway through.
- End with a bold statement.
- Sound like a human, not a brand. No corporate language.`),

  "hot-take": tonePrompt(`- Start with a contrarian take that challenges what most people assume.
- Reveal what the business does as the natural solution halfway through.
- End with a confident statement.
- Sound definitive. No corporate language.`),

  storytelling: tonePrompt(`- Open with a short relatable moment or anecdote that hooks the reader.
- Build the story through the middle.
- Reveal what the business does as the natural solution near the end.
- End with a reflective line.
- Sound personal and real. No corporate language.`),

  educational: tonePrompt(`- Open with a specific useful insight or little-known fact.
- Build the insight through the middle.
- Reveal what the business does as the natural solution near the end.
- End with a clear takeaway.
- Sound like someone who knows their stuff. No corporate language.`),
};

export async function generatePost(
  businessDescription: string,
  websiteUrl?: string,
  tone: Tone = "rage-bait",
  charMin: number = 240,
  charMax: number = 480,
  targetAudience?: string,
  mainProblem?: string,
  keyFeatures?: string,
  recentPostSummaries?: string[]
): Promise<string> {
  let context = `Business description: ${businessDescription}`;

  if (websiteUrl) {
    context += `\n\nWebsite URL: ${websiteUrl}`;
  }
  if (targetAudience) {
    context += `\n\nTarget audience: ${targetAudience}`;
  }
  if (mainProblem) {
    context += `\n\nMain problem they solve: ${mainProblem}`;
  }
  if (keyFeatures) {
    context += `\n\nKey features: ${keyFeatures}`;
  }

  const openai = getOpenAI();
  const angle = pickAngle(recentPostSummaries?.map(s => s.slice(0, 140)) || []);

  let system = systemPrompts[tone];
  system += `\n\n- The post must be between ${charMin} and ${charMax} characters. This is a hard limit, not a target.`;
  system += `\n\n- Focus only on this angle: ${angle}. Mention only the part of the business relevant to this angle. Do not restate the full business description or list every feature. A brief, partial reference to what the business does is enough.`;

  if (recentPostSummaries && recentPostSummaries.length > 0) {
    system += `\n\n- Do not repeat these ideas, openings, or angles used in recent posts:\n${recentPostSummaries.map((s) => `- ${s}`).join("\n")}\n- Write about something clearly different from all of the above.`;
  }

  const { text: generated } = await generateText({
    model: openai("gpt-4o-mini"),
    system,
    prompt: context,
    temperature: 0.9,
    frequencyPenalty: 0.4,
  });

  return stripLeadingPostLabel(generated.trim());
}

function splitIntoSentences(paragraph: string): string[] {
  const matches = paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
  const sentences = matches
    ? matches.map((s) => s.trim()).filter(Boolean)
    : [paragraph.trim()];
  return sentences.length > 0 ? sentences : [paragraph.trim()];
}

function splitLongSentenceByWords(sentence: string, charMax: number): string[] {
  const words = sentence.split(" ");
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= charMax) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = word.length <= charMax ? word : word.slice(0, charMax);
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

interface SentencePiece {
  text: string;
  newParagraph: boolean;
}

function tokenizeSentences(text: string): SentencePiece[] {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const pieces: SentencePiece[] = [];

  paragraphs.forEach((paragraph) => {
    const matches = paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
    const sentences = matches ? matches.map((s) => s.trim()).filter(Boolean) : [paragraph];
    sentences.forEach((sentence, i) => {
      pieces.push({ text: sentence, newParagraph: i === 0 });
    });
  });

  return pieces.length > 0 ? pieces : [{ text, newParagraph: true }];
}

export function stripLeadingPostLabel(text: string): string {
  return text
    .replace(/^\s*(?:\*\*)?post\s*\d+(?:\s*of\s*\d+)?(?:\*\*)?\s*[:.\-]\s*/i, "")
    .trim();
}

export function splitPostByCharLimit(text: string, charMin: number, charMax: number): string[] {
  const pieces = tokenizeSentences(text);
  const total = text.length;
  const numChunks = Math.max(1, Math.ceil(total / charMax));
  const targetSize = total / numChunks;

  const chunks: string[] = [];
  let current = "";

  pieces.forEach((piece) => {
    const oversizedSentence = piece.text.length > charMax;
    const parts = oversizedSentence ? splitLongSentenceByWords(piece.text, charMax) : [piece.text];

    parts.forEach((part, partIndex) => {
      const moreChunksToFill = chunks.length < numChunks - 1;
      const separator = current === "" ? "" : piece.newParagraph && partIndex === 0 ? "\n\n" : " ";
      const candidate = `${current}${separator}${part}`;

      const overCharMax = candidate.length > charMax;
      const pastTarget = current.length >= targetSize && moreChunksToFill;

      if (current && (overCharMax || pastTarget)) {
        chunks.push(current);
        current = part;
      } else {
        current = candidate;
      }
    });
  });

  if (current) chunks.push(current);

  for (let i = chunks.length - 1; i > 0; i--) {
    if (chunks[i].length < charMin) {
      const merged = `${chunks[i - 1]} ${chunks[i]}`;
      if (merged.length <= charMax) {
        chunks[i - 1] = merged;
        chunks.splice(i, 1);
      }
    }
  }

  return chunks;
}
