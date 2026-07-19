"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccounts } from "@/hooks/use-accounts";

export default function ConnectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { accounts, loading: accountsLoading, mutate } = useAccounts();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  async function handleDisconnect(accountId: string) {
    setDisconnecting(accountId);
    try {
      await fetch("/api/threads/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      await mutate();
    } finally {
      setDisconnecting(null);
    }
  }

  async function handleToggle(accountId: string, isActive: boolean) {
    setToggling(accountId);
    try {
      await fetch("/api/threads/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, isActive }),
      });
      await mutate();
    } finally {
      setToggling(null);
    }
  }

  if (loading || (accountsLoading && !accounts.length)) return null;

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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(acc.id, !acc.is_active)}
                    disabled={toggling === acc.id}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                      acc.is_active ? "bg-[#3F7857]" : "bg-[#C9C3B5]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        acc.is_active ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-[#1D1B18]">
                    <span className="text-[#16a34a] font-medium">Connected</span>{" "}
                    <span className="text-[#6B6459]">— {acc.username || "Threads account"}</span>
                  </span>
                </div>
                <button
                  onClick={() => handleDisconnect(acc.id)}
                  disabled={disconnecting === acc.id}
                  className="text-sm text-[#B3261E] hover:text-[#8A2A22] disabled:text-[#C9C3B5] disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {disconnecting === acc.id ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </div>
          ))}

          {accounts.length === 0 && !accountsLoading && (
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