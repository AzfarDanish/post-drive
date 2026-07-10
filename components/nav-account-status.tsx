import { getSupabase } from "@/lib/supabase";

export default async function NavAccountStatus() {
  const { data } = await getSupabase()
    .from("threads_accounts")
    .select("threads_user_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const connected = !!data;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginLeft: "auto",
        fontSize: 13,
        color: connected ? "#16a34a" : "#9ca3af",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: connected ? "#16a34a" : "#9ca3af",
          display: "inline-block",
        }}
      />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}
