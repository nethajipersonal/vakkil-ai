"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function PortalLoginPage() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/portal/auth/request-otp", { email });
      setStep("otp");
      toast.success("OTP sent to your email");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/portal/auth/verify-otp", { email, otp });
      router.push("/portal/dashboard");
    } catch {
      toast.error("Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Box sx={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", p: 1.75, bgcolor: "#4f46e5", borderRadius: 3, mb: 2 }}>
            <ScaleRoundedIcon sx={{ fontSize: 28, color: "#fff" }} />
          </Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>Client Portal</Typography>
          <Typography sx={{ color: "#818cf8", fontSize: 13, mt: 0.5 }} className={fontCls}>
            VaakiL AI — {t("authPages", "portalTagline")}
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ bgcolor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 3, p: 3 }}>
          {step === "email" ? (
            <Box component="form" onSubmit={(e: React.FormEvent) => void requestOtp(e)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", mb: 1.5 }}>Email Address</Typography>
                <TextField fullWidth required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><MailRoundedIcon sx={{ fontSize: 16, color: "#6366f1" }} /></InputAdornment>,
                      sx: { borderRadius: 2, bgcolor: "rgba(255,255,255,0.08)", color: "#fff",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.4)" },
                        "& input": { color: "#fff" }, "& input::placeholder": { color: "rgba(255,255,255,0.4)", opacity: 1 } },
                    },
                  }} />
                <Typography sx={{ fontSize: 12, color: "#818cf8", mt: 1 }}>
                  Use the email your advocate registered for you.
                </Typography>
              </Box>
              <Button type="submit" variant="contained" fullWidth disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardRoundedIcon />}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, bgcolor: "#4f46e5", "&:hover": { bgcolor: "#4338ca" } }}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={(e: React.FormEvent) => void verifyOtp(e)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Typography sx={{ fontSize: 13, color: "#a5b4fc" }}>
                OTP sent to <Box component="span" sx={{ fontWeight: 700, color: "#fff" }}>{email}</Box>
              </Typography>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", mb: 1.5 }}>Enter OTP</Typography>
                <TextField fullWidth required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  slotProps={{
                    htmlInput: { inputMode: "numeric", maxLength: 6 },
                    input: {
                      startAdornment: <InputAdornment position="start"><KeyRoundedIcon sx={{ fontSize: 16, color: "#6366f1" }} /></InputAdornment>,
                      sx: { borderRadius: 2, bgcolor: "rgba(255,255,255,0.08)",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.4)" },
                        "& input": { color: "#fff", textAlign: "center", fontSize: 24, fontWeight: 700, letterSpacing: "0.3em" },
                        "& input::placeholder": { color: "rgba(255,255,255,0.3)", opacity: 1, letterSpacing: "normal", fontSize: 14 } },
                    },
                  }} />
              </Box>
              <Button type="submit" variant="contained" fullWidth disabled={loading || otp.length < 6}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, bgcolor: "#4f46e5", "&:hover": { bgcolor: "#4338ca" } }}>
                {loading ? "Verifying..." : "Sign In"}
              </Button>
              <Button type="button" variant="text" onClick={() => { setStep("email"); setOtp(""); }}
                sx={{ color: "#818cf8", fontSize: 13, "&:hover": { color: "#c7d2fe" } }}>
                ← Use a different email
              </Button>
            </Box>
          )}
        </Paper>

        <Typography sx={{ textAlign: "center", fontSize: 12, color: "#4338ca", mt: 3 }}>
          Powered by VaakiL AI • Advocate&apos;s Daily OS
        </Typography>
      </Box>
    </Box>
  );
}
