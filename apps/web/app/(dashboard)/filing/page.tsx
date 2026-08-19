"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha, useTheme } from "@mui/material/styles";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ChecklistRtlRoundedIcon from "@mui/icons-material/ChecklistRtlRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";

interface Case {
  id: string;
  case_number: string;
  case_year: number;
  case_type: string;
  court_name: string;
  petitioner_name: string;
  respondent_name: string;
}

interface FilingKit {
  case_number: string;
  case_type: string;
  court_name: string;
  court_fee_estimate: string;
  court_fee_fixed: number | null;
  checklist: string[];
  covering_letter_template: string;
  efiling_portal: string | null;
  efiling_url: string | null;
  steps: string[];
}

interface Portal {
  name: string;
  url: string;
}

export default function FilingPage() {
  const theme = useTheme();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [kit, setKit] = useState<FilingKit | null>(null);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    void Promise.all([
      api.get<Case[]>("/cases").then((r) => setCases(r.data)),
      api.get<Portal[]>("/filing/portals").then((r) => setPortals(r.data)),
    ]);
  }, []);

  async function loadKit(caseId: string) {
    if (!caseId) return;
    setSelectedCase(caseId);
    setLoading(true);
    setKit(null);
    setChecked({});
    try {
      const res = await api.get<FilingKit>(`/filing/case/${caseId}`);
      setKit(res.data);
    } catch {
      toast.error("Could not load filing kit for this case.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const sectionHeader = (icon: React.ReactNode, label: string) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <Box sx={{ color: "primary.main" }}>{icon}</Box>
      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{label}</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 800, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Court e-Filing Kit</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
          Court fees, document checklist, covering letter & portal links — case-by-case
        </Typography>
      </Box>

      {/* Case selector */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3, mb: 3 }}>
        <TextField
          select fullWidth label="Select Case" value={selectedCase}
          onChange={(e) => void loadKit(e.target.value)}
          size="small"
        >
          <MenuItem value="">— Choose a case —</MenuItem>
          {cases.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.case_type} {c.case_number}/{c.case_year} — {c.petitioner_name} vs {c.respondent_name} ({c.court_name})
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {kit && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Court fee */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3 }}>
            {sectionHeader(<CurrencyRupeeRoundedIcon />, "Court Fee")}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Paper elevation={0} sx={{ flex: 1, textAlign: "center", p: 2.5, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.08), border: "1px solid", borderColor: alpha(theme.palette.success.main, 0.2) }}>
                <Typography sx={{ fontSize: 28, fontWeight: 800, color: "success.dark" }}>
                  {kit.court_fee_fixed !== null ? `₹${kit.court_fee_fixed}` : "Ad-valorem"}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>Estimated</Typography>
              </Paper>
              <Box sx={{ flex: 2 }}>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                  Range: <strong>{kit.court_fee_estimate}</strong>
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5 }}>
                  {kit.case_type} at {kit.court_name}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Checklist */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3 }}>
            {sectionHeader(<ChecklistRtlRoundedIcon />, "Document Checklist")}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {kit.checklist.map((item, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <Checkbox size="small" checked={!!checked[i]} onChange={(e) => setChecked((p) => ({ ...p, [i]: e.target.checked }))} sx={{ mt: -0.5 }} />
                  <Typography sx={{ fontSize: 13, color: "text.secondary", pt: 1, textDecoration: checked[i] ? "line-through" : "none", opacity: checked[i] ? 0.5 : 1 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Steps */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3 }}>
            {sectionHeader(<FormatListNumberedRoundedIcon />, "Filing Steps")}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {kit.steps.map((step, i) => (
                <Box key={i} sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ flexShrink: 0, width: 26, height: 26, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                    {i + 1}
                  </Box>
                  <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6, mt: 0.25 }}>
                    {step.replace(/^\d+\.\s*/, "")}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* eFiling portal */}
          {kit.efiling_url && (
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: alpha(theme.palette.primary.main, 0.3), bgcolor: alpha(theme.palette.primary.main, 0.06), p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: "primary.dark" }}>eFiling Portal</Typography>
                  <Typography sx={{ fontSize: 12, color: "primary.main", mt: 0.5 }}>{kit.efiling_portal}</Typography>
                </Box>
                <Button variant="contained" href={kit.efiling_url} target="_blank" rel="noreferrer"
                  endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{ borderRadius: 2, fontWeight: 700 }}>
                  Open Portal
                </Button>
              </Box>
            </Paper>
          )}

          {/* Covering letter */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
            <Box
              component="button"
              onClick={() => setLetterOpen((o) => !o)}
              sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", p: 3, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FolderOpenRoundedIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Covering Letter Template</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); copy(kit.covering_letter_template); }}
                  sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}>
                  <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
                </IconButton>
                {letterOpen ? <ExpandLessRoundedIcon sx={{ color: "text.secondary" }} /> : <ExpandMoreRoundedIcon sx={{ color: "text.secondary" }} />}
              </Box>
            </Box>
            <Collapse in={letterOpen}>
              <Divider />
              <Box sx={{ p: 3 }}>
                <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: 13, fontFamily: "monospace", lineHeight: 1.7, bgcolor: "action.hover", p: 2.5, borderRadius: 2, m: 0, color: "text.primary" }}>
                  {kit.covering_letter_template}
                </Box>
                <Button variant="outlined" startIcon={<ContentCopyRoundedIcon />} onClick={() => copy(kit.covering_letter_template)}
                  sx={{ mt: 2, borderRadius: 2 }}>
                  Copy Letter
                </Button>
              </Box>
            </Collapse>
          </Paper>
        </Box>
      )}

      {/* All portals when no case selected */}
      {!kit && !loading && portals.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2 }}>All eFiling Portals</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {portals.map((p) => (
              <Box key={p.name} component="a" href={p.url} target="_blank" rel="noreferrer"
                sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  p: 1.5, bgcolor: "action.hover", borderRadius: 2, textDecoration: "none",
                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08), "& .portal-arrow": { color: "primary.main" } },
                  transition: "background 0.15s",
                }}>
                <Typography sx={{ fontSize: 13, color: "text.primary" }}>{p.name}</Typography>
                <OpenInNewRoundedIcon className="portal-arrow" sx={{ fontSize: 16, color: "text.disabled" }} />
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
