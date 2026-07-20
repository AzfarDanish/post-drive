import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { stripLeadingPostLabel } from "./ai";

export type XTone = "authority" | "storyteller" | "contrarian" | "educator";

export interface XThreadTweet {
  index: number;
  section: "hook" | "context" | "reveal" | "proof" | "cta" | "close";
  text: string;
}

export interface XThread {
  tweets: XThreadTweet[];
  fullText: string;
}

const X_TONE_PROMPTS: Record<XTone, string> = {
  authority:
    "- Sound like an expert who has tested everything and settled on this.\n- Use specific numbers and results. No vague claims.\n- Confident tone. Definitive statements.",
  storyteller:
    "- Open with a short personal moment or observation.\n- Build narrative through the thread.\n- Sound like a real person sharing what they learned.",
  contrarian:
    "- Challenge a popular belief in the hook.\n- Back the take with specific reasoning.\n- End with a strong conviction statement.",
  educator:
    "- Lead with a surprising insight or little-known fact.\n- Break down why it matters.\n- End with a clear actionable takeaway.",
};

const THREAD_STRUCTURE = `You are an expert X (Twitter) thread writer who generates threads that stop the scroll and drive engagement.

Write a thread with 8-12 tweets following this exact structure:

TWEET 1 — HOOK
Purpose: Stop the scroll. Make people click "show thread".
Formulas: A statistic, a before/after contrast, or a direct promise.
Rules: Do not give everything away. Tease what comes next. No clickbait.

TWEETS 2-3 — CONTEXT
Purpose: Make the reader feel the problem.
Rules: Use "you" language. Describe the frustration or gap. Make it personal.

TWEETS 4-6 — REVEAL
Purpose: Introduce the product/service as the solution.
Rules: How it works (simple). What changed after using it (specific result).

TWEETS 7-9 — PROOF
Purpose: Build trust.
Rules: Personal results. Specific features used daily. Honest comparison.

TWEET 10 — ENGAGEMENT CTA
Purpose: Drive replies (X algorithm rewards threads with replies).
Formulas: Ask a question. Ask what they struggle with. Ask them to tag someone.

TWEETS 11-12 — CLOSE
Purpose: Summarize. Restate the core message. End with value.

IMPORTANT RULES:
- Do not use hashtags. They reduce engagement.
- Each tweet must stand alone. 1-3 sentences per tweet.
- Place any link in tweets 10-12, never in tweet 1.
- The affiliate/product link goes after value is delivered, never before.
- No emojis. No em dashes. No corporate language.
- Write at B2 level or below. Simple English. Short sentences.
- Sound like one human talking to another human.
- AVOID these words: "can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe, game-changer, unlock, revolutionize, disruptive, groundbreaking, cutting-edge, delve, embark, realm, utilize, tapestry, illuminate, unveil, pivotal, intricate, navigate, landscape, ever-evolving, in summary, in conclusion, moreover, boost, skyrocketing, powerful, exciting, remarkable"
`;

function getOpenAI() {
  // @ts-ignore
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function X_TONES_LIST(): { id: XTone; label: string }[] {
  return [
    { id: "authority", label: "Authority" },
    { id: "storyteller", label: "Storyteller" },
    { id: "contrarian", label: "Contrarian" },
    { id: "educator", label: "Educator" },
  ];
}

export async function generateXThread(
  businessDescription: string,
  websiteUrl?: string,
  tone: XTone = "authority",
  targetAudience?: string,
  mainProblem?: string,
  keyFeatures?: string
): Promise<XThread> {
  let context = `Business description: ${businessDescription}`;

  if (websiteUrl) context += `\n\nWebsite URL: ${websiteUrl}`;
  if (targetAudience) context += `\n\nTarget audience: ${targetAudience}`;
  if (mainProblem) context += `\n\nMain problem they solve: ${mainProblem}`;
  if (keyFeatures) context += `\n\nKey features: ${keyFeatures}`;

  const toneRules = X_TONE_PROMPTS[tone];

  const systemPrompt = `${THREAD_STRUCTURE}\n\n${toneRules}\n\nOutput the thread as numbered tweets in this format:\n\nTWEET 1:\n{text}\n\nTWEET 2:\n{text}\n\n...\n\nLabel each tweet with TWEET N: followed by the text. Output only the tweets, no additional commentary.`;

  const openai = getOpenAI();
  const { text: generated } = await generateText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    prompt: context,
    temperature: 0.8,
    frequencyPenalty: 0.3,
  });

  return parseThread(generated.trim());
}

function parseThread(raw: string): XThread {
  const sections: { label: string; section: XThreadTweet["section"] }[] = [
    { label: "TWEET 1", section: "hook" },
    { label: "TWEET 2", section: "context" },
    { label: "TWEET 3", section: "context" },
    { label: "TWEET 4", section: "reveal" },
    { label: "TWEET 5", section: "reveal" },
    { label: "TWEET 6", section: "reveal" },
    { label: "TWEET 7", section: "proof" },
    { label: "TWEET 8", section: "proof" },
    { label: "TWEET 9", section: "proof" },
    { label: "TWEET 10", section: "cta" },
    { label: "TWEET 11", section: "close" },
    { label: "TWEET 12", section: "close" },
  ];

  const tweets: XThreadTweet[] = [];
  const lines = raw.split("\n");
  let currentTweet: { label: string; textParts: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(/^TWEET\s+(\d+):/i);
    if (match) {
      if (currentTweet) {
        const idx = parseInt(match[1], 10) - 1;
        const sectionDef = sections[idx];
        if (sectionDef) {
          tweets.push({
            index: idx,
            section: sectionDef.section,
            text: stripLeadingPostLabel(currentTweet.textParts.join(" ").trim()),
          });
        }
      }
      currentTweet = { label: match[0], textParts: [line.replace(/^TWEET\s+\d+:\s*/i, "")] };
    } else if (currentTweet) {
      currentTweet.textParts.push(line);
    }
  }

  // Push last tweet
  if (currentTweet) {
    const lastIdx = tweets.length;
    const sectionDef = sections[lastIdx];
    if (sectionDef) {
      tweets.push({
        index: lastIdx,
        section: sectionDef.section,
        text: stripLeadingPostLabel(currentTweet.textParts.join(" ").trim()),
      });
    }
  }

  // Fallback: split by blank lines if parse failed
  if (tweets.length < 3) {
    return fallbackParse(raw, sections);
  }

  const fullText = tweets.map((t, i) => `TWEET ${i + 1}:\n${t.text}`).join("\n\n");

  return { tweets, fullText };
}

function fallbackParse(raw: string, sections: { label: string; section: XThreadTweet["section"] }[]): XThread {
  const blocks = raw.split(/\n\s*\n/).filter((b) => b.trim());
  const tweets: XThreadTweet[] = blocks.slice(0, sections.length).map((text, i) => ({
    index: i,
    section: sections[i].section,
    text: stripLeadingPostLabel(text.trim()),
  }));

  const fullText = tweets.map((t, i) => `TWEET ${i + 1}:\n${t.text}`).join("\n\n");
  return { tweets, fullText };
}
