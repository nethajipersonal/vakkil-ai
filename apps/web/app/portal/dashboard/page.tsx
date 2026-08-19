"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ScaleRoundedIcon from "@mui/icons-material/ScaleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

interface PortalSummary {
  advocate_name: string;
  total_billed: number;
  total_received: number;
  pending: number;
  documents_shared: number;
}

interface FeeEntry {
  id: string;
  description: string;
  amount: number;
  is_received: boolean;
  entry_date: string;
  case_id: string | null;
}

interface SharedDoc {
  id: string;
  title: string;
  doc_type: string;
  created_at: string;
}

const glass = {
  bgcolor: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 3,
};

function fmtCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PortalDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "fees" | "documents">("overview");
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [fees, setFees] = useState<FeeEntry[]>([]);
  const [docs, setDocs] = useState<SharedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [sumRes, feeRes, docRes] = await Promise.all([
        api.get<PortalSummary>("/portal/me"),
        api.get<FeeEntry[]>("/portal/fees"),
        api.get<SharedDoc[]>("/portal/documents"),
      ]);
      setSummary(sumRes.data);
      setFees(feeRes.data);
      setDocs(docRes.data);
    } catch {
      router.push("/portal/login");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api.post("/portal/auth/logout");
    router.push("/portal/login");
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#6366f1" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ maxWidth: 720, mx: "auto", mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: "#4f46e5", borderRadius: 2, display: "flex" }}>
            <ScaleRoundedIcon sx={{ fontSize: 22, color: "#fff" }} />
          </Box>
          <Box>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>My Portal</Typography>
            <Typography sx={{ color: "#818cf8", fontSize: 12, lineHeight: 1 }}>{summary?.advocate_name}</Typography>
          </Box>
        </Box>
        <IconButton onClick={() => void logout()} sx={{ color: "#818cf8", "&:hover": { color: "#fff" } }}>
          <LogoutRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        {/* Summary cards */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
          <Paper elevation={0} sx={{ ...glass, p: 2.5 }}>
            <CurrencyRupeeRoundedIcon sx={{ fontSize: 20, color: "#818cf8", mb: 1 }} />
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{fmtCurrency(summary?.total_billed ?? 0)}</Typography>
            <Typography sx={{ fontSize: 12, color: "#818cf8", mt: 0.5 }}>Total Fees</Typography>
          </Paper>
          <Paper elevation={0} sx={{ ...glass, p: 2.5 }}>
            <Typography sx={{ fontSize: 11, color: "#34d399", fontWeight: 700, mb: 1 }}>PAID</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{fmtCurrency(summary?.total_received ?? 0)}</Typography>
            <Typography sx={{ fontSize: 12, color: "#818cf8", mt: 0.5 }}>Received</Typography>
          </Paper>
          <Paper elevation={0} sx={{ ...glass, border: "1px solid rgba(251,191,36,0.3)", p: 2.5, gridColumn: { xs: "1 / -1", md: "auto" } }}>
            <Typography sx={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, mb: 1 }}>PENDING</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#fcd34d" }}>{fmtCurrency(summary?.pending ?? 0)}</Typography>
            <Typography sx={{ fontSize: 12, color: "#818cf8", mt: 0.5 }}>Due</Typography>
          </Paper>
        </Box>

        {/* Tabs */}
        <Box sx={{ display: "flex", gap: 0.75, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, p: 0.75, mb: 3 }}>
          {(["overview", "fees", "documents"] as const).map((t) => (
            <Button key={t} onClick={() => setTab(t)} fullWidth
              sx={{
                py: 1, borderRadius: 1.5, textTransform: "capitalize", fontWeight: 600,
                bgcolor: tab === t ? "#4f46e5" : "transparent",
                color: tab === t ? "#fff" : "#818cf8",
                "&:hover": { bgcolor: tab === t ? "#4338ca" : "rgba(255,255,255,0.05)", color: "#fff" },
              }}>
              {t}
            </Button>
          ))}
        </Box>

        {/* Tab content */}
        {tab === "overview" && (
          <Paper elevation={0} sx={{ ...glass, p: 3 }}>
            <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: 16, mb: 1.5 }}>Welcome to Your Portal</Typography>
            <Typography sx={{ color: "#a5b4fc", fontSize: 13, lineHeight: 1.7, mb: 3 }}>
              Here you can view your fee statements and documents shared by your advocate.
              For any queries, contact your advocate directly.
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <Button onClick={() => setTab("fees")} variant="outlined"
                startIcon={<CurrencyRupeeRoundedIcon />}
                sx={{ borderColor: "rgba(255,255,255,0.15)", color: "#c7d2fe", "&:hover": { borderColor: "rgba(255,255,255,0.3)", bgcolor: "rgba(255,255,255,0.05)" } }}>
                {fees.length} Fee Entries
              </Button>
              <Button onClick={() => setTab("documents")} variant="outlined"
                startIcon={<DescriptionRoundedIcon />}
                sx={{ borderColor: "rgba(255,255,255,0.15)", color: "#c7d2fe", "&:hover": { borderColor: "rgba(255,255,255,0.3)", bgcolor: "rgba(255,255,255,0.05)" } }}>
                {summary?.documents_shared ?? docs.length} Documents
              </Button>
            </Box>
          </Paper>
        )}

        {tab === "fees" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {fees.length === 0 ? (
              <Paper elevation={0} sx={{ ...glass, p: 6, textAlign: "center" }}>
                <Typography sx={{ color: "#818cf8", fontSize: 13 }}>No fee entries yet.</Typography>
              </Paper>
            ) : fees.map((fee) => (
              <Paper key={fee.id} elevation={0} sx={{ ...glass, p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{fee.description}</Typography>
                  <Typography sx={{ color: "#818cf8", fontSize: 12, mt: 0.5 }}>{fmtDate(fee.entry_date)}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{
                    fontSize: 11, fontWeight: 700, px: 1.5, py: 0.5, borderRadius: 2,
                    bgcolor: fee.is_received ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)",
                    color: fee.is_received ? "#34d399" : "#fbbf24",
                  }}>
                    {fee.is_received ? "paid" : "pending"}
                  </Box>
                  <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>{fmtCurrency(fee.amount)}</Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}

        {tab === "documents" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {docs.length === 0 ? (
              <Paper elevation={0} sx={{ ...glass, p: 6, textAlign: "center" }}>
                <Typography sx={{ color: "#818cf8", fontSize: 13 }}>No documents shared yet.</Typography>
              </Paper>
            ) : docs.map((doc) => (
              <Paper key={doc.id} elevation={0} sx={{ ...glass, p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ p: 1, bgcolor: "rgba(99,102,241,0.2)", borderRadius: 1.5, display: "flex" }}>
                    <DescriptionRoundedIcon sx={{ fontSize: 18, color: "#818cf8" }} />
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{doc.title}</Typography>
                    <Typography sx={{ color: "#818cf8", fontSize: 12 }}>{doc.doc_type} • {fmtDate(doc.created_at)}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton component="a" href={`/api/v1/documents/${doc.id}/download`} target="_blank" rel="noreferrer" size="small"
                    sx={{ color: "#818cf8", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}>
                    <DownloadRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton component="a" href={`/api/v1/documents/${doc.id}`} target="_blank" rel="noreferrer" size="small"
                    sx={{ color: "#818cf8", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}>
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
