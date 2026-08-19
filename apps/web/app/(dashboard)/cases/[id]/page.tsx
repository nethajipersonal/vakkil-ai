"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useCase, type HearingSummary } from "@/hooks/useCases";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";
import { alpha, useTheme } from "@mui/material/styles";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";

const STATUS_OPTIONS = ["active", "disposed", "stayed", "transferred"] as const;
const STATUS_CHIP: Record<string, "success" | "default" | "warning" | "info"> = {
  active: "success", disposed: "default", stayed: "warning", transferred: "info",
};
const HEARING_TYPES = ["arguments", "evidence", "judgment", "mention", "settlement", "other"] as const;
const HEARING_LABELS: Record<string, string> = {
  arguments: "Arguments", evidence: "Evidence", judgment: "Judgment",
  mention: "Mention", settlement: "Settlement", other: "Other",
};
const HEARING_CHIP: Record<string, "primary" | "secondary" | "error" | "default" | "success"> = {
  arguments: "primary", evidence: "secondary", judgment: "error",
  mention: "default", settlement: "success", other: "default",
};

type AddHearingForm = { hearing_date: string; hearing_type: string; purpose: string };
const EMPTY_HEARING: AddHearingForm = { hearing_date: "", hearing_type: "other", purpose: "" };

export default function CaseDetailPage() {
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useCase(id);

  const [showHearingForm, setShowHearingForm] = useState(false);
  const [hearingForm, setHearingForm] = useState<AddHearingForm>(EMPTY_HEARING);
  const [submittingHearing, setSubmittingHearing] = useState(false);

  const [editingOutcome, setEditingOutcome] = useState<string | null>(null);
  const [outcomeText, setOutcomeText] = useState("");
  const [nextDate, setNextDate] = useState("");

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const [savingStatus, setSavingStatus] = useState(false);
  const [deletingCase, setDeletingCase] = useState(false);

  async function handleAddHearing(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingHearing(true);
    try {
      await api.post(`/cases/${id}/hearings`, { ...hearingForm, purpose: hearingForm.purpose || null });
      toast.success("Hearing added");
      setHearingForm(EMPTY_HEARING);
      setShowHearingForm(false);
      refetch();
    } catch { toast.error("Failed to add hearing"); }
    finally { setSubmittingHearing(false); }
  }

  async function handleUpdateStatus(s: string) {
    setSavingStatus(true);
    try { await api.patch(`/cases/${id}`, { status: s }); toast.success("Status updated"); refetch(); }
    catch { toast.error("Failed to update status"); }
    finally { setSavingStatus(false); }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try { await api.patch(`/cases/${id}`, { notes: notesText }); toast.success("Notes saved"); setEditingNotes(false); refetch(); }
    catch { toast.error("Failed to save notes"); }
    finally { setSavingNotes(false); }
  }

  async function handleSaveOutcome(hearingId: string) {
    try {
      await api.patch(`/cases/${id}/hearings/${hearingId}`, { outcome: outcomeText || null, next_date: nextDate || null });
      toast.success("Outcome saved"); setEditingOutcome(null); refetch();
    } catch { toast.error("Failed to save outcome"); }
  }

  async function handleDeleteHearing(hearingId: string) {
    if (!confirm("Delete this hearing?")) return;
    try { await api.delete(`/cases/${id}/hearings/${hearingId}`); toast.success("Hearing deleted"); refetch(); }
    catch { toast.error("Failed to delete hearing"); }
  }

  async function handleDeleteCase() {
    if (!confirm("Delete this case and all hearings? Cannot be undone.")) return;
    setDeletingCase(true);
    try { await api.delete(`/cases/${id}`); toast.success("Case deleted"); router.push("/cases"); }
    catch { toast.error("Failed to delete case"); setDeletingCase(false); }
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 4, maxWidth: 720 }}>
        <Skeleton variant="text" width={120} height={32} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3, mb: 2 }} />
        <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ mb: 1 }}>Case not found</Typography>
        <Link href="/cases" style={{ color: theme.palette.primary.main, fontSize: 14 }}>← Back to Cases</Link>
      </Box>
    );
  }

  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const sorted = [...data.hearings].sort((a, b) => new Date(b.hearing_date).getTime() - new Date(a.hearing_date).getTime());
  const upcoming = sorted.filter((h) => new Date(h.hearing_date) >= today);
  const past = sorted.filter((h) => new Date(h.hearing_date) < today);

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 720 }}>
      {/* Back */}
      <Button
        component={Link}
        href="/cases"
        startIcon={<ArrowBackRoundedIcon />}
        size="small"
        sx={{ color: "text.secondary", mb: 3, textTransform: "none", "&:hover": { color: "text.primary" } }}
      >
        All Cases
      </Button>

      {/* Case card */}
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden", mb: 3 }}>
        {/* Gradient header */}
        <Box sx={{ background: "linear-gradient(135deg, #4f46e5, #6d28d9)", px: 3, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {data.case_type}
            </Typography>
            <Typography sx={{ color: "#fff", fontSize: 20, fontWeight: 800, mt: 0.25 }}>
              {data.case_number} / {data.case_year}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControl size="small" disabled={savingStatus}>
              <Select
                value={data.status}
                onChange={(e) => void handleUpdateStatus(e.target.value)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 2, fontSize: 13, fontWeight: 600,
                  "& .MuiOutlinedInput-notchedOutline": { border: "1px solid rgba(255,255,255,0.3)" },
                  "& .MuiSvgIcon-root": { color: "#fff" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.6)" },
                  textTransform: "capitalize",
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s} sx={{ textTransform: "capitalize", fontSize: 13 }}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              onClick={handleDeleteCase}
              disabled={deletingCase}
              size="small"
              sx={{ color: "rgba(255,255,255,0.6)", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(239,68,68,0.3)", color: "#fff" } }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ px: 3, py: 3 }}>
          {/* Parties */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
            <BalanceRoundedIcon sx={{ fontSize: 18, color: "text.disabled", mt: 0.25, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{data.petitioner_name}</Typography>
              <Typography sx={{ fontSize: 12, color: "text.disabled", my: 0.25 }}>vs</Typography>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{data.respondent_name}</Typography>
            </Box>
          </Box>

          {/* Court */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
            <LocationOnRoundedIcon sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }} />
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              {data.court_name} · {data.court_state}
            </Typography>
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          {/* Notes */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Case Notes
              </Typography>
              {!editingNotes && (
                <Button
                  size="small"
                  startIcon={<EditRoundedIcon sx={{ fontSize: 13 }} />}
                  onClick={() => { setNotesText(data.notes ?? ""); setEditingNotes(true); }}
                  sx={{ fontSize: 12, textTransform: "none", color: "primary.main", p: 0, minWidth: 0 }}
                >
                  Edit
                </Button>
              )}
            </Box>

            {editingNotes ? (
              <Box>
                <TextField
                  multiline rows={3} fullWidth size="small"
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Add notes about this case…"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 14 } }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1.5 }}>
                  <Button size="small" onClick={() => setEditingNotes(false)} sx={{ textTransform: "none", color: "text.secondary" }}>Cancel</Button>
                  <Button
                    size="small" variant="contained" onClick={() => void handleSaveNotes()} disabled={savingNotes}
                    sx={{ textTransform: "none", borderRadius: 1.5, background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                  >
                    {savingNotes ? "Saving…" : "Save"}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography sx={{ fontSize: 14, color: data.notes ? "text.secondary" : "text.disabled", fontStyle: data.notes ? "normal" : "italic" }}>
                {data.notes ?? "No notes yet — click Edit to add"}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Hearings header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
          Hearing Diary
          <Typography component="span" sx={{ ml: 1, fontSize: 13, fontWeight: 400, color: "text.disabled" }}>
            ({data.hearings.length})
          </Typography>
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          size="small"
          onClick={() => setShowHearingForm((v) => !v)}
          sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
        >
          Add Hearing
        </Button>
      </Box>

      {/* Add hearing form */}
      <Collapse in={showHearingForm}>
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5, mb: 2 }}>
          <Box component="form" onSubmit={handleAddHearing} sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Date" type="date" required size="small" fullWidth
              value={hearingForm.hearing_date}
              onChange={(e) => setHearingForm((p) => ({ ...p, hearing_date: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={hearingForm.hearing_type}
                onChange={(e) => setHearingForm((p) => ({ ...p, hearing_type: e.target.value }))}
                sx={{ borderRadius: 2 }}
              >
                {HEARING_TYPES.map((ht) => <MenuItem key={ht} value={ht}>{HEARING_LABELS[ht]}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Purpose" placeholder="e.g. Arguments on merits" size="small" fullWidth
              value={hearingForm.purpose}
              onChange={(e) => setHearingForm((p) => ({ ...p, purpose: e.target.value }))}
              sx={{ gridColumn: "1 / -1", "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button size="small" onClick={() => setShowHearingForm(false)} sx={{ textTransform: "none", color: "text.secondary" }}>Cancel</Button>
              <Button
                type="submit" variant="contained" size="small" disabled={submittingHearing}
                sx={{ textTransform: "none", borderRadius: 1.5, fontWeight: 600, background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
              >
                {submittingHearing ? "Adding…" : "Add"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Collapse>

      {/* Hearing timeline */}
      {data.hearings.length === 0 ? (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, py: 7, textAlign: "center" }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 40, color: "action.disabled", mb: 1.5 }} />
          <Typography sx={{ color: "text.secondary", fontWeight: 500, mb: 0.5 }}>No hearings recorded</Typography>
          <Typography className={fontCls} sx={{ color: "text.disabled", fontSize: 13 }}>
            {t("caseDetailPage", "noHearings")}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {upcoming.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "primary.main", textTransform: "uppercase", letterSpacing: "0.1em", mb: 1.5 }}>
                Upcoming
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {upcoming.map((h) => (
                  <HearingRow
                    key={h.id} hearing={h} caseId={id}
                    editingOutcome={editingOutcome} outcomeText={outcomeText} nextDate={nextDate}
                    onEdit={() => { setEditingOutcome(h.id); setOutcomeText(h.outcome ?? ""); setNextDate(h.next_date ?? ""); }}
                    onCancel={() => setEditingOutcome(null)}
                    onSave={() => handleSaveOutcome(h.id)}
                    onDelete={() => handleDeleteHearing(h.id)}
                    onOutcomeChange={setOutcomeText}
                    onNextDateChange={setNextDate}
                    upcoming
                  />
                ))}
              </Box>
            </Box>
          )}
          {past.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.1em", mb: 1.5 }}>
                Past
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {past.map((h) => (
                  <HearingRow
                    key={h.id} hearing={h} caseId={id}
                    editingOutcome={editingOutcome} outcomeText={outcomeText} nextDate={nextDate}
                    onEdit={() => { setEditingOutcome(h.id); setOutcomeText(h.outcome ?? ""); setNextDate(h.next_date ?? ""); }}
                    onCancel={() => setEditingOutcome(null)}
                    onSave={() => handleSaveOutcome(h.id)}
                    onDelete={() => handleDeleteHearing(h.id)}
                    onOutcomeChange={setOutcomeText}
                    onNextDateChange={setNextDate}
                    upcoming={false}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

function HearingRow({
  hearing, editingOutcome, outcomeText, nextDate,
  onEdit, onCancel, onSave, onDelete, onOutcomeChange, onNextDateChange, upcoming,
}: {
  hearing: HearingSummary;
  caseId: string;
  editingOutcome: string | null;
  outcomeText: string;
  nextDate: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onOutcomeChange: (v: string) => void;
  onNextDateChange: (v: string) => void;
  upcoming: boolean;
}) {
  const theme = useTheme();
  const isEditing = editingOutcome === hearing.id;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: upcoming ? alpha(theme.palette.primary.main, 0.2) : "divider",
        borderRadius: 3,
        p: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
        {/* Date column */}
        <Box sx={{ flexShrink: 0, width: 44, textAlign: "center", opacity: upcoming ? 1 : 0.55 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: upcoming ? "primary.main" : "text.disabled" }}>
            {format(parseISO(hearing.hearing_date), "dd")}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.disabled", textTransform: "uppercase" }}>
            {format(parseISO(hearing.hearing_date), "MMM")}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.disabled" }}>
            {format(parseISO(hearing.hearing_date), "yyyy")}
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
            <Chip
              label={HEARING_LABELS[hearing.hearing_type] ?? hearing.hearing_type}
              color={HEARING_CHIP[hearing.hearing_type] ?? "default"}
              size="small"
              sx={{ fontSize: 11, fontWeight: 600, height: 22 }}
            />
            {hearing.purpose && (
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{hearing.purpose}</Typography>
            )}
          </Box>

          {hearing.outcome && !isEditing && (
            <Box sx={{ mt: 1.5, display: "flex", alignItems: "flex-start", gap: 1, bgcolor: alpha(theme.palette.success.main, 0.06), border: "1px solid", borderColor: alpha(theme.palette.success.main, 0.15), borderRadius: 2, px: 1.5, py: 1 }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "success.main", flexShrink: 0, mt: 0.1 }} />
              <Typography sx={{ fontSize: 13, color: "success.dark" }}>{hearing.outcome}</Typography>
            </Box>
          )}

          {hearing.next_date && !isEditing && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
              <CalendarMonthRoundedIcon sx={{ fontSize: 13, color: "text.disabled" }} />
              <Typography sx={{ fontSize: 12, color: "text.disabled" }}>
                Next: {format(parseISO(hearing.next_date), "dd MMM yyyy")}
              </Typography>
            </Box>
          )}

          {/* Outcome editor */}
          {isEditing && (
            <Box sx={{ mt: 1.5 }}>
              <TextField
                multiline rows={2} fullWidth size="small"
                value={outcomeText}
                onChange={(e) => onOutcomeChange(e.target.value)}
                placeholder="What happened at this hearing?"
                sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13 } }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", whiteSpace: "nowrap" }}>Next date</Typography>
                  <TextField
                    type="date" size="small"
                    value={nextDate}
                    onChange={(e) => onNextDateChange(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ width: 150, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 12 }, "& input": { py: 0.75 } }}
                  />
                </Box>
                <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
                  <Button size="small" onClick={onCancel} sx={{ textTransform: "none", fontSize: 12, color: "text.secondary" }}>Cancel</Button>
                  <Button
                    size="small" variant="contained"
                    onClick={() => void onSave()}
                    sx={{ textTransform: "none", fontSize: 12, borderRadius: 1.5, background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Actions */}
        {!isEditing && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            <Button
              size="small"
              onClick={onEdit}
              sx={{ textTransform: "none", fontSize: 12, color: "primary.main", borderRadius: 1.5, px: 1.5, whiteSpace: "nowrap" }}
            >
              {hearing.outcome ? "Edit" : "Add outcome"}
            </Button>
            <IconButton
              size="small"
              onClick={() => void onDelete()}
              sx={{ color: "text.disabled", "&:hover": { color: "error.main", bgcolor: alpha("#ef4444", 0.08) } }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
