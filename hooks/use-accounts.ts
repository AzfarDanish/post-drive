"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface Account {
  id: string;
  threads_user_id: string;
  username?: string | null;
  token_preview?: string;
  me?: { ok: boolean; data: unknown };
  publishing_limit?: { ok: boolean; data: unknown };
}

interface CheckResponse {
  connected: boolean;
  accounts: Account[];
}

export function useAccounts() {
  const { data, error, isLoading, mutate } = useSWR<CheckResponse>(
    "/api/threads/check",
    fetcher,
    {
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
    }
  );

  return {
    accounts: data?.accounts ?? [],
    connected: data?.connected ?? false,
    loading: isLoading,
    error,
    mutate,
  };
}
