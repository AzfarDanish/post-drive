"use client";

import { useState, type KeyboardEvent } from "react";
import type { Preferences } from "@/hooks/use-preferences";

type Tone = "rage-bait" | "hot-take" | "storytelling" | "educational";

const TONES: { id: Tone; label: string }[] = [
  { id: "rage-bait", label: "Rage Bait" },
  { id: "hot-take", label: "Hot Take" },
  { id: "storytelling", label: "Storytelling" },
  { id: "educational", label: "Educational" },
];

const SLIDER_MIN = 30;
const SLIDER_MAX = 500;

const textareaClass =
  "w-full rounded-xl border border-[#E4DFD3] bg-[#FDFCF9] px-3 py-2 text-sm text-[#1D1B18] placeholder:text-[#A39C8C] focus:outline-none focus:ring-2 focus:ring-[#2F4468]/25 focus:border-[#2F4468] resize-vertical disabled:bg-[#F1EEE6] disabled:text-[#A39C8C] transition-colors";

const secondaryButtonClass =
  "rounded-xl border border-[#E4DFD3] px-4 py-2 text-sm font-medium text-[#57534A] hover:bg-[#F1EEE6] hover:text-[#1D1B18] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const eyebrowClass =
  "text-xs font-semibold uppercase tracking-wide text-[#57534A] [font-family:var(--font-mono)]";

interface AiGeneratorPanelProps {
  preferences?: Preferences;
  prefsLoading: boolean;
  prefsValidating: boolean;
  activeAccountId: string | null;
  onSavePrefs: (prefs: Partial<Preferences>) => Promise<void>;
  onGenerate: (params: GenerateParams) => Promise<void>;
  aiStatus: "idle" | "generating" | "done" | "error";
  aiError: string;
}

export interface GenerateParams {
  businessDescription: string;
  websiteUrl?: string;
  tone: Tone;
  charMin: number;
  charMax: number;
  targetAudience?: string;
  mainProblem?: string;
  keyFeatures?: string;
}

