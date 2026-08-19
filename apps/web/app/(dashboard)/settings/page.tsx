"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir",
  "Ladakh","Lakshadweep","Puducherry",
];

const LANGUAGES = [
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "en", label: "English", native: "English" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
];

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  bar_council_number: string | null;
  state: string | null;
  preferred_language: string;
}

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const muiTheme = useMuiTheme();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [barCouncil, setBarCouncil] = useState("");
  const [state, setState] = useState("");
  const [language, setLanguage] = useState("ta");

  useEffect(() => {
    setMounted(true);
    api.get<UserProfile>("/users/me").then((r) => {
      const u = r.data;
      setProfile(u);
      setFullName(u.full_name ?? "");
      setPhone(u.phone?.replace("+91", "") ?? "");
      setBarCouncil(u.bar_council_number ?? "");
      setState(u.state ?? "");
      setLanguage(u.preferred_language ?? "ta");
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/users/me", {
        full_name: fullName,
        phone: phone ? `+91${phone}` : undefined,
        bar_council_number: barCouncil || undefined,
        state: state || undefined,
        preferred_language: language,
      });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const initials = (profile.full_name || profile.email).slice(0, 2).toUpperCase();

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 720, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Settings</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }} className={fontCls}>
          {t("settingsPage", "subtitle")}
        </Typography>
      </Box>

      {/* Account card */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <Box sx={{ p: 0.75, bgcolor: alpha(muiTheme.palette.primary.main, 0.1), borderRadius: 1.5, display: "flex", alignItems: "center" }}>
            <ShieldRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
          </Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Account
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <Avatar sx={{ width: 56, height: 56, borderRadius: 2.5, background: "linear-gradient(135deg, #6366f1, #7c3aed)", fontWeight: 700, fontSize: 18 }}>
              {initials}
            </Avatar>
            <Box sx={{ position: "absolute", bottom: -4, right: -4, width: 14, height: 14, bgcolor: "#10b981", border: "2px solid", borderColor: "background.paper", borderRadius: "50%" }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{profile.full_name || "(Name not set)"}</Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>{profile.email}</Typography>
            {profile.bar_council_number && (
              <Chip size="small" color="primary" variant="outlined" label={`Enrollment: ${profile.bar_council_number}`} sx={{ mt: 1, fontSize: 11, height: 22 }} />
            )}
          </Box>
        </Box>
      </Paper>

      {/* Appearance */}
      {mounted && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
            <Box sx={{ p: 0.75, bgcolor: alpha(muiTheme.palette.primary.main, 0.1), borderRadius: 1.5, display: "flex", alignItems: "center" }}>
              <PaletteRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
            </Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Appearance
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>Theme</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
            {[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ].map(({ value, label, icon: Icon }) => {
              const active = theme === value;
              const isDarkPreview = value === "dark" || (value === "system" && resolvedTheme === "dark");
              return (
                <Box
                  key={value}
                  component="button"
                  type="button"
                  onClick={() => setTheme(value)}
                  sx={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                    p: 2, borderRadius: 2, border: "2px solid",
                    borderColor: active ? "primary.main" : "divider",
                    bgcolor: active ? alpha(muiTheme.palette.primary.main, 0.08) : "transparent",
                    cursor: "pointer", transition: "all 0.15s", position: "relative",
                    "&:hover": { borderColor: "primary.light" },
                  }}
                >
                  <Box sx={{
                    width: "100%", height: 40, borderRadius: 1.5, border: "1px solid",
                    borderColor: isDarkPreview ? "rgba(100,116,139,0.5)" : "rgba(226,232,240,1)",
                    bgcolor: isDarkPreview ? "#0f172a" : "#ffffff",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5,
                  }}>
                    <Box sx={{ width: 8, height: 24, borderRadius: 99, bgcolor: "#6366f1" }} />
                    <Box sx={{ width: 16, height: 8, borderRadius: 1, bgcolor: isDarkPreview ? "#334155" : "#f1f5f9" }} />
                    <Box sx={{ width: 12, height: 8, borderRadius: 1, bgcolor: isDarkPreview ? "#334155" : "#f1f5f9" }} />
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Icon style={{ width: 14, height: 14, color: active ? muiTheme.palette.primary.main : muiTheme.palette.text.secondary }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: active ? "primary.main" : "text.secondary" }}>{label}</Typography>
                  </Box>
                  {active && <Box sx={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, bgcolor: "primary.main", borderRadius: "50%" }} />}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* Profile form */}
      <Paper
        component="form"
        onSubmit={(e: React.FormEvent) => void handleSave(e)}
        elevation={0}
        sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ p: 0.75, bgcolor: alpha(muiTheme.palette.primary.main, 0.1), borderRadius: 1.5, display: "flex", alignItems: "center" }}>
            <PersonRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
          </Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Profile Details
          </Typography>
        </Box>

        <TextField label="Full Name" fullWidth variant="outlined" size="small" required value={fullName}
          onChange={(e) => setFullName(e.target.value)} placeholder="Advocate Full Name"
          slotProps={{ input: { startAdornment: <PersonRoundedIcon sx={{ fontSize: 16, color: "text.disabled", mr: 1 }} /> } }} />

        <TextField label="Bar Council Enrollment No." fullWidth variant="outlined" size="small"
          value={barCouncil} onChange={(e) => setBarCouncil(e.target.value)} placeholder="TN/1234/2020" />

        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 500, mb: 1 }}>
            Mobile Number{" "}
            <Typography component="span" sx={{ fontSize: 11, color: "text.secondary", fontWeight: 400 }}>
              (WhatsApp bot இதை use பண்ணும்)
            </Typography>
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Paper elevation={0} sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5, bgcolor: "action.hover", flexShrink: 0 }}>
              <PhoneRoundedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 500 }}>+91</Typography>
            </Paper>
            <TextField fullWidth variant="outlined" size="small" type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" />
          </Box>
        </Box>

        <TextField select label="State / UT" fullWidth variant="outlined" size="small" value={state} onChange={(e) => setState(e.target.value)}>
          <MenuItem value="">Select state</MenuItem>
          {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
            <PublicRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Preferred Language</Typography>
          </Box>
          <ToggleButtonGroup
            value={language} exclusive
            onChange={(_, val) => { if (val) setLanguage(val); }}
            sx={{ flexWrap: "wrap", gap: 1, "& .MuiToggleButtonGroup-grouped": { borderRadius: "10px !important", border: "1px solid !important", borderColor: "divider !important", mx: 0 } }}
          >
            {LANGUAGES.map((lang) => (
              <ToggleButton key={lang.code} value={lang.code}
                sx={{ px: 2, py: 0.875, fontSize: 13, fontWeight: 500, textTransform: "none",
                  "&.Mui-selected": { background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", borderColor: "#4f46e5 !important", "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } } }}>
                {lang.native}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Button variant="contained" type="submit" fullWidth disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
          sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } }}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </Paper>
    </Box>
  );
}
