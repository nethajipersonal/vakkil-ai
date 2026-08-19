"use client";

import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { api } from "@/lib/api";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import ScaleRoundedIcon from "@mui/icons-material/ScaleRounded";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";

type Step = "email" | "otp";

function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && typeof err.response?.data?.detail === "string") {
    return err.response.data.detail;
  }
  return fallback;
}

export default function LoginPage() {
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/login", { email });
      toast.success("OTP sent to your email");
      setStep("otp");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to send OTP. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ profile_completed: boolean }>("/auth/verify-otp", { email, otp });
      toast.success("Welcome to VaakiL AI!");
      window.location.href = res.data.profile_completed ? "/dashboard" : "/onboarding";
    } catch {
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F1629 0%, #1a2544 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", p: 2,
    }}>
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box component={Link} href="/" sx={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1.5, textDecoration: "none" }}>
            <Box sx={{ p: 1.75, bgcolor: "#4f46e5", borderRadius: 3, boxShadow: "0 8px 32px rgba(79,70,229,0.4)", display: "flex" }}>
              <ScaleRoundedIcon sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>VaakiL AI</Typography>
          </Box>
          <Typography sx={{ color: "#818cf8", fontSize: 13, mt: 1 }} className={fontCls}>
            {t("common", "appNameNative")} — {t("authPages", "tagline")}
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 4, p: 4, bgcolor: "#fff" }}>
          {step === "email" ? (
            <Box component="form" onSubmit={(e: React.FormEvent) => void handleRequestOtp(e)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Box sx={{ p: 1, bgcolor: "#eef2ff", borderRadius: 2, display: "flex" }}>
                  <MailRoundedIcon sx={{ fontSize: 20, color: "#4f46e5" }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>Sign in</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>OTP உங்கள் email-க்கு அனுப்பப்படும்</Typography>
                </Box>
              </Box>

              <TextField fullWidth label="Email address" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="advocate@example.com"
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start"><MailRoundedIcon sx={{ fontSize: 16, color: "text.disabled" }} /></InputAdornment>,
                    sx: { borderRadius: 2 },
                  },
                }} />

              <Button type="submit" variant="contained" fullWidth disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } }}>
                {loading ? "Sending…" : "Send OTP"}
              </Button>

              <Typography sx={{ textAlign: "center", fontSize: 13, color: "text.secondary" }}>
                New to VaakiL AI?{" "}
                <Box component={Link} href="/register" sx={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                  Create an account
                </Box>
              </Typography>
            </Box>
          ) : (
            <Box component="form" onSubmit={(e: React.FormEvent) => void handleVerifyOtp(e)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Box sx={{ p: 1, bgcolor: "#eef2ff", borderRadius: 2, display: "flex" }}>
                  <KeyRoundedIcon sx={{ fontSize: 20, color: "#4f46e5" }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>Enter OTP</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    Sent to {email}.{" "}
                    <Box component="button" type="button" onClick={() => setStep("email")}
                      sx={{ color: "#4f46e5", background: "none", border: "none", cursor: "pointer", p: 0, fontSize: "inherit", fontFamily: "inherit", "&:hover": { textDecoration: "underline" } }}>
                      Change
                    </Box>
                  </Typography>
                </Box>
              </Box>

              <TextField fullWidth label="6-digit OTP" required
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                sx={{ "& input": { textAlign: "center", letterSpacing: "0.5em", fontSize: 22, fontFamily: "monospace", fontWeight: 700 } }}
                slotProps={{
                  htmlInput: { inputMode: "numeric", pattern: "\\d{6}", maxLength: 6 },
                  input: { sx: { borderRadius: 2 } },
                }} />

              <Button type="submit" variant="contained" fullWidth disabled={loading || otp.length !== 6}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } }}>
                {loading ? "Verifying…" : "Verify & Sign In"}
              </Button>
            </Box>
          )}
        </Paper>

        <Typography sx={{ textAlign: "center", color: "rgba(129,140,248,0.5)", fontSize: 12, mt: 3 }}>
          Indian lawyers&apos; #1 AI-powered legal assistant
        </Typography>
      </Box>
    </Box>
  );
}
