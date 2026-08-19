"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type DocumentSummary = {
  id: string;
  title: string;
  doc_type: string;
  language: string;
  status: "pending" | "generating" | "completed" | "failed";
  s3_pdf_key: string | null;
  created_at: string;
  updated_at: string;
};

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchDocuments() {
    try {
      const res = await api.get<DocumentSummary[]>("/documents");
      setDocuments(res.data);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchDocuments();
  }, []);

  return { documents, isLoading, refetch: fetchDocuments };
}
