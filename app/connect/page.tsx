import { randomUUID } from "node:crypto";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
  const state = randomUUID();

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_THREADS_APP_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI!,
    scope: "threads_basic,threads_content_publish",
    response_type: "code",
    state,
  });

  const url = `https://www.threads.net/oauth/authorize?${params.toString()}`;

  const { data } = await supabase
    .from("threads_accounts")
    .select("threads_user_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const connected = !!data;

  return (
    <main style={{ padding: 40 }}>
      <h1>Connect Threads</h1>
      <a
        href={url}
        style={{
          display: "inline-block",
          padding: "12px 24px",
          background: "#000",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 8,
        }}
      >
        Connect Threads
      </a>
      <p
        style={{
          marginTop: 12,
          fontSize: 14,
          color: connected ? "#16a34a" : "#9ca3af",
        }}
      >
        {connected ? "Connected" : "Disconnected"}
      </p>
    </main>
  );
}
