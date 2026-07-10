import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {

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
        href="/api/auth/threads/login"
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