export function AiGeneratorPanel({
  preferences,
  prefsLoading,
  prefsValidating,
  onSavePrefs,
  onGenerate,
  aiStatus,
  aiError,
}: AiGeneratorPanelProps) {
  const [businessDescription, setBusinessDescription] = useState(
    preferences?.business_description ?? ""
  );
  const [targetAudience, setTargetAudience] = useState(
    preferences?.target_audience ?? ""
  );
  const [mainProblem, setMainProblem] = useState(
    preferences?.main_problem ?? ""
  );
  const [keyFeatures, setKeyFeatures] = useState(
    preferences?.key_features ?? ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(
    preferences?.website_url ?? ""
  );
  const [tone, setTone] = useState<Tone>(
    (preferences?.default_tone as Tone) ?? "rage-bait"
  );
  const [charMin, setCharMin] = useState(preferences?.char_min ?? 240);
  const [charMax, setCharMax] = useState(preferences?.char_max ?? 480);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  }

  async function handleSave() {
    setSaveStatus("saving");
    try {
      await onSavePrefs({
        default_tone: tone,
        business_description: businessDescription.trim(),
        website_url: websiteUrl.trim(),
        char_min: charMin,
        char_max: charMax,
        target_audience: targetAudience.trim(),
        main_problem: mainProblem.trim(),
        key_features: keyFeatures.trim(),
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleGenerate() {
    if (!businessDescription.trim()) return;
    await onGenerate({
      businessDescription: businessDescription.trim(),
      websiteUrl: websiteUrl.trim() || undefined,
      tone,
      charMin,
      charMax,
      targetAudience: targetAudience.trim() || undefined,
      mainProblem: mainProblem.trim() || undefined,
      keyFeatures: keyFeatures.trim() || undefined,
    });
  }

  if (prefsLoading) {
    return (
      <section className="lg:col-span-2 rounded-2xl border border-[#E4DFD3] bg-white shadow-sm p-6 space-y-5 h-fit">
        <h2 className={eyebrowClass}>AI Generator</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-20 rounded-xl bg-[#EDE8DC]" />
          <div className="h-20 rounded-xl bg-[#EDE8DC]" />
          <div className="h-20 rounded-xl bg-[#EDE8DC]" />
          <div className="h-20 rounded-xl bg-[#EDE8DC]" />
        </div>
      </section>
    );
  }

  return (
    <section className="lg:col-span-2 rounded-2xl border border-[#E4DFD3] bg-white shadow-sm p-6 space-y-5 h-fit">
      <div className="flex items-center justify-between">
        <h2 className={eyebrowClass}>AI Generator</h2>
        {prefsValidating && !prefsLoading && (
          <span className="text-xs text-[#A39C8C]">Refreshing...</span>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1D1B18]">
          What does your business do?
        </label>
        <textarea
          value={businessDescription}
          onChange={(e) => setBusinessDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. We sell organic coffee subscriptions..."
          rows={2}
          disabled={aiStatus === "generating"}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1D1B18]">
          Target audience{" "}
          <span className="text-[#A39C8C] font-normal">(optional)</span>
        </label>
        <textarea
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="e.g. Freelancers, small business owners"
          rows={2}
          disabled={aiStatus === "generating"}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1D1B18]">
          Main problem you solve{" "}
          <span className="text-[#A39C8C] font-normal">(optional)</span>
        </label>
        <textarea
          value={mainProblem}
          onChange={(e) => setMainProblem(e.target.value)}
          placeholder="e.g. People waste time on manual scheduling"
          rows={2}
          disabled={aiStatus === "generating"}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1D1B18]">
          Key features{" "}
          <span className="text-[#A39C8C] font-normal">(optional)</span>
        </label>
        <textarea
          value={keyFeatures}
          onChange={(e) => setKeyFeatures(e.target.value)}
          placeholder="e.g. Auto-scheduling, analytics, team collaboration"
          rows={2}
          disabled={aiStatus === "generating"}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1D1B18]">
          Website URL{" "}
          <span className="text-[#A39C8C] font-normal">(optional)</span>
        </label>
        <textarea
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
          rows={2}
          disabled={aiStatus === "generating"}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#1D1B18]">Tone</label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              disabled={aiStatus === "generating"}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                tone === t.id
                  ? "bg-[#2F4468] text-white border-[#2F4468]"
                  : "bg-white text-[#57534A] border-[#E4DFD3] hover:border-[#2F4468] hover:text-[#2F4468]"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[#1D1B18]">
            Min characters: {charMin}
          </label>
          <input
            type="range"
            min={SLIDER_MIN}
            max={charMax - 10}
            step={10}
            value={charMin}
            onChange={(e) => setCharMin(Number(e.target.value))}
            disabled={aiStatus === "generating"}
            className="w-full accent-[#2F4468]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-[#1D1B18]">
            Max characters: {charMax}
          </label>
          <input
            type="range"
            min={charMin + 10}
            max={SLIDER_MAX}
            step={10}
            value={charMax}
            onChange={(e) => setCharMax(Number(e.target.value))}
            disabled={aiStatus === "generating"}
            className="w-full accent-[#2F4468]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saveStatus === "saving" || prefsLoading}
          className={`${secondaryButtonClass} flex-1`}
        >
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
              ? "Saved!"
              : "Save as Defaults"}
        </button>

        <button
          onClick={handleGenerate}
          disabled={aiStatus === "generating" || !businessDescription.trim()}
          className="rounded-xl bg-[#B8862E] px-5 py-2 text-sm font-medium text-white hover:bg-[#9C7226] disabled:bg-[#D8C9A8] disabled:cursor-not-allowed transition-colors flex-1"
        >
          {aiStatus === "generating" ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            "Generate with AI"
          )}
        </button>
      </div>

      {aiStatus === "done" && (
        <button onClick={handleGenerate} className={`${secondaryButtonClass} w-full`}>
          Regenerate
        </button>
      )}

      {aiStatus === "generating" && (
        <p className="text-xs text-[#6B6459] flex items-center gap-1.5">
          <svg
            className="animate-pulse h-2.5 w-2.5 text-[#B8862E]"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
          Generating posts...
        </p>
      )}

      {aiStatus === "error" && (
        <div className="rounded-xl bg-[#FBEAE8] border border-[#F0C4BF] px-3 py-2 text-xs text-[#8A2A22]">
          {aiError}
        </div>
      )}
    </section>
  );
}
