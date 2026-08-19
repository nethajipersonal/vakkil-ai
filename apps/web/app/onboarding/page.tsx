"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import ScaleRoundedIcon from "@mui/icons-material/ScaleRounded";
import { alpha, useTheme } from "@mui/material/styles";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu",
  "Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Puducherry","Chandigarh",
];

const LANGUAGES = [
  { value: "ta", label: "Tamil — தமிழ்" },
  { value: "te", label: "Telugu — తెలుగు" },
  { value: "kn", label: "Kannada — ಕನ್ನಡ" },
  { value: "ml", label: "Malayalam — മലയാളം" },
  { value: "hi", label: "Hindi — हिंदी" },
  { value: "en", label: "English" },
];

export default function OnboardingPage() {
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const theme = useTheme();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    bar_council_number: "",
    state: "",
    preferred_language: "ta",
  });
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.state) {
      toast.error("Please fill name and state");
      return;
    }
    setLoading(true);
    try {
      await api.patch("/users/me", {
        full_name: form.full_name.trim(),
        phone: form.phone ? `+91${form.phone.replace(/\D/g, "")}` : undefined,
        bar_council_number: form.bar_council_number || undefined,
        state: form.state,
        preferred_language: form.preferred_language,
      });
      toast.success("Profile saved! Welcome to VaakiL AI");
      window.location.href = "/dashboard";
    } catch {
      toast.error("Failed to save profile. Please try again.");
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
      <Box sx={{ width: "100%", maxWidth: 480 }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: "#4f46e5", borderRadius: 3, display: "flex" }}>
              <ScaleRoundedIcon sx={{ fontSize: 28, color: "#fff" }} />
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>VaakiL AI</Typography>
          </Box>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>Complete Your Profile</Typography>
          <Typography sx={{ color: "#818cf8", fontSize: 13, mt: 0.5 }} className={fontCls}>
            {t("onboardingPage", "subtitle")}
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 4, p: 4 }}>
          {/* Progress */}
          <Box sx={{ mb: 4 }}>
            <LinearProgress variant="determinate" value={67}
              sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.15) }} />
            <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 1, textAlign: "right" }}>2 / 3</Typography>
          </Box>

          <Box component="form" onSubmit={(e: React.FormEvent) => void handleSubmit(e)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField fullWidth label="Full Name *" required placeholder="Adv. Murugan Subramanian"
              value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 2 } } }} />

            <TextField fullWidth label="Bar Council Enrollment No." placeholder="TN/123/2010"
              value={form.bar_council_number} onChange={(e) => update("bar_council_number", e.target.value)}
              helperText="Optional — used for document headers"
              slotProps={{ input: { sx: { borderRadius: 2 } } }} />

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1, color: "text.primary" }}>Mobile Number</Typography>
              <Box sx={{ display: "flex", gap: 0 }}>
                <Paper elevation={0} sx={{ display: "flex", alignItems: "center", px: 2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider", borderRight: "none", borderRadius: "8px 0 0 8px", flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: "text.secondary" }}>+91</Typography>
                </Paper>
                <TextField fullWidth placeholder="98765 43210" type="tel"
                  value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  slotProps={{ input: { sx: { borderRadius: "0 8px 8px 0" } } }}
                  sx={{ "& .MuiOutlinedInput-notchedOutline": { borderLeftColor: "transparent" } }} />
              </Box>
            </Box>

            <TextField select fullWidth label="State / UT *" required value={form.state}
              onChange={(e) => update("state", e.target.value)}
              slotProps={{ input: { sx: { borderRadius: 2 } } }}>
              <MenuItem value="">Select state…</MenuItem>
              {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>

            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1.5, color: "text.primary" }}>
                Preferred document language
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                {LANGUAGES.map((l) => (
                  <Box key={l.value} component="button" type="button"
                    onClick={() => update("preferred_language", l.value)}
                    sx={{
                      px: 1.5, py: 1.25, borderRadius: 2, border: "1.5px solid", textAlign: "left", cursor: "pointer",
                      borderColor: form.preferred_language === l.value ? "primary.main" : "divider",
                      bgcolor: form.preferred_language === l.value ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                      transition: "all 0.15s",
                    }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: form.preferred_language === l.value ? "primary.main" : "text.secondary" }}>
                      {l.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Button type="submit" variant="contained" fullWidth disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, mt: 1,
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } }}>
              {loading ? "Saving…" : "Complete Setup →"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
