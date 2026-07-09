"use client";

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from "react";

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

function charBarColor(count: number, min: number, max: number) {
  if (count < min) return "bg-red-500";
  if (count > max) return "bg-red-500";
  const ratio = count / max;
  return ratio > 0.95
    ? "bg-red-500"
    : ratio > 0.85
      ? "bg-orange-500"
      : ratio > 0.7
        ? "bg-yellow-500"
        : "bg-green-500";
}

function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
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

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + 24 + "px";
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
      setAiError("Network error – is the server running?");
      setAiStatus("error");
    }
  }, [businessDescription, websiteUrl, tone]);

  async function handlePublish() {
    if (!allPostsValid) return;

    setPublishStatus("publishing");
    setPublishMessage("");

    const mediaPayload = media.map((m) =>
      m.status === "uploaded" && m.url && m.mediaType
        ? { url: m.url, mediaType: m.mediaType }
        : null
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
      setPublishMessage(
        `${data.error || "Something went wrong"}${published}${details ? `\n${details}` : ""}`
      );
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerateAi();
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Post to Threads</h1>

      <div className="grid lg:grid-cols-5 gap-6">
        <section className="lg:col-span-2 rounded-xl border bg-white shadow-sm p-6 space-y-5 h-fit">
          <h2 className="text-sm font-semibold">AI Generator</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">What does your business do?</label>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. We sell organic coffee subscriptions..."
              rows={2}
              disabled={aiStatus === "generating"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical disabled:bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Target audience <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Freelancers, small business owners"
              rows={2}
              disabled={aiStatus === "generating"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical disabled:bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Main problem you solve <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={mainProblem}
              onChange={(e) => setMainProblem(e.target.value)}
              placeholder="e.g. People waste time on manual scheduling"
              rows={2}
              disabled={aiStatus === "generating"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical disabled:bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Key features <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={keyFeatures}
              onChange={(e) => setKeyFeatures(e.target.value)}
              placeholder="e.g. Auto-scheduling, analytics, team collaboration"
              rows={2}
              disabled={aiStatus === "generating"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical disabled:bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Website URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              rows={2}
              disabled={aiStatus === "generating"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical disabled:bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  disabled={aiStatus === "generating"}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                    tone === t.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Min characters: {charMin}</label>
              <input
                type="range"
                min={SLIDER_MIN}
                max={charMax - 10}
                step={10}
                value={charMin}
                onChange={(e) => setCharMin(Number(e.target.value))}
                disabled={aiStatus === "generating"}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Max characters: {charMax}</label>
              <input
                type="range"
                min={charMin + 10}
                max={SLIDER_MAX}
                step={10}
                value={charMax}
                onChange={(e) => setCharMax(Number(e.target.value))}
                disabled={aiStatus === "generating"}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSavePrefs}
              disabled={saveStatus === "saving" || prefsStatus === "loading"}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1"
            >
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "Saved!"
                  : "Save as Defaults"}
            </button>

            <button
              onClick={handleGenerateAi}
              disabled={aiStatus === "generating" || !businessDescription.trim()}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-1"
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
            <button
              onClick={handleGenerateAi}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Regenerate
            </button>
          )}

          {aiStatus === "generating" && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <svg className="animate-pulse h-2.5 w-2.5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              Generating posts...
            </p>
          )}

          {aiStatus === "error" && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {aiError}
            </div>
          )}
        </section>

        <section className="lg:col-span-3 rounded-xl border bg-white shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Post</h2>
              {posts.length > 1 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {posts.length - 1} repl{posts.length - 1 === 1 ? "y" : "ies"}
                </p>
              )}
            </div>
          </div>

          {posts.length > 0 && (() => {
            const post = posts[0];
            const count = post.length;
            const ratio = count / charMax;
            const og = ogData[0];
            const loadingOg = ogLoading[0];

            return (
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Post</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={(el) => { fileInputRefs.current[0] = el; }}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
                    onChange={(e) => handleFileSelect(0, e.target.files?.[0] || null)}
                    className="hidden"
                  />

                  {media[0]?.status === "none" ? (
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[0]?.click()}
                      disabled={publishStatus === "publishing"}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:text-gray-400"
                    >
                      + Add image / video
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      {media[0].previewUrl && (
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden border bg-gray-50 flex-shrink-0">
                          {media[0].mediaType === "VIDEO" ? (
                            <video src={media[0].previewUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img src={media[0].previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 truncate">{media[0].fileName}</p>
                        {media[0].status === "uploading" && <p className="text-xs text-indigo-500">Uploading...</p>}
                        {media[0].status === "uploaded" && <p className="text-xs text-green-600">Uploaded</p>}
                        {media[0].status === "error" && <p className="text-xs text-red-600">{media[0].error}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(0)}
                        disabled={publishStatus === "publishing"}
                        className="text-xs text-red-500 hover:text-red-600 disabled:text-gray-400 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <textarea
                  value={post}
                  onChange={(e) => updatePost(0, e.target.value)}
                  onInput={(e) => autoResize(e.currentTarget)}
                  placeholder="Post..."
                  rows={3}
                  disabled={publishStatus === "publishing"}
                  className="post-textarea w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                />

                {loadingOg && <div className="text-xs text-gray-400 animate-pulse">Loading preview...</div>}

                {og && og.title && (
                  <a href={og.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border bg-gray-50 overflow-hidden hover:bg-gray-100 transition-colors">
                    <div className="flex">
                      {og.image && (
                        <div className="w-24 h-24 flex-shrink-0 bg-gray-200">
                          <img src={og.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        </div>
                      )}
                      <div className="flex-1 p-3 min-w-0">
                        <p className="text-xs font-medium text-gray-900 line-clamp-2">{og.title}</p>
                        {og.description && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{og.description}</p>}
                        <p className="text-xs text-gray-400 mt-1 truncate">{og.siteName || new URL(og.url).hostname}</p>
                      </div>
                    </div>
                  </a>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Characters</span>
                    <span className={count < charMin || count > charMax ? "text-red-600 font-medium" : "text-gray-500"}>{count} (min {charMin} / max {charMax})</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-200 ${charBarColor(count, charMin, charMax)}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })()}

          {posts.length > 1 && (
            <div className="ml-8 pl-4 border-l-2 border-gray-200 space-y-5">
              {posts.slice(1).map((post, idx) => {
                const i = idx + 1;
                const count = post.length;
                const ratio = count / charMax;
                const og = ogData[i];
                const loadingOg = ogLoading[i];

                return (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-500">Reply {idx + 1}</label>
                      <button
                        type="button"
                        onClick={() => removePost(i)}
                        disabled={publishStatus === "publishing"}
                        className="text-xs text-red-500 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={(el) => { fileInputRefs.current[i] = el; }}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
                        onChange={(e) => handleFileSelect(i, e.target.files?.[0] || null)}
                        className="hidden"
                      />

                      {media[i]?.status === "none" ? (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[i]?.click()}
                          disabled={publishStatus === "publishing"}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:text-gray-400"
                        >
                          + Add image / video
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          {media[i].previewUrl && (
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden border bg-gray-50 flex-shrink-0">
                              {media[i].mediaType === "VIDEO" ? (
                                <video src={media[i].previewUrl} className="w-full h-full object-cover" />
                              ) : (
                                <img src={media[i].previewUrl} alt="Preview" className="w-full h-full object-cover" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 truncate">{media[i].fileName}</p>
                            {media[i].status === "uploading" && <p className="text-xs text-indigo-500">Uploading...</p>}
                            {media[i].status === "uploaded" && <p className="text-xs text-green-600">Uploaded</p>}
                            {media[i].status === "error" && <p className="text-xs text-red-600">{media[i].error}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMedia(i)}
                            disabled={publishStatus === "publishing"}
                            className="text-xs text-red-500 hover:text-red-600 disabled:text-gray-400 flex-shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <textarea
                      value={post}
                      onChange={(e) => updatePost(i, e.target.value)}
                      onInput={(e) => autoResize(e.currentTarget)}
                      placeholder={`Reply ${idx + 1}...`}
                      rows={3}
                      disabled={publishStatus === "publishing"}
                      className="post-textarea w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                    />

                    {loadingOg && <div className="text-xs text-gray-400 animate-pulse">Loading preview...</div>}

                    {og && og.title && (
                      <a href={og.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border bg-gray-50 overflow-hidden hover:bg-gray-100 transition-colors">
                        <div className="flex">
                          {og.image && (
                            <div className="w-24 h-24 flex-shrink-0 bg-gray-200">
                              <img src={og.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                            </div>
                          )}
                          <div className="flex-1 p-3 min-w-0">
                            <p className="text-xs font-medium text-gray-900 line-clamp-2">{og.title}</p>
                            {og.description && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{og.description}</p>}
                            <p className="text-xs text-gray-400 mt-1 truncate">{og.siteName || new URL(og.url).hostname}</p>
                          </div>
                        </div>
                      </a>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Characters</span>
                        <span className={count < charMin || count > charMax ? "text-red-600 font-medium" : "text-gray-500"}>{count} (min {charMin} / max {charMax})</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-200 ${charBarColor(count, charMin, charMax)}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={publishStatus === "publishing" || !allPostsValid}
            className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors w-full"
          >
            {publishStatus === "publishing" ? "Publishing thread..." : "Publish Thread to Threads"}
          </button>

          {publishStatus === "success" && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {publishMessage}
            </div>
          )}

          {publishStatus === "error" && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
              {publishMessage}
            </div>
          )}
        </section>
      </div>

      <details className="rounded-xl border bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 select-none">
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
            className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {checking ? "Checking..." : "Check Connection"}
          </button>

          {diagnostic && (
            <pre className="rounded-lg border bg-gray-50 p-3 text-xs overflow-auto max-h-96">
              {JSON.stringify(diagnostic, null, 2)}
            </pre>
          )}
        </div>
      </details>
    </main>
  );
}
