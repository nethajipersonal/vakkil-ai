"use client";

import { useState } from "react";
import Link from "next/link";
import { useCases } from "@/hooks/useCases";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import ScaleRoundedIcon from "@mui/icons-material/ScaleRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

type NewCaseForm = {
  case_number: string; case_year: string; case_type: string;
  court_name: string; court_state: string; petitioner_name: string; respondent_name: string;
};
const EMPTY_FORM: NewCaseForm = {
  case_number: "", case_year: String(new Date().getFullYear()),
  case_type: "", court_name: "", court_state: "", petitioner_name: "", respondent_name: "",
};

const STATUS_COLORS: Record<string, "success" | "default" | "warning" | "info"> = {
  active: "success", disposed: "default", stayed: "warning", transferred: "info",
};

export default function CasesPage() {
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const theme = useTheme();
  const { cases, isLoading, refetch } = useCases();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewCaseForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  function update(key: keyof NewCaseForm, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleAddCase(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/cases", { ...form, case_year: Number(form.case_year) });
      toast.success("Case added");
      setForm(EMPTY_FORM);
      setShowForm(false);
      refetch();
    } catch {
      toast.error("Failed to add case");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = cases.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.case_number.toLowerCase().includes(q) || c.petitioner_name.toLowerCase().includes(q) ||
      c.respondent_name.toLowerCase().includes(q) || c.court_name.toLowerCase().includes(q);
  });
  const active = filtered.filter((c) => c.status === "active");
  const others = filtered.filter((c) => c.status !== "active");

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Cases</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }} className={fontCls}>
            {t("casesPage", "subtitle")}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setShowForm(true)}
          sx={{ borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } }}>
          Add Case
        </Button>
      </Box>

      <TextField fullWidth size="small" placeholder="Search by case number, party name, court…"
        value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
            sx: { borderRadius: 2.5 },
          },
        }} />

      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={88} sx={{ borderRadius: 3 }} />)}
        </Box>
      ) : cases.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 6, textAlign: "center" }}>
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 3, display: "inline-flex", mb: 2 }}>
            <MenuBookRoundedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
          </Box>
          <Typography sx={{ fontWeight: 700 }}>No cases yet</Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }} className={fontCls}>{t("casesPage", "noCases")}</Typography>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setShowForm(true)}
            sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }}>
            Add your first case
          </Button>
        </Paper>
      ) : filtered.length === 0 ? (
        <Typography sx={{ textAlign: "center", py: 6, color: "text.secondary", fontSize: 13 }}>
          No cases match your search.
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {active.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
                Active — {active.length}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {active.map((c) => <CaseCard key={c.id} c={c} />)}
              </Box>
            </Box>
          )}
          {others.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
                Closed / Other — {others.length}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {others.map((c) => <CaseCard key={c.id} c={c} />)}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Add Case Dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setForm(EMPTY_FORM); }} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <ScaleRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} /> New Case
        </DialogTitle>
        <Box component="form" onSubmit={(e: React.FormEvent) => void handleAddCase(e)}>
          <DialogContent sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              {(
                [
                  { key: "case_number", label: "Case Number", placeholder: "WP/123" },
                  { key: "case_year", label: "Year", type: "number", placeholder: "2024" },
                  { key: "case_type", label: "Case Type", placeholder: "WP, CMA, CRL…" },
                  { key: "court_name", label: "Court Name", placeholder: "Madras High Court" },
                  { key: "court_state", label: "State", placeholder: "Tamil Nadu" },
                  { key: "petitioner_name", label: "Petitioner", placeholder: "Full name" },
                  { key: "respondent_name", label: "Respondent", placeholder: "Full name / State" },
                ] as { key: keyof NewCaseForm; label: string; type?: string; placeholder: string }[]
              ).map(({ key, label, type, placeholder }) => (
                <Grid size={{ xs: 12, sm: 6 }} key={key}>
                  <TextField fullWidth size="small" label={label} type={type ?? "text"} required
                    placeholder={placeholder} value={form[key]} onChange={(e) => update(key, e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              {submitting ? "Adding…" : "Add Case"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

function CaseCard({ c }: { c: ReturnType<typeof useCases>["cases"][number] }) {
  const theme = useTheme();
  const upcoming = c.hearings
    .filter((h) => new Date(h.hearing_date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime());

  return (
    <Paper component={Link} href={`/cases/${c.id}`} elevation={0} sx={{
      borderRadius: 2.5, border: "1px solid", borderColor: "divider",
      p: 2, display: "flex", alignItems: "center", gap: 2.5, textDecoration: "none",
      "&:hover": { borderColor: "primary.light", boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}` },
      transition: "all 0.15s",
    }}>
      {/* Date badge */}
      <Box sx={{ flexShrink: 0, width: 44, textAlign: "center" }}>
        {upcoming.length > 0 ? (
          <>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: "primary.main", lineHeight: 1 }}>
              {format(parseISO(upcoming[0].hearing_date), "dd")}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary", textTransform: "uppercase" }}>
              {format(parseISO(upcoming[0].hearing_date), "MMM")}
            </Typography>
          </>
        ) : (
          <Box sx={{ p: 1, bgcolor: "action.hover", borderRadius: 2, display: "inline-flex" }}>
            <ScaleRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
          {c.case_type} {c.case_number}/{c.case_year}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", mt: 0.25 }}>
          {c.petitioner_name} <Box component="span" sx={{ color: "text.disabled" }}>vs</Box> {c.respondent_name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5 }}>
          <Typography sx={{ fontSize: 12, color: "text.disabled" }}>{c.court_name}</Typography>
          {upcoming.length > 0 && (
            <>
              <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.disabled" }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CalendarTodayRoundedIcon sx={{ fontSize: 11, color: "warning.main" }} />
                <Typography sx={{ fontSize: 12, color: "warning.main" }}>{upcoming[0].purpose ?? "Hearing scheduled"}</Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        <Chip label={c.status} size="small" color={STATUS_COLORS[c.status] ?? "default"}
          sx={{ textTransform: "capitalize", height: 22, fontSize: 11, fontWeight: 600 }} />
        <ChevronRightRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
      </Box>
    </Paper>
  );
}
