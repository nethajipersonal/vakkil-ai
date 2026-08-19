"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type Template = {
  id: string;
  name: string;
  slug: string;
  description: string;
  doc_type: string;
  supported_languages: string[];
  form_schema: {
    type: string;
    required?: string[];
    properties: Record<string, { type: string; title: string }>;
  };
  is_premium: boolean;
};

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<Template[]>("/documents/templates")
      .then((r) => setTemplates(r.data))
      .catch(() => setTemplates([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { templates, isLoading };
}
