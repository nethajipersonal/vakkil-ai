"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useTemplates, type Template } from "@/hooks/useTemplates";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

const LANGUAGE_OPTIONS = [
  { value: "ta", label: "Tamil (தமிழ்)" },
  { value: "en", label: "English" },
  { value: "te", label: "Telugu (తెలుగు)" },
  { value: "hi", label: "Hindi (हिंदी)" },
];

export default function NewDocumentPage() {
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const theme = useTheme();
  const router = useRouter();
  const { templates, isLoading } = useTemplates();
  const [selected, setSelected] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState("ta");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function selectTemplate(tpl: Template) {
    setSelected(tpl);
    setFormData({});
    setLanguage(tpl.supported_languages[0] ?? "ta");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      await api.post("/documents/generate", {
        template_id: selected.id,
        title: title.trim() || `${selected.name} — ${new Date().toLocaleDateString("ta-IN")}`,
        language,
        form_data: formData,
      });
      toast.success("Document generation started! Ready in a few seconds.");
      router.push("/documents");
    } catch {
      toast.error("Failed to generate. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
        <CircularProgress size={20} /> Loading templates…
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 640 }}>
      <Button component={Link} href="/documents" startIcon={<ArrowBackRoundedIcon />}
        color="inherit" sx={{ mb: 3, color: "text.secondary", fontSize: 13 }}>
        Back to Documents
      </Button>

      <Typography variant="h5" sx={{ fontWeight: 800 }}>New Document</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5, mb: 3 }} className={fontCls}>
        {t("newDocumentPage", "subtitle")}
      </Typography>

      {!selected ? (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 2 }}>Select document type:</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {templates.map((tpl) => (
              <Paper key={tpl.id} elevation={0}
                onClick={() => selectTemplate(tpl)}
                sx={{
                  borderRadius: 2.5, border: "1px solid", borderColor: "divider",
                  p: 2.5, display: "flex", alignItems: "flex-start", gap: 2, cursor: "pointer",
                  "&:hover": { borderColor: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.04) },
                  transition: "all 0.15s",
                }}>
                <DescriptionRoundedIcon sx={{ fontSize: 20, color: "primary.main", mt: 0.25, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{tpl.name}</Typography>
                    {tpl.is_premium && (
                      <Chip icon={<LockRoundedIcon sx={{ fontSize: 12 }} />} label="Premium" size="small"
                        color="warning" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{tpl.description}</Typography>
                  <Typography sx={{ fontSize: 11, color: "text.disabled", mt: 0.5, textTransform: "uppercase" }}>
                    {tpl.supported_languages.join(" · ")}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      ) : (
        <Box component="form" onSubmit={(e: React.FormEvent) => void handleSubmit(e)} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Selected template */}
          <Paper elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: alpha(theme.palette.primary.main, 0.3), bgcolor: alpha(theme.palette.primary.main, 0.06), p: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <DescriptionRoundedIcon sx={{ fontSize: 20, color: "primary.main", flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: "primary.dark" }}>{selected.name}</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{selected.description}</Typography>
            </Box>
            <Button size="small" variant="text" onClick={() => setSelected(null)} sx={{ fontSize: 12 }}>
              Change
            </Button>
          </Paper>

          {/* Language */}
          <FormControl fullWidth size="small">
            <InputLabel>Language / மொழி</InputLabel>
            <Select value={language} label="Language / மொழி" onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGE_OPTIONS.filter((l) => selected.supported_languages.includes(l.value)).map((l) => (
                <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Optional title */}
          <TextField fullWidth size="small" label="Title" placeholder={`${selected.name} — auto title`}
            value={title} onChange={(e) => setTitle(e.target.value)}
            helperText="Optional" />

          {/* Dynamic form fields */}
          {Object.entries(selected.form_schema.properties).map(([key, field]) => {
            const isRequired = selected.form_schema.required?.includes(key);
            const isTextarea = field.type === "string" && (
              key.toLowerCase().includes("address") || key === "details" || key === "grievance" ||
              key === "brief_facts" || key === "grounds_for_bail" || key === "relief_sought"
            );
            return (
              <TextField
                key={key} fullWidth size="small"
                label={<>{field.title}{isRequired && <Box component="span" sx={{ color: "error.main", ml: 0.5 }}>*</Box>}</>}
                required={isRequired}
                multiline={isTextarea}
                rows={isTextarea ? 3 : 1}
                type={field.type === "number" ? "number" : "text"}
                value={formData[key] ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
              />
            );
          })}

          <Button type="submit" variant="contained" fullWidth disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRoundedIcon />}
            sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } }}>
            {submitting ? "Generating…" : "Generate Document"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
