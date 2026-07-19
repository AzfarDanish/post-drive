"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface Account {
  id: string;
  threads_user_id: string;
  username?: string | null;
  is_active: boolean;
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
      dedupingInterval: 10_000,
      revalidateOnFocus: true,
      refreshInterval: 30_000,
    }
  );

  const accounts = data?.accounts ?? [];

  return {
    accounts,
    activeAccounts: accounts.filter((a) => a.is_active),
    connected: data?.connected ?? false,
    loading: isLoading,
    error,
    mutate,
  };
}
