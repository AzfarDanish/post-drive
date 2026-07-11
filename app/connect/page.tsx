"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccounts } from "@/hooks/use-accounts";

export default function ConnectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { accounts, loading: accountsLoading } = useAccounts();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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
                <div className="text-sm text-[#1D1B18]">
                  <span className="text-[#16a34a] font-medium">Connected</span>{" "}
                  <span className="text-[#6B6459]">— {acc.username || `Threads #${acc.threads_user_id.slice(0, 8)}`}</span>
                </div>
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
