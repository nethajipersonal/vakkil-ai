"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type HearingSummary = {
  id: string;
  case_id: string;
  hearing_date: string;
  hearing_type: string;
  purpose: string | null;
  outcome: string | null;
  next_date: string | null;
  created_at: string;
};

export type CaseSummary = {
  id: string;
  case_number: string;
  case_year: number;
  case_type: string;
  court_name: string;
  court_state: string;
  petitioner_name: string;
  respondent_name: string;
  status: string;
  notes: string | null;
  hearings: HearingSummary[];
  created_at: string;
  updated_at: string;
};

export type TodayHearing = {
  hearing_id: string;
  case_id: string;
  case_number: string;
  case_year: number;
  case_type: string;
  court_name: string;
  petitioner_name: string;
  respondent_name: string;
  hearing_type: string;
  purpose: string | null;
};

export function useCases() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchCases() {
    setIsLoading(true);
    try {
      const res = await api.get<CaseSummary[]>("/cases");
      setCases(res.data);
    } catch {
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchCases();
  }, []);

  return { cases, isLoading, refetch: fetchCases };
}

export function useCase(caseId: string) {
  const [data, setData] = useState<CaseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCase() {
    setIsLoading(true);
    try {
      const res = await api.get<CaseSummary>(`/cases/${caseId}`);
      setData(res.data);
      setError(null);
    } catch {
      setError("Failed to load case");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (caseId) void fetchCase();
  }, [caseId]);

  return { data, isLoading, error, refetch: fetchCase };
}

export function useTodayHearings() {
  const [hearings, setHearings] = useState<TodayHearing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<TodayHearing[]>("/cases/today")
      .then((r) => setHearings(r.data))
      .catch(() => setHearings([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { hearings, isLoading };
}
