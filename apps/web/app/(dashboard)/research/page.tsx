"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import { alpha, useTheme } from "@mui/material/styles";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

interface ResearchResult {
  title: string;
  court: string;
  date: string | null;
  citation: string | null;
  headline: string;
  url: string;
  ai_summary: string | null;
}

interface ResearchResponse {
  query: string;
  results: ResearchResult[];
  total_found: number;
  from_cache: boolean;
}

const POPULAR_QUERIES = [
  "Section 138 Negotiable Instruments Act cheque bounce",
  "Motor accident compensation quantum",
  "Bail conditions anticipatory bail",
  "Domestic violence protection order",
  "Land acquisition compensation dispute",
  "Service law termination order",
  "Consumer forum deficiency of service",
  "Maintenance under Section 125 CrPC",
  "Trademark infringement passing off",
  "Wrongful termination employment",
];

export default function ResearchPage() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [summarize, setSummarize] = useState(true);
  const [results, setResults] = useState<ResearchResult[] | null>(null);
  const [meta, setMeta] = useState<{ query: string; cached: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(q?: string) {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    if (q) setQuery(q);
    try {
      const res = await api.post<ResearchResponse>("/research/search", { query: searchQuery, summarize });
      setResults(res.data.results);
      setMeta({ query: res.data.query, cached: res.data.from_cache });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (detail?.includes("503") || detail?.includes("not configured")) {
        setError("IndianKanoon API key not configured. Add INDIANKANOON_API_KEY to your .env file.");
      } else {
        setError(detail ?? "Search failed. Please try again.");
      }
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 800, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Legal Research AI</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
          Search Indian case law via IndianKanoon + Claude AI summaries
        </Typography>
      </Box>

      {/* Search box */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 2.5, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
          <TextField
            fullWidth size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void search()}
            placeholder="e.g. anticipatory bail conditions Section 438 CrPC..."
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
                sx: { borderRadius: 2 },
              },
            }}
          />
          <Button variant="contained" onClick={() => void search()} disabled={loading || !query.trim()}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchRoundedIcon />}
            sx={{ px: 3, borderRadius: 2, fontWeight: 700, whiteSpace: "nowrap",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } }}>
            Search
          </Button>
        </Box>
        <Box
          component="label"
          sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13, color: "text.secondary", cursor: "pointer" }}
        >
          <Box
            component="input"
            type="checkbox"
            checked={summarize}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSummarize(e.target.checked)}
            sx={{ accentColor: theme.palette.primary.main }}
          />
          <AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
          AI summaries (Claude — top 5 results)
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* Popular queries */}
      {results === null && !loading && (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>Popular searches</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {POPULAR_QUERIES.map((q) => (
              <Chip key={q} label={q} size="small" variant="outlined" clickable
                onClick={() => void search(q)}
                sx={{ fontSize: 12, borderRadius: 2, "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08), borderColor: "primary.main" } }} />
            ))}
          </Box>
        </Box>
      )}

      {loading && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 2 }}>
          <CircularProgress size={32} color="primary" />
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            Searching IndianKanoon{summarize ? " + generating AI summaries" : ""}...
          </Typography>
        </Box>
      )}

      {results !== null && !loading && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              {results.length} results for &ldquo;{meta?.query}&rdquo;
            </Typography>
            {meta?.cached && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                <Typography sx={{ fontSize: 12, color: "text.disabled" }}>Cached</Typography>
              </Box>
            )}
          </Box>

          {results.length === 0 ? (
            <Typography sx={{ textAlign: "center", py: 6, color: "text.secondary", fontSize: 13 }}>
              No results found. Try different keywords.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {results.map((r, i) => (
                <Paper key={i} elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{r.title}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{r.court}</Typography>
                        {r.date && <Typography sx={{ fontSize: 12, color: "text.disabled" }}>• {r.date}</Typography>}
                        {r.citation && (
                          <Chip label={r.citation} size="small"
                            sx={{ fontSize: 11, height: 20, bgcolor: "action.hover" }} />
                        )}
                      </Box>
                    </Box>
                    <Box component="a" href={r.url} target="_blank" rel="noreferrer"
                      sx={{ p: 0.75, color: "text.disabled", borderRadius: 1.5, display: "flex",
                        "&:hover": { color: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.08) } }}>
                      <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                    </Box>
                  </Box>

                  {r.ai_summary ? (
                    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06), borderRadius: 2, p: 2, border: "1px solid", borderColor: alpha(theme.palette.primary.main, 0.15) }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
                        <AutoAwesomeRoundedIcon sx={{ fontSize: 14, color: "primary.main" }} />
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "primary.main" }}>AI Summary</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>{r.ai_summary}</Typography>
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6,
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                      {r.headline}
                    </Typography>
                  )}

                  <Box sx={{ mt: 1.5 }}>
                    <Box component="a" href={r.url} target="_blank" rel="noreferrer"
                      sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, fontSize: 13, color: "primary.main",
                        textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                      <MenuBookRoundedIcon sx={{ fontSize: 14 }} />
                      Read Full Judgment
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
