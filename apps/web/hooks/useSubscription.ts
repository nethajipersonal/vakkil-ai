"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export interface SubscriptionInfo {
  plan_tier: string;
  plan_name: string;
  status: string;
  documents_used: number;
  document_limit: number;
  period_end: string | null;
  razorpay_key_id: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const mutate = useCallback(async () => {
    try {
      const res = await api.get<SubscriptionInfo>("/billing/subscription");
      setSubscription(res.data);
      setIsError(false);
    } catch {
      setIsError(true);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    mutate().finally(() => setIsLoading(false));
  }, [mutate]);

  return { subscription, isLoading, isError, mutate };
}
