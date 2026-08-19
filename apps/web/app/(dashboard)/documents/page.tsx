"use client";

import { useDocuments } from "@/hooks/useDocuments";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import InputAdornment from "@mui/material/InputAdornment";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

const DOC_TYPE_LABELS: Record<string, string> = {
  legal_notice: "Legal Notice",
  rent_agreement: "Rent Agreement",
  consumer_complaint: "Consumer Complaint",
  bail_application: "Bail Application",
  cheque_bounce_notice: "Cheque Bounce Notice",
};

const LANG_LABELS: Record<string, string> = {
  ta: "Tamil", en: "English", te: "Telugu", hi: "Hindi",
};

async function handleDownload(docId: string) {
  try {
    const res = await api.get<{ url: string }>(`/documents/${docId}/download`);
    window.open(res.data.url, "_blank");
  } catch {
    toast.error("PDF not ready yet");
  }
}

function handleWhatsAppShare(title: string, docId: string) {
  const text = encodeURIComponent(
    `உங்கள் சட்ட ஆவணம் "${title}" VaakiL AI மூலம் தயாரிக்கப்பட்டது.\n\nDocument ID: ${docId}\n\nஆவணத்தை பெற பதிலளிக்கவும்.`
  );
  window.open(`https://wa.me/?text=${text}`, "_blank");
}

export default function DocumentsPage() {
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const [search, setSearch] = useState("");
  const { documents, isLoading, refetch } = useDocuments();

  const filtered = search
    ? documents.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : documents;

  const completed = filtered.filter((d) => d.status === "completed");
  const inProgress = filtered.filter((d) => d.status === "pending" || d.status === "generating");
  const failed = filtered.filter((d) => d.status === "failed");

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Documents</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }} className={fontCls}>
            {t("documentsPage", "subtitle")}
          </Typography>
        </Box>
        <Button component={Link} href="/documents/new" variant="contained"
          startIcon={<AddRoundedIcon />}
          sx={{ borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } }}>
          New Document
        </Button>
      </Box>

      <TextField
        fullWidth
        size="small"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment>,
            sx: { borderRadius: 2.5 },
          },
        }}
      />

      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 3 }} />)}
        </Box>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 6, textAlign: "center" }}>
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 3, display: "inline-flex", mb: 2 }}>
            <DescriptionRoundedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
          </Box>
          <Typography sx={{ fontWeight: 700 }}>No documents yet</Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }} className={fontCls}>
            {t("documentsPage", "noDocuments")}
          </Typography>
          <Button component={Link} href="/documents/new" variant="contained"
            startIcon={<AddRoundedIcon />} sx={{ mt: 3, borderRadius: 2, fontWeight: 700 }}>
            Generate your first document
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {inProgress.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "warning.main", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
                Generating — {inProgress.length}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {inProgress.map((doc) => <DocCard key={doc.id} doc={doc} onRefresh={refetch} />)}
              </Box>
            </Box>
          )}
          {completed.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "success.main", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
                Completed — {completed.length}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {completed.map((doc) => <DocCard key={doc.id} doc={doc} onRefresh={refetch} />)}
              </Box>
            </Box>
          )}
          {failed.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "error.main", textTransform: "uppercase", letterSpacing: "0.08em", mb: 1.5 }}>
                Failed — {failed.length}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {failed.map((doc) => <DocCard key={doc.id} doc={doc} onRefresh={refetch} />)}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

function DocCard({
  doc,
  onRefresh,
}: {
  doc: ReturnType<typeof useDocuments>["documents"][number];
  onRefresh: () => void;
}) {
  const theme = useTheme();
  const generating = doc.status === "pending" || doc.status === "generating";
  const statusColor = doc.status === "completed" ? theme.palette.success.main
    : doc.status === "failed" ? theme.palette.error.main
    : theme.palette.warning.main;

  return (
    <Paper elevation={0} sx={{
      borderRadius: 2.5, border: "1px solid", borderColor: "divider", p: 2,
      display: "flex", alignItems: "center", gap: 2,
      "&:hover": { boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.06)}` },
      transition: "box-shadow 0.2s",
    }}>
      <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha(statusColor, 0.1), flexShrink: 0 }}>
        {doc.status === "completed" ? (
          <CheckCircleRoundedIcon sx={{ fontSize: 20, color: "success.main" }} />
        ) : doc.status === "failed" ? (
          <CancelRoundedIcon sx={{ fontSize: 20, color: "error.main" }} />
        ) : (
          <CircularProgress size={20} color="warning" />
        )}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {doc.title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
          {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type} · {LANG_LABELS[doc.language] ?? doc.language.toUpperCase()} · {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        {generating && (
          <Button size="small" variant="text" onClick={onRefresh} color="warning" sx={{ fontSize: 12, borderRadius: 1.5 }}>
            Refresh
          </Button>
        )}
        {doc.status === "completed" && (
          <>
            <Button size="small" variant="text" color="success"
              startIcon={<ShareRoundedIcon sx={{ fontSize: 14 }} />}
              onClick={() => handleWhatsAppShare(doc.title, doc.id)}
              sx={{ fontSize: 12, borderRadius: 1.5 }}>
              WhatsApp
            </Button>
            {doc.s3_pdf_key && (
              <Button size="small" variant="text" color="primary"
                startIcon={<DownloadRoundedIcon sx={{ fontSize: 14 }} />}
                onClick={() => void handleDownload(doc.id)}
                sx={{ fontSize: 12, borderRadius: 1.5 }}>
                PDF
              </Button>
            )}
          </>
        )}
        {doc.status === "failed" && (
          <Button component={Link} href="/documents/new" size="small" variant="text" color="inherit" sx={{ fontSize: 12, borderRadius: 1.5 }}>
            Try again
          </Button>
        )}
      </Box>
    </Paper>
  );
}
