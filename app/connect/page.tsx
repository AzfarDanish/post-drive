"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Account {
  id: string;
  threads_user_id: string;
  username?: string | null;
  is_enabled: boolean;
  post_hour_utc: number;
}

export default function ConnectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/threads/check");
      const data = await res.json();
      if (data.accounts) {
        setAccounts(data.accounts);
      }
      setChecking(false);
    }
    load();
  }, []);

  async function toggleAutoPost(acc: Account) {
    const next = !acc.is_enabled;
    setAccounts((prev) =>
      prev.map((a) => (a.id === acc.id ? { ...a, is_enabled: next } : a))
    );

    const res = await fetch("/api/threads/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: acc.id, is_enabled: next }),
    });

    if (!res.ok) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === acc.id ? { ...a, is_enabled: acc.is_enabled } : a))
      );
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  async function setPostHour(acc: Account, hour: number) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === acc.id ? { ...a, post_hour_utc: hour } : a))
    );

    await fetch("/api/threads/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: acc.id, post_hour_utc: hour }),
    });
  }

  if (loading || checking) return null;

  return (
    <main className="min-h-screen bg-[#FAF8F2] p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#1D1B18]">Connect Threads</h1>
          <p className="text-sm text-[#6B6459]">
            Link your Threads accounts to post content
          </p>
        </header>

        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-xl border border-[#E4DFD3] bg-white px-4 py-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#1D1B18]">
                  <span className="text-[#16a34a] font-medium">Connected</span>{" "}
                  <span className="text-[#6B6459]">— {acc.username || `Threads #${acc.threads_user_id.slice(0, 8)}`}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acc.is_enabled}
                    onChange={() => toggleAutoPost(acc)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#D8D2C4] rounded-full peer peer-checked:bg-[#3F7857] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3F7857]/30 transition-colors after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#6B6459]">Post at</label>
                <select
                  value={acc.post_hour_utc}
                  onChange={(e) => setPostHour(acc, Number(e.target.value))}
                  className="text-xs border border-[#E4DFD3] rounded-lg bg-white px-2 py-1 text-[#1D1B18]"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, "0")}:00 UTC
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-[#A39C8C]">
                Auto-post: {acc.is_enabled ? "On" : "Off"}
              </p>
            </div>
          ))}

          {accounts.length === 0 && !checking && (
            <p className="text-sm text-[#6B6459]">
              No Threads accounts connected yet.
            </p>
          )}
        </div>

        <a
          href="/api/auth/threads/login"
          className="inline-block rounded-xl bg-[#1D1B18] px-6 py-3 text-sm font-medium text-white hover:bg-[#2F4468] transition-colors"
        >
          Connect another Threads account
        </a>
      </div>
    </main>
  );
}
