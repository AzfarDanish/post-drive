"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";

export default function NavAccountStatus() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <a
          href="/login"
          style={{ color: "#2F4468", fontWeight: 500, textDecoration: "none" }}
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
      }}
    >
      <span style={{ color: "#6B6459" }}>{user.email}</span>
      <button
        onClick={handleLogout}
        style={{
          background: "none",
          border: "1px solid #E4DFD3",
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: 12,
          color: "#57534A",
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </div>
  );
}
