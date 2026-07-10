"use client";

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from "react";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

type Tone = "rage-bait" | "hot-take" | "storytelling" | "educational";

const TONES: { id: Tone; label: string }[] = [
  { id: "rage-bait", label: "Rage Bait" },
  { id: "hot-take", label: "Hot Take" },
  { id: "storytelling", label: "Storytelling" },
  { id: "educational", label: "Educational" },
];

interface PostMedia {
  status: "none" | "uploading" | "uploaded" | "error";
  url?: string;
  mediaType?: "IMAGE" | "VIDEO";
  previewUrl?: string;
  fileName?: string;
  error?: string;
}

interface OgData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

const SLIDER_MIN = 30;
const SLIDER_MAX = 500;

// Shared style tokens. Kept as plain strings so every field, card, and
// button pulls from one place instead of re-typing the same class list.
const textareaClass =
  "w-full rounded-xl border border-[#E4DFD3] bg-[#FDFCF9] px-3 py-2 text-sm text-[#1D1B18] placeholder:text-[#A39C8C] focus:outline-none focus:ring-2 focus:ring-[#2F4468]/25 focus:border-[#2F4468] resize-vertical disabled:bg-[#F1EEE6] disabled:text-[#A39C8C] transition-colors";

const postTextareaClass =
  "post-textarea w-full rounded-xl border border-[#E4DFD3] bg-white px-3 py-2.5 text-sm text-[#1D1B18] placeholder:text-[#A39C8C] focus:outline-none focus:ring-2 focus:ring-[#2F4468]/25 focus:border-[#2F4468] disabled:bg-[#F1EEE6] transition-colors";

const secondaryButtonClass =
  "rounded-xl border border-[#E4DFD3] px-4 py-2 text-sm font-medium text-[#57534A] hover:bg-[#F1EEE6] hover:text-[#1D1B18] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const removeLinkClass =
  "text-xs text-[#B3261E] hover:text-[#8A2A22] disabled:text-[#B8B2A3] disabled:cursor-not-allowed transition-colors";

const addMediaLinkClass =
  "text-xs text-[#2F4468] hover:text-[#1D2E47] font-medium disabled:text-[#B8B2A3] transition-colors";

const eyebrowClass =
  "text-xs font-semibold uppercase tracking-wide text-[#57534A] [font-family:var(--font-mono)]";

function charBarColor(count: number, min: number, max: number) {
  if (count < min) return "bg-[#B3261E]";
  if (count > max) return "bg-[#B3261E]";
  const ratio = count / max;
  return ratio > 0.95
    ? "bg-[#B3261E]"
    : ratio > 0.85
      ? "bg-[#B8862E]"
      : ratio > 0.7
        ? "bg-[#D9B44A]"
        : "bg-[#3F7857]";
}

function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + 24 + "px";
}

