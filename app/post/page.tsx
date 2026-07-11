"use client";

import { useState, useRef, useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { useAuth } from "@/components/auth-provider";
import { useAccounts } from "@/hooks/use-accounts";
import { usePreferences } from "@/hooks/use-preferences";
import type { Preferences } from "@/hooks/use-preferences";
import { AiGeneratorPanel, type GenerateParams } from "@/components/ai-generator-panel";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

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

const postTextareaClass =
  "post-textarea w-full rounded-xl border border-[#E4DFD3] bg-white px-3 py-2.5 text-sm text-[#1D1B18] placeholder:text-[#A39C8C] focus:outline-none focus:ring-2 focus:ring-[#2F4468]/25 focus:border-[#2F4468] disabled:bg-[#F1EEE6] transition-colors";

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

const MediaField = memo(function MediaField({
  media,
  disabled,
  fileInputRef,
  onSelect,
  onRemove,
}: {
  media: PostMedia;
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (file: File | null) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
        onChange={(e) => onSelect(e.target.files?.[0] || null)}
        className="hidden"
      />

      {media.status === "none" ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
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
            onClick={onRemove}
            disabled={disabled}
            className={`${removeLinkClass} flex-shrink-0`}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
});

const PostComposer = memo(function PostComposer({
  label,
  post,
  media,
  charMin,
  charMax,
  og,
  loadingOg,
  disabled,
  fileInputRef,
  onChange,
  onFileSelect,
  onRemoveMedia,
}: {
  label: string;
  post: string;
  media: PostMedia;
  charMin: number;
  charMax: number;
  og: OgData | null | undefined;
  loadingOg: boolean | undefined;
  disabled: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onFileSelect: (file: File | null) => void;
  onRemoveMedia: () => void;
}) {
  const count = post.length;
  const ratio = count / charMax;

  return (
    <div className="space-y-3">
      <label className={eyebrowClass}>{label}</label>

      <MediaField
        media={media}
        disabled={disabled}
        fileInputRef={fileInputRef}
        onSelect={onFileSelect}
        onRemove={onRemoveMedia}
      />

      <textarea
        value={post}
        onChange={(e) => onChange(e.target.value)}
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
});

export default function PostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState("");
  const [media, setMedia] = useState<PostMedia>({ status: "none" });

  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [aiError, setAiError] = useState("");

  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "success" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState("");

  const [ogData, setOgData] = useState<OgData | null>(null);
  const [ogLoading, setOgLoading] = useState(false);

  const [diagnostic, setDiagnostic] = useState<Record<string, unknown> | null>(null);
  const [checking, setChecking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fetchedOgUrls = useRef<Set<string>>(new Set());

  const { accounts } = useAccounts();
  const {
    preferences,
    loading: prefsLoading,
    validating: prefsValidating,
  } = usePreferences(activeAccountId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (accounts.length > 0 && !activeAccountId) {
    setActiveAccountId(accounts[0].id);
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      const url = extractFirstUrl(post);

      if (!url) {
        setOgData(null);
        return;
      }

      if (fetchedOgUrls.current.has(url)) return;
      fetchedOgUrls.current.add(url);

      setOgLoading(true);

      try {
        const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        if (data.image && !data.image.startsWith("/")) {
          data.image = `/api/media/proxy?url=${encodeURIComponent(data.image)}`;
        }

        setOgData(data);
      } catch {
        fetchedOgUrls.current.delete(url);
      } finally {
        setOgLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [post]);

  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLTextAreaElement>(".post-textarea").forEach(autoResize);
    });
  }, [post]);

  async function handleSavePrefs(prefs: Partial<Preferences>) {
    if (!activeAccountId) return;
    const res = await fetch(`/api/preferences?account_id=${activeAccountId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    if (!res.ok) throw new Error("Failed to save");
  }

  async function handleGenerateAi(params: GenerateParams) {
    setAiStatus("generating");
    setAiError("");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessDescription: params.businessDescription,
          websiteUrl: params.websiteUrl,
          tone: params.tone,
          charMin: params.charMin,
          charMax: params.charMax,
          targetAudience: params.targetAudience,
          mainProblem: params.mainProblem,
          keyFeatures: params.keyFeatures,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPost(data.post);
        setMedia({ status: "none" });
        setOgData(null);
        setOgLoading(false);
        setAiStatus("done");
      } else {
        setAiError(data.error || "Generation failed");
        setAiStatus("error");
      }
    } catch {
      setAiError("Network error. Check that the server is running.");
      setAiStatus("error");
    }
  }

  async function handlePublish() {
    setPublishStatus("publishing");
    setPublishMessage("");

    const mediaPayload =
      media.status === "uploaded" && media.url && media.mediaType
        ? { url: media.url, mediaType: media.mediaType }
        : undefined;

    const res = await fetch("/api/threads/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post: post.trim(),
        media: mediaPayload,
        threads_account_id: activeAccountId,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setPublishStatus("success");
      setPublishMessage("Posted!");
      setPost("");
      setMedia({ status: "none" });
      setOgData(null);
      setOgLoading(false);
      setAiStatus("idle");
    } else {
      setPublishStatus("error");
      const details = data.details
        ? typeof data.details === "string"
          ? data.details
          : JSON.stringify(data.details, null, 2)
        : "";
      setPublishMessage(`${data.error || "Something went wrong"}${details ? `\n${details}` : ""}`);
    }
  }

  async function handleFileSelect(file: File | null) {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setMedia({
      status: "uploading",
      previewUrl,
      fileName: file.name,
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
        setMedia({
          status: "uploaded",
          url: data.url,
          mediaType: data.mediaType,
          previewUrl,
          fileName: file.name,
        });
      } else {
        setMedia({
          status: "error",
          error: data.error || "Upload failed",
          previewUrl,
          fileName: file.name,
        });
      }
    } catch {
      setMedia({
        status: "error",
        error: "Network error",
        previewUrl,
        fileName: file.name,
      });
    }
  }

  function removeMedia() {
    if (media.previewUrl) {
      URL.revokeObjectURL(media.previewUrl);
    }
    setMedia({ status: "none" });
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
          <AiGeneratorPanel
            key={activeAccountId}
            preferences={preferences}
            prefsLoading={prefsLoading}
            prefsValidating={prefsValidating}
            activeAccountId={activeAccountId}
            onSavePrefs={handleSavePrefs}
            onGenerate={handleGenerateAi}
            aiStatus={aiStatus}
            aiError={aiError}
          />

          <section className="lg:col-span-3 rounded-2xl border border-[#E4DFD3] bg-white shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className={eyebrowClass}>Composer</h2>
            </div>

            <PostComposer
              label="Post"
              post={post}
              media={media}
              charMin={preferences?.char_min ?? 240}
              charMax={preferences?.char_max ?? 480}
              og={ogData}
              loadingOg={ogLoading}
              disabled={publishStatus === "publishing"}
              fileInputRef={fileInputRef}
              onChange={setPost}
              onFileSelect={handleFileSelect}
              onRemoveMedia={removeMedia}
            />

            {accounts.length > 1 && (
              <div className="space-y-1.5">
                <label className={eyebrowClass}>Publish to</label>
                <select
                  value={activeAccountId ?? ""}
                  onChange={(e) => setActiveAccountId(e.target.value)}
                  disabled={publishStatus === "publishing"}
                  className="w-full rounded-xl border border-[#E4DFD3] bg-white px-3 py-2 text-sm text-[#1D1B18] focus:outline-none focus:ring-2 focus:ring-[#2F4468]/25 focus:border-[#2F4468]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.username || `Threads #${acc.threads_user_id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handlePublish}
              disabled={publishStatus === "publishing"}
              className="rounded-xl bg-[#1D1B18] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#2F4468] disabled:bg-[#C9C3B5] disabled:cursor-not-allowed transition-colors w-full"
            >
              {publishStatus === "publishing" ? "Publishing..." : "Publish to Threads"}
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
