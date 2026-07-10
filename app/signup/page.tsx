"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        await refresh();
        router.push("/post");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F2] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-[#1D1B18]">Post Drive</h1>
          <p className="text-sm text-[#6B6459]">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1D1B18]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-[#E4DFD3] bg-white px-3 py-2 text-sm text-[#1D1B18] placeholder:text-[#A39C8C] focus:outline-none focus:ring-2 focus:ring-[#2F4468]/25 focus:border-[#2F4468]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1D1B18]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="w-full rounded-xl border border-[#E4DFD3] bg-white px-3 py-2 text-sm text-[#1D1B18] placeholder:text-[#A39C8C] focus:outline-none focus:ring-2 focus:ring-[#2F4468]/25 focus:border-[#2F4468]"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-[#FBEAE8] border border-[#F0C4BF] px-3 py-2 text-xs text-[#8A2A22]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#1D1B18] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2F4468] disabled:bg-[#C9C3B5] disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B6459]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#2F4468] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
