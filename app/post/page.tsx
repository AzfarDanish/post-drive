"use client";

import { FormEvent, useState } from "react";

export default function PostPage() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "posting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [diagnostic, setDiagnostic] = useState<Record<string, unknown> | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("posting");
    setMessage("");

    const res = await fetch("/api/threads/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("success");
      setMessage(`Posted! Threads ID: ${data.post_id}`);
      setText("");
    } else {
      setStatus("error");
      const details = data.details
        ? typeof data.details === "string"
          ? data.details
          : JSON.stringify(data.details, null, 2)
        : "";
      setMessage(`${data.error || "Something went wrong"}${details ? `\n${details}` : ""}`);
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 600 }}>
      <h1 style={{ marginBottom: 16 }}>Post to Threads</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          rows={5}
          disabled={status === "posting"}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #ccc",
            resize: "vertical",
          }}
        />

        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          {text.length} character{text.length === 1 ? "" : "s"}
        </p>

        <button
          type="submit"
          disabled={status === "posting" || !text.trim()}
          style={{
            marginTop: 12,
            padding: "10px 24px",
            background: status === "posting" ? "#999" : "#000",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            cursor: status === "posting" ? "not-allowed" : "pointer",
          }}
        >
          {status === "posting" ? "Posting..." : "Post to Threads"}
        </button>
      </form>

      {status === "success" && (
        <p style={{ marginTop: 16, color: "green" }}>{message}</p>
      )}
      {status === "error" && (
        <p style={{ marginTop: 16, color: "red", whiteSpace: "pre-wrap" }}>{message}</p>
      )}

      <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #e5e7eb" }} />

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
        style={{
          padding: "8px 16px",
          background: checking ? "#999" : "#6b7280",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          cursor: checking ? "not-allowed" : "pointer",
        }}
      >
        {checking ? "Checking..." : "Check Connection"}
      </button>

      {diagnostic && (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            fontSize: 12,
            overflow: "auto",
            maxHeight: 400,
          }}
        >
          {JSON.stringify(diagnostic, null, 2)}
        </pre>
      )}
    </main>
  );
}