function OgPreviewCard({ og }: { og: OgData }) {
  return (
    <a
      href={og.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl border border-[#E4DFD3] bg-[#FDFCF9] overflow-hidden hover:bg-[#F5F1E8] transition-colors"
    >
      <div className="flex">
        {og.image && (
          <div className="w-24 h-24 flex-shrink-0 bg-[#EDE8DC]">
            <img
              src={og.image}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex-1 p-3 min-w-0">
          <p className="text-xs font-medium text-[#1D1B18] line-clamp-2">{og.title}</p>
          {og.description && <p className="text-xs text-[#6B6459] line-clamp-2 mt-1">{og.description}</p>}
          <p className="text-xs text-[#A39C8C] mt-1 truncate">{og.siteName || new URL(og.url).hostname}</p>
        </div>
      </div>
    </a>
  );
}

function MediaField({
  index,
  media,
  disabled,
  fileInputRefs,
  onSelect,
  onRemove,
}: {
  index: number;
  media: PostMedia;
  disabled: boolean;
  fileInputRefs: { current: (HTMLInputElement | null)[] };
  onSelect: (index: number, file: File | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        ref={(el) => {
          fileInputRefs.current[index] = el;
        }}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
        onChange={(e) => onSelect(index, e.target.files?.[0] || null)}
        className="hidden"
      />

      {media.status === "none" ? (
        <button
          type="button"
          onClick={() => fileInputRefs.current[index]?.click()}
          disabled={disabled}
          className={addMediaLinkClass}
        >
          + Add image / video
        </button>
      ) : (
        <div className="flex items-center gap-2 w-full">
          {media.previewUrl && (
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#E4DFD3] bg-[#FDFCF9] flex-shrink-0">
              {media.mediaType === "VIDEO" ? (
                <video src={media.previewUrl} className="w-full h-full object-cover" />
              ) : (
                <img src={media.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#6B6459] truncate">{media.fileName}</p>
            {media.status === "uploading" && <p className="text-xs text-[#2F4468]">Uploading...</p>}
            {media.status === "uploaded" && <p className="text-xs text-[#3F7857]">Uploaded</p>}
            {media.status === "error" && <p className="text-xs text-[#B3261E]">{media.error}</p>}
          </div>
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={disabled}
            className={`${removeLinkClass} flex-shrink-0`}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function PostComposer({
  index,
  label,
  post,
  media,
  charMin,
  charMax,
  og,
  loadingOg,
  disabled,
  showRemove,
  fileInputRefs,
  onChange,
  onRemove,
  onFileSelect,
  onRemoveMedia,
}: {
  index: number;
  label: string;
  post: string;
  media: PostMedia;
  charMin: number;
  charMax: number;
  og: OgData | null | undefined;
  loadingOg: boolean | undefined;
  disabled: boolean;
  showRemove: boolean;
  fileInputRefs: { current: (HTMLInputElement | null)[] };
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onFileSelect: (index: number, file: File | null) => void;
  onRemoveMedia: (index: number) => void;
}) {
  const count = post.length;
  const ratio = count / charMax;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={eyebrowClass}>{label}</label>
        {showRemove && (
          <button type="button" onClick={() => onRemove(index)} disabled={disabled} className={removeLinkClass}>
            Remove
          </button>
        )}
      </div>

      <MediaField
        index={index}
        media={media}
        disabled={disabled}
        fileInputRefs={fileInputRefs}
        onSelect={onFileSelect}
        onRemove={onRemoveMedia}
      />

      <textarea
        value={post}
        onChange={(e) => onChange(index, e.target.value)}
        onInput={(e) => autoResize(e.currentTarget)}
        placeholder={`${label}...`}
        rows={3}
        disabled={disabled}
        className={postTextareaClass}
      />

      {loadingOg && <div className="text-xs text-[#A39C8C] animate-pulse">Loading preview...</div>}
      {og && og.title && <OgPreviewCard og={og} />}

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#A39C8C]">Characters</span>
          <span className={count < charMin || count > charMax ? "text-[#B3261E] font-medium" : "text-[#6B6459]"}>
            {count} (min {charMin} / max {charMax})
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-[#EDE8DC] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${charBarColor(count, charMin, charMax)}`}
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PostPage() {
  const [posts, setPosts] = useState<string[]>([""]);
  const [media, setMedia] = useState<PostMedia[]>([{ status: "none" }]);

  const [businessDescription, setBusinessDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mainProblem, setMainProblem] = useState("");
  const [keyFeatures, setKeyFeatures] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [tone, setTone] = useState<Tone>("rage-bait");
  const [charMin, setCharMin] = useState(240);
  const [charMax, setCharMax] = useState(480);
  const [prefsStatus, setPrefsStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [aiError, setAiError] = useState("");

  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "success" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState("");

  const [ogData, setOgData] = useState<(OgData | null)[]>([]);
  const [ogLoading, setOgLoading] = useState<boolean[]>([]);

  const [diagnostic, setDiagnostic] = useState<Record<string, unknown> | null>(null);
  const [checking, setChecking] = useState(false);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const fetchedOgUrls = useRef<Set<string>>(new Set());

  function updatePost(index: number, value: string) {
    setPosts((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removePost(index: number) {
    if (posts.length <= 1) return;
    setPosts((prev) => prev.filter((_, i) => i !== index));
    setMedia((prev) => prev.filter((_, i) => i !== index));
  }

  const allPostsValid =
    posts.length > 0 &&
    charMin < charMax &&
    posts.every((p) => {
      const len = p.trim().length;
      return len >= charMin && len <= charMax;
    });

  useEffect(() => {
    const timers = posts.map((text, i) =>
      setTimeout(async () => {
        const url = extractFirstUrl(text);

        if (!url) {
          setOgData((prev) => {
            if (prev[i] === null) return prev;
            const next = [...prev];
            next[i] = null;
            return next;
          });
          return;
        }

        if (fetchedOgUrls.current.has(url)) return;
        fetchedOgUrls.current.add(url);

        setOgLoading((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });

        try {
          const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
          const data = await res.json();

          if (data.image && !data.image.startsWith("/")) {
            data.image = `/api/media/proxy?url=${encodeURIComponent(data.image)}`;
          }

          setOgData((prev) => {
            const next = [...prev];
            next[i] = data;
            return next;
          });
        } catch {
          fetchedOgUrls.current.delete(url);
        } finally {
          setOgLoading((prev) => {
            const next = [...prev];
            next[i] = false;
            return next;
          });
        }
      }, 500)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [posts]);

  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLTextAreaElement>(".post-textarea").forEach(autoResize);
    });
  }, [posts]);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/preferences");
        if (res.ok) {
          const data = await res.json();
          setBusinessDescription(data.business_description || "");
          setWebsiteUrl(data.website_url || "");
          if (data.default_tone) setTone(data.default_tone as Tone);
          if (data.char_min && data.char_max) {
            setCharMin(data.char_min);
            setCharMax(data.char_max);
          }
          setTargetAudience(data.target_audience || "");
          setMainProblem(data.main_problem || "");
          setKeyFeatures(data.key_features || "");
        }
      } catch {
        // silently fail - form stays at defaults
      } finally {
        setPrefsStatus("loaded");
      }
    }
    loadPrefs();
  }, []);

  async function handleSavePrefs() {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_tone: tone,
          business_description: businessDescription.trim(),
          website_url: websiteUrl.trim(),
          char_min: charMin,
          char_max: charMax,
          target_audience: targetAudience.trim(),
          main_problem: mainProblem.trim(),
          key_features: keyFeatures.trim(),
        }),
      });
      if (res.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleFileSelect(index: number, file: File | null) {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setMedia((prev) => {
      const next = [...prev];
      next[index] = {
        status: "uploading",
        previewUrl,
        fileName: file.name,
      };
      return next;
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMedia((prev) => {
          const next = [...prev];
          next[index] = {
            status: "uploaded",
            url: data.url,
            mediaType: data.mediaType,
            previewUrl,
            fileName: file.name,
          };
          return next;
        });
      } else {
        setMedia((prev) => {
          const next = [...prev];
          next[index] = {
            status: "error",
            error: data.error || "Upload failed",
            previewUrl,
            fileName: file.name,
          };
          return next;
        });
      }
    } catch {
      setMedia((prev) => {
        const next = [...prev];
        next[index] = {
          status: "error",
          error: "Network error",
          previewUrl,
          fileName: file.name,
        };
        return next;
      });
    }
  }

  function removeMedia(index: number) {
    setMedia((prev) => {
      const next = [...prev];
      if (next[index].previewUrl) {
        URL.revokeObjectURL(next[index].previewUrl!);
      }
      next[index] = { status: "none" };
      return next;
    });
  }

  const handleGenerateAi = useCallback(async () => {
    if (!businessDescription.trim()) return;

    setAiStatus("generating");
    setAiError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessDescription: businessDescription.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          tone,
          charMin,
          charMax,
          targetAudience: targetAudience.trim() || undefined,
          mainProblem: mainProblem.trim() || undefined,
          keyFeatures: keyFeatures.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPosts(data.posts);
        setMedia((prev) =>
          data.posts.length > prev.length
            ? [
                ...prev,
                ...Array(data.posts.length - prev.length).fill({
                  status: "none",
                } as PostMedia),
              ]
            : prev.slice(0, data.posts.length)
        );
        setOgData((prev) =>
          data.posts.length > prev.length
            ? [...prev, ...Array(data.posts.length - prev.length).fill(null)]
            : prev.slice(0, data.posts.length)
        );
        setOgLoading((prev) =>
          data.posts.length > prev.length
            ? [...prev, ...Array(data.posts.length - prev.length).fill(false)]
            : prev.slice(0, data.posts.length)
        );
        setAiStatus("done");
      } else {
        setAiError(data.error || "Generation failed");
        setAiStatus("error");
      }
    } catch {
      setAiError("Network error. Check that the server is running.");
      setAiStatus("error");
    }
  }, [businessDescription, websiteUrl, tone]);

  async function handlePublish() {
    if (!allPostsValid) return;

    setPublishStatus("publishing");
    setPublishMessage("");

    const mediaPayload = media.map((m) =>
      m.status === "uploaded" && m.url && m.mediaType ? { url: m.url, mediaType: m.mediaType } : null
    );

    const res = await fetch("/api/threads/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        posts: posts.map((p) => p.trim()),
        media: mediaPayload,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setPublishStatus("success");
      setPublishMessage(`Thread posted! (${data.post_ids.length} posts)`);
      setPosts([""]);
      setMedia([{ status: "none" }]);
      setOgData([]);
      setOgLoading([]);
      setAiStatus("idle");
    } else {
      setPublishStatus("error");
      const details = data.details
        ? typeof data.details === "string"
          ? data.details
          : JSON.stringify(data.details, null, 2)
        : "";
      const published = data.published?.length
        ? `\nPublished ${data.published.length} of ${posts.length} posts before failure.`
        : "";
      setPublishMessage(`${data.error || "Something went wrong"}${published}${details ? `\n${details}` : ""}`);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerateAi();
    }
  }

  return (
    <main
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} min-h-screen bg-[#FAF8F2] [font-family:var(--font-body)]`}
    >
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8862E] [font-family:var(--font-mono)]">
            Composer
          </p>
          <h1 className="text-3xl font-semibold text-[#1D1B18] [font-family:var(--font-display)]">
            Post to Threads
          </h1>
        </header>

        <div className="grid lg:grid-cols-5 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-[#E4DFD3] bg-white shadow-sm p-6 space-y-5 h-fit">
            <h2 className={eyebrowClass}>AI Generator</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1D1B18]">What does your business do?</label>
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
                Target audience <span className="text-[#A39C8C] font-normal">(optional)</span>
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
                Main problem you solve <span className="text-[#A39C8C] font-normal">(optional)</span>
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
                Key features <span className="text-[#A39C8C] font-normal">(optional)</span>
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
                Website URL <span className="text-[#A39C8C] font-normal">(optional)</span>
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
                <label className="text-sm font-medium text-[#1D1B18]">Min characters: {charMin}</label>
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
                <label className="text-sm font-medium text-[#1D1B18]">Max characters: {charMax}</label>
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
                onClick={handleSavePrefs}
                disabled={saveStatus === "saving" || prefsStatus === "loading"}
                className={`${secondaryButtonClass} flex-1`}
              >
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save as Defaults"}
              </button>

              <button
                onClick={handleGenerateAi}
                disabled={aiStatus === "generating" || !businessDescription.trim()}
                className="rounded-xl bg-[#B8862E] px-5 py-2 text-sm font-medium text-white hover:bg-[#9C7226] disabled:bg-[#D8C9A8] disabled:cursor-not-allowed transition-colors flex-1"
              >
                {aiStatus === "generating" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate with AI"
                )}
              </button>
            </div>

            {aiStatus === "done" && (
              <button onClick={handleGenerateAi} className={`${secondaryButtonClass} w-full`}>
                Regenerate
              </button>
            )}

            {aiStatus === "generating" && (
              <p className="text-xs text-[#6B6459] flex items-center gap-1.5">
                <svg className="animate-pulse h-2.5 w-2.5 text-[#B8862E]" viewBox="0 0 24 24" fill="currentColor">
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

          <section className="lg:col-span-3 rounded-2xl border border-[#E4DFD3] bg-white shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={eyebrowClass}>Composer</h2>
                {posts.length > 1 && (
                  <p className="text-xs text-[#A39C8C] mt-0.5">
                    {posts.length - 1} repl{posts.length - 1 === 1 ? "y" : "ies"}
                  </p>
                )}
              </div>
            </div>

            {posts.length > 0 && (
              <PostComposer
                index={0}
                label="Post"
                post={posts[0]}
                media={media[0] ?? { status: "none" }}
                charMin={charMin}
                charMax={charMax}
                og={ogData[0]}
                loadingOg={ogLoading[0]}
                disabled={publishStatus === "publishing"}
                showRemove={false}
                fileInputRefs={fileInputRefs}
                onChange={updatePost}
                onRemove={removePost}
                onFileSelect={handleFileSelect}
                onRemoveMedia={removeMedia}
              />
            )}

            {posts.length > 1 && (
              <div className="relative ml-3 pl-7 space-y-6 before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:border-l-2 before:border-dotted before:border-[#B8862E]/50">
                {posts.slice(1).map((post, idx) => {
                  const i = idx + 1;
                  return (
                    <div key={i} className="relative">
                      <span className="absolute -left-7 top-1 w-2.5 h-2.5 rounded-full bg-[#B8862E] ring-4 ring-[#FAF8F2]" />
                      <PostComposer
                        index={i}
                        label={`Reply ${idx + 1}`}
                        post={post}
                        media={media[i] ?? { status: "none" }}
                        charMin={charMin}
                        charMax={charMax}
                        og={ogData[i]}
                        loadingOg={ogLoading[i]}
                        disabled={publishStatus === "publishing"}
                        showRemove
                        fileInputRefs={fileInputRefs}
                        onChange={updatePost}
                        onRemove={removePost}
                        onFileSelect={handleFileSelect}
                        onRemoveMedia={removeMedia}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handlePublish}
              disabled={publishStatus === "publishing" || !allPostsValid}
              className="rounded-xl bg-[#1D1B18] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2F4468] disabled:bg-[#C9C3B5] disabled:cursor-not-allowed transition-colors w-full"
            >
              {publishStatus === "publishing" ? "Publishing thread..." : "Publish Thread to Threads"}
            </button>

            {publishStatus === "success" && (
              <div className="rounded-xl bg-[#EDF4EE] border border-[#BFE0C4] px-4 py-3 text-sm text-[#2F6B45]">
                {publishMessage}
              </div>
            )}

            {publishStatus === "error" && (
              <div className="rounded-xl bg-[#FBEAE8] border border-[#F0C4BF] px-4 py-3 text-sm text-[#8A2A22] whitespace-pre-wrap">
                {publishMessage}
              </div>
            )}
          </section>
        </div>

        <details className="rounded-2xl border border-[#E4DFD3] bg-white shadow-sm">
          <summary className="cursor-pointer px-6 py-3 text-sm font-medium text-[#57534A] hover:text-[#1D1B18] select-none">
            Diagnostics
          </summary>
          <div className="px-6 pb-4 space-y-3">
            <button
              onClick={async () => {
                setChecking(true);
                setDiagnostic(null);
                const res = await fetch("/api/threads/check");
                const data = await res.json();
                setDiagnostic(data);
                setChecking(false);
              }}
              disabled={checking}
              className="rounded-xl bg-[#57534A] px-4 py-2 text-sm font-medium text-white hover:bg-[#3F3B33] disabled:bg-[#C9C3B5] disabled:cursor-not-allowed transition-colors"
            >
              {checking ? "Checking..." : "Check Connection"}
            </button>

            {diagnostic && (
              <pre className="rounded-xl border border-[#E4DFD3] bg-[#FDFCF9] p-3 text-xs overflow-auto max-h-96 [font-family:var(--font-mono)]">
                {JSON.stringify(diagnostic, null, 2)}
              </pre>
            )}
          </div>
        </details>
      </div>
    </main>
  );
}