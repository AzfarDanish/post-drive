"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface Preferences {
  default_tone: string;
  business_description: string;
  website_url: string;
  char_min: number;
  char_max: number;
  target_audience: string;
  main_problem: string;
  key_features: string;
}

export function usePreferences(accountId?: string | null) {
  const url = accountId
    ? `/api/preferences?account_id=${accountId}`
    : "/api/preferences";

  const { data, error, isLoading, isValidating, mutate } = useSWR<Preferences>(
    url,
    fetcher,
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
    }
  );

  return {
    preferences: data,
    loading: isLoading,
    validating: isValidating,
    error,
    mutate,
  };
}
