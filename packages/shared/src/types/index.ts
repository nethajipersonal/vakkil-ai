export type SupportedLanguage = "ta" | "te" | "kn" | "ml" | "hi" | "mr" | "bn" | "gu" | "en";

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  hi: "Hindi (हिंदी)",
  mr: "Marathi (मराठी)",
  bn: "Bengali (বাংলা)",
  gu: "Gujarati (ગુજરાતી)",
  en: "English",
};

export type DocumentStatus = "pending" | "generating" | "completed" | "failed";

export type CaseStatus = "active" | "disposed" | "stayed" | "transferred";

export type HearingType =
  | "arguments"
  | "evidence"
  | "judgment"
  | "mention"
  | "settlement"
  | "other";

export type PlanTier = "free" | "founding" | "standard" | "professional";

export const PLAN_PRICES: Record<PlanTier, number> = {
  free: 0,
  founding: 29900,     // ₹299 in paise
  standard: 59900,     // ₹599 in paise
  professional: 99900, // ₹999 in paise
};

export interface ApiError {
  detail: string;
  status_code?: number;
}
