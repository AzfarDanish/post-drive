"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ConnectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-[#FAF8F2] p-6">
      <div className="max-w-lg mx-auto text-center space-y-4 pt-20">
        <h1 className="text-3xl font-semibold text-[#1D1B18]">Threads Connected</h1>
        <p className="text-[#6B6459]">
          Your Threads account has been linked successfully.
        </p>
        <a
          href="/post"
          className="inline-block rounded-xl bg-[#1D1B18] px-6 py-3 text-sm font-medium text-white hover:bg-[#2F4468] transition-colors"
        >
          Go to Post
        </a>
      </div>
    </main>
  );
}
