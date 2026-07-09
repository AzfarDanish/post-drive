"use client";

import { useState, useCallback, type KeyboardEvent } from "react";

type Tone = "rage-bait" | "hot-take" | "storytelling" | "educational";

const TONES: { id: Tone; label: string }[] = [
  { id: "rage-bait", label: "Rage Bait" },
  { id: "hot-take", label: "Hot Take" },
  { id: "storytelling", label: "Storytelling" },
  { id: "educational", label: "Educational" },
];

const CHAR_LIMIT = 500;

function charBarColor(ratio: number) {
  return ratio > 0.95
    ? "bg-red-500"
    : ratio > 0.85
      ? "bg-orange-500"
      : ratio > 0.7
        ? "bg-yellow-500"
        : "bg-gray-400";
}

export default function PostPage() {
  const [posts, setPosts] = useState<string[]>([""]);
  const [status, setStatus] = useState<"idle" | "posting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const [businessDescription, setBusinessDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [tone, setTone] = useState<Tone>("rage-bait");
  const [aiStatus, setAiStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [aiError, setAiError] = useState("");

  const [diagnostic, setDiagnostic] = useState<Record<string, unknown> | null>(null);
  const [checking, setChecking] = useState(false);

  function updatePost(index: number, value: string) {
    setPosts((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addPost() {
    setPosts((prev) => [...prev, ""]);
  }

  function removePost(index: number) {
    setPosts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  const allPostsValid =
    posts.length > 0 && posts.every((p) => p.trim().length > 0 && p.length <= CHAR_LIMIT);

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
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPosts(data.posts);
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

  async function handleSubmit() {
    if (!allPostsValid) return;

    setStatus("posting");
    setMessage("");

    const res = await fetch("/api/threads/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posts: posts.map((p) => p.trim()) }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("success");
      setMessage(`Thread posted! (${data.post_ids.length} posts)`);
      setPosts([""]);
      setAiStatus("idle");
    } else {
      setStatus("error");
      const details = data.details
        ? typeof data.details === "string"
          ? data.details
          : JSON.stringify(data.details, null, 2)
        : "";
      const published = data.published?.length
        ? `\nPublished ${data.published.length} of ${posts.length} posts before failure.`
        : "";
      setMessage(`${data.error || "Something went wrong"}${published}${details ? `\n${details}` : ""}`);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerateAi();
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Post to Threads</h1>

      <section className="rounded-xl border bg-white shadow-sm p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">What does your business do?</label>
          <textarea
            value={businessDescription}
            onChange={(e) => setBusinessDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. We sell organic coffee subscriptions..."
            rows={3}
            disabled={aiStatus === "generating"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical disabled:bg-gray-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Website URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={aiStatus === "generating"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
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

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleGenerateAi}
            disabled={aiStatus === "generating" || !businessDescription.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {aiStatus === "generating" ? (
              <span className="flex items-center gap-2">
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

          {aiStatus === "done" && (
            <button
              onClick={handleGenerateAi}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Regenerate
            </button>
          )}
        </div>

        {aiStatus === "generating" && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <svg className="animate-pulse h-3 w-3 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            Scraping website &amp; generating posts...
          </p>
        )}

        {aiStatus === "error" && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {aiError}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Thread ({posts.length} post{posts.length === 1 ? "" : "s"} in this thread)
          </h2>
          {posts.length < 6 && (
            <button
              type="button"
              onClick={addPost}
              disabled={status === "posting"}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              + Add post
            </button>
          )}
        </div>

        {posts.map((post, i) => {
          const count = post.length;
          const ratio = count / CHAR_LIMIT;

          return (
            <div key={i} className="space-y-2 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500">Post {i + 1} of {posts.length}</label>
                {posts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePost(i)}
                    disabled={status === "posting"}
                    className="text-xs text-red-500 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                value={post}
                onChange={(e) => updatePost(i, e.target.value)}
                placeholder={`Post ${i + 1} of ${posts.length}...`}
                rows={3}
                disabled={status === "posting"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical disabled:bg-gray-100"
              />
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Characters</span>
                  <span className={count > CHAR_LIMIT ? "text-red-600 font-medium" : "text-gray-500"}>
                    {count} / {CHAR_LIMIT}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-200 ${charBarColor(ratio)}`}
                    style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={handleSubmit}
          disabled={status === "posting" || !allPostsValid}
          className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors w-full"
        >
          {status === "posting" ? "Publishing thread..." : "Publish Thread to Threads"}
        </button>

        {status === "success" && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
            {message}
          </div>
        )}
      </section>

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
