"use client";

import NextLink from "next/link";
import { format, parseISO, isToday } from "date-fns";
import { useTheme as useNextTheme } from "next-themes";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { alpha, useTheme } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";

import { useCases, useTodayHearings } from "@/hooks/useCases";
import { useDocuments } from "@/hooks/useDocuments";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";

const STATUS_MAP: Record<string, { icon: React.ElementType; color: "success" | "warning" | "error" | "default"; label: string }> = {
  completed: { icon: CheckCircleRoundedIcon,         color: "success", label: "Completed" },
  draft:     { icon: RadioButtonUncheckedRoundedIcon, color: "default", label: "Draft"     },
  pending:   { icon: ScheduleRoundedIcon,             color: "warning", label: "Pending"   },
  failed:    { icon: ErrorOutlineRoundedIcon,          color: "error",   label: "Failed"    },
};

interface StatItem {
  label: string; native: string;
  value: number | string | null;
  sub: string; Icon: React.ElementType;
  color: string; glow: string; href: string; pulse?: boolean;
}

export default function DashboardPage() {
  const theme = useTheme();
  const { resolvedTheme } = useNextTheme();
  const isDark = resolvedTheme === "dark";
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;

  const QUICK_ACTIONS = [
    { label: "New Document", native: t("dashboardPage", "actionNewDocument"), Icon: DescriptionRoundedIcon, href: "/documents/new", color: "#6366f1" },
    { label: "Add Case",     native: t("dashboardPage", "actionAddCase"),     Icon: GavelRoundedIcon,        href: "/cases/new",     color: "#10b981" },
    { label: "Add Client",   native: t("dashboardPage", "actionAddClient"),   Icon: PeopleRoundedIcon,       href: "/clients",       color: "#f59e0b" },
    { label: "Research",     native: t("dashboardPage", "actionResearch"),    Icon: SearchRoundedIcon,       href: "/research",      color: "#0ea5e9" },
    { label: "e-Filing Kit", native: t("dashboardPage", "actionFiling"),      Icon: FolderOpenRoundedIcon,   href: "/filing",        color: "#a855f7" },
    { label: "WhatsApp Bot", native: t("dashboardPage", "actionWhatsapp"),    Icon: WhatsAppIcon,            href: "/whatsapp",      color: "#22c55e" },
  ];

  const { cases, isLoading: casesLoading } = useCases();
  const { documents, isLoading: docsLoading } = useDocuments();
  const { hearings: todayHearings, isLoading: hearingsLoading } = useTodayHearings();

  const activeCases   = cases.filter((c) => c.status === "active").length;
  const completedDocs = documents.filter((d) => d.status === "completed").length;
  const recentDocs    = [...documents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const upcomingHearings = cases
    .flatMap((c) => c.hearings.filter((h) => new Date(h.hearing_date) >= new Date(new Date().setHours(0, 0, 0, 0))).map((h) => ({ ...h, case: c })))
    .sort((a, b) => new Date(a.hearing_date).getTime() - new Date(b.hearing_date).getTime())
    .slice(0, 5);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetingNative = hour < 12 ? t("dashboardPage", "greetingMorning") : hour < 17 ? t("dashboardPage", "greetingAfternoon") : t("dashboardPage", "greetingEvening");

  const stats: StatItem[] = [
    {
      label: "Documents", native: t("dashboardPage", "statDocuments"),
      value: docsLoading ? null : documents.length,
      sub: completedDocs > 0 ? `+${completedDocs} completed` : "Start drafting",
      Icon: DescriptionRoundedIcon, color: theme.palette.primary.main, glow: alpha(theme.palette.primary.main, 0.15), href: "/documents",
    },
    {
      label: "Active Cases", native: t("dashboardPage", "statActiveCases"),
      value: casesLoading ? null : activeCases,
      sub: `${cases.length} total`,
      Icon: GavelRoundedIcon, color: theme.palette.success.main, glow: alpha(theme.palette.success.main, 0.15), href: "/cases",
    },
    {
      label: "Hearings Today", native: t("dashboardPage", "statHearingsToday"),
      value: hearingsLoading ? null : todayHearings.length,
      sub: todayHearings.length === 0 ? "Clear schedule" : "Court sessions",
      Icon: CalendarTodayRoundedIcon,
      color: todayHearings.length > 0 ? theme.palette.warning.main : theme.palette.text.disabled,
      glow: todayHearings.length > 0 ? alpha(theme.palette.warning.main, 0.15) : "transparent",
      href: "/cases", pulse: todayHearings.length > 0,
    },
    {
      label: "Billing", native: t("dashboardPage", "statBilling"),
      value: "₹ —", sub: "View billing",
      Icon: CreditCardRoundedIcon, color: "#f43f5e", glow: alpha("#f43f5e", 0.12), href: "/billing",
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: "auto" }}>

      {/* ── Hero Banner ── */}
      <Card sx={{
        mb: 4, overflow: "hidden", position: "relative",
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.35)}`,
        "&:hover": { transform: "none", boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.35)}` },
      }}>
        <Box sx={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
        <Box sx={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)", filter: "blur(40px)" }} />

        <CardContent sx={{ position: "relative", p: { xs: 3, md: 4 } }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 500, fontSize: 13 }}>{greeting}</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: { xs: 22, md: 28 }, letterSpacing: "-0.02em", mt: 0.5 }}>
                Advocate&apos;s Daily OS
              </Typography>
              <Typography className={fontCls} sx={{ color: "rgba(255,255,255,0.6)", fontSize: 13, mt: 0.5 }}>
                {greetingNative} — {t("dashboardPage", "subtitleSuffix")}
              </Typography>
              <Box sx={{ mt: 2.5, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                {todayHearings.length > 0 && (
                  <Chip
                    label={`${todayHearings.length} hearing${todayHearings.length > 1 ? "s" : ""} today`}
                    sx={{ bgcolor: "rgba(251,191,36,0.2)", color: "#fde68a", border: "1px solid rgba(251,191,36,0.3)", fontWeight: 600, fontSize: 12 }}
                  />
                )}
                <Chip
                  icon={<AutoAwesomeRoundedIcon sx={{ fontSize: "13px !important", color: "#c4b5fd !important" }} />}
                  label="AI-powered"
                  sx={{ bgcolor: "rgba(139,92,246,0.2)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)", fontWeight: 600, fontSize: 12 }}
                />
              </Box>
            </Box>
            <Button
              component={NextLink}
              href="/documents/new"
              startIcon={<AddRoundedIcon />}
              sx={{
                bgcolor: "#fff", color: theme.palette.primary.dark, fontWeight: 700,
                px: 2.5, py: 1.25, borderRadius: 3,
                "&:hover": { bgcolor: "#f0f4ff", transform: "translateY(-1px)", boxShadow: "0 6px 20px rgba(0,0,0,0.15)" },
                transition: "all 0.2s",
              }}
            >
              Draft Document
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Stat Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {stats.map(({ label, native, value, sub, Icon, color, glow, href, pulse = false }) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={label}>
            <Card
              component={NextLink}
              href={href}
              sx={{ height: "100%", cursor: "pointer", textDecoration: "none", transition: "transform 0.2s", "&:hover": { transform: "translateY(-3px)" } }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: glow, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {pulse && <Box sx={{ position: "absolute", inset: -3, borderRadius: "inherit", border: `2px solid ${alpha(color, 0.35)}`, animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />}
                    <Icon sx={{ color, fontSize: 22 }} />
                  </Box>
                  <TrendingUpRoundedIcon sx={{ color: "text.disabled", fontSize: 16, mt: 0.5 }} />
                </Box>
                {value === null ? (
                  <Skeleton variant="text" width={48} height={42} />
                ) : (
                  <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1 }}>{value}</Typography>
                )}
                <Typography sx={{ fontWeight: 600, color: "text.secondary", mt: 0.5, fontSize: 14 }}>{label}</Typography>
                <Typography className={fontCls} sx={{ fontSize: 10, color: "text.disabled" }}>{native}</Typography>
                <Typography sx={{ color, display: "block", mt: 1.5, fontWeight: 600, fontSize: 12 }}>{sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Quick Actions ── */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Quick Actions</Typography>
              <Typography className={fontCls} sx={{ fontSize: 11, color: "text.secondary" }}>{t("dashboardPage", "quickActions")}</Typography>
            </Box>
            <StarBorderRoundedIcon sx={{ color: "text.disabled", fontSize: 18 }} />
          </Box>
          <Grid container spacing={1.5}>
            {QUICK_ACTIONS.map(({ label, native, Icon, href, color }) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={label}>
                <Card
                  component={NextLink}
                  href={href}
                  variant="outlined"
                  sx={{
                    cursor: "pointer", textDecoration: "none",
                    borderColor: isDark ? "rgba(148,163,184,0.08)" : "rgba(15,23,42,0.07)",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: color,
                      bgcolor: alpha(color, 0.06),
                      transform: "translateY(-2px)",
                      boxShadow: `0 4px 20px ${alpha(color, 0.2)}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, textAlign: "center" }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2.5, mx: "auto", mb: 1, bgcolor: alpha(color, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon sx={{ color, fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 11, lineHeight: 1.3, display: "block" }}>{label}</Typography>
                    <Typography className={fontCls} sx={{ fontSize: 9, color: "text.disabled", mt: 0.25 }}>{native}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* ── Content Grid ── */}
      <Grid container spacing={3}>

        {/* Upcoming Hearings */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Upcoming Hearings</Typography>
                  <Typography className={fontCls} sx={{ fontSize: 11, color: "text.secondary" }}>{t("dashboardPage", "upcomingHearings")}</Typography>
                </Box>
                <Button component={NextLink} href="/cases" size="small" endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 13 }} />} sx={{ fontSize: 12, fontWeight: 600 }}>
                  View all
                </Button>
              </Box>

              {casesLoading
                ? [1, 2, 3].map((i) => <Skeleton key={i} height={58} sx={{ borderRadius: 2, mb: 1 }} />)
                : upcomingHearings.length === 0
                  ? (
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <CalendarTodayRoundedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
                      <Typography sx={{ color: "text.secondary", fontSize: 14 }}>No upcoming hearings</Typography>
                      <Typography className={fontCls} sx={{ fontSize: 11, color: "text.disabled" }}>{t("dashboardPage", "noUpcomingHearings")}</Typography>
                    </Box>
                  )
                  : upcomingHearings.map((h, i) => {
                    const date    = parseISO(h.hearing_date);
                    const todayHr = isToday(date);
                    return (
                      <Box key={h.id}>
                        {i > 0 && <Divider sx={{ my: 0.75 }} />}
                        <Box
                          component={NextLink}
                          href={`/cases/${h.case.id}`}
                          sx={{
                            display: "flex", alignItems: "center", gap: 2, py: 1.25, px: 1.5,
                            borderRadius: 2.5, cursor: "pointer", textDecoration: "none",
                            transition: "background 0.15s", "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <Avatar sx={{
                            width: 40, height: 40, borderRadius: 2.5, fontSize: 11, fontWeight: 800,
                            bgcolor: todayHr ? alpha(theme.palette.warning.main, 0.12) : alpha(theme.palette.primary.main, 0.1),
                            color:   todayHr ? theme.palette.warning.main : theme.palette.primary.main,
                            flexShrink: 0,
                          }}>
                            <Box sx={{ textAlign: "center", lineHeight: 1 }}>
                              <Box sx={{ fontWeight: 800, fontSize: 14 }}>{format(date, "d")}</Box>
                              <Box sx={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{format(date, "MMM")}</Box>
                            </Box>
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {h.case.case_type} {h.case.case_number}/{h.case.case_year}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {h.case.court_name}
                            </Typography>
                          </Box>
                          {todayHr
                            ? <Chip label="TODAY" size="small" color="warning" sx={{ fontSize: 9, fontWeight: 700, height: 18 }} />
                            : <Chip label={format(date, "EEE")} size="small" sx={{ fontSize: 9, fontWeight: 600, height: 18 }} />
                          }
                        </Box>
                      </Box>
                    );
                  })
              }
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Documents */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Recent Documents</Typography>
                  <Typography className={fontCls} sx={{ fontSize: 11, color: "text.secondary" }}>{t("dashboardPage", "recentDocuments")}</Typography>
                </Box>
                <Button component={NextLink} href="/documents" size="small" endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 13 }} />} sx={{ fontSize: 12, fontWeight: 600 }}>
                  View all
                </Button>
              </Box>

              {docsLoading
                ? [1, 2, 3].map((i) => <Skeleton key={i} height={58} sx={{ borderRadius: 2, mb: 1 }} />)
                : recentDocs.length === 0
                  ? (
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <DescriptionRoundedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
                      <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 0.5 }}>No documents yet</Typography>
                      <Typography className={fontCls} sx={{ fontSize: 11, color: "text.disabled", display: "block", mb: 2 }}>{t("dashboardPage", "noDocumentsYet")}</Typography>
                      <Button component={NextLink} href="/documents/new" variant="contained" size="small" startIcon={<AddRoundedIcon />}>
                        Create first document
                      </Button>
                    </Box>
                  )
                  : recentDocs.map((doc, i) => {
                    const s = STATUS_MAP[doc.status] ?? STATUS_MAP.draft;
                    const StatusIcon = s.icon;
                    return (
                      <Box key={doc.id}>
                        {i > 0 && <Divider sx={{ my: 0.75 }} />}
                        <Box
                          component={NextLink}
                          href={`/documents/${doc.id}`}
                          sx={{
                            display: "flex", alignItems: "center", gap: 2, py: 1.25, px: 1.5,
                            borderRadius: 2.5, cursor: "pointer", textDecoration: "none",
                            transition: "background 0.15s", "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <Box sx={{
                            width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <DescriptionRoundedIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {doc.title || "Untitled"}
                            </Typography>
                            <Typography sx={{ fontSize: 11, color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {doc.doc_type ?? "Document"} · {format(parseISO(doc.created_at), "d MMM yyyy")}
                            </Typography>
                          </Box>
                          <Chip
                            icon={<StatusIcon sx={{ fontSize: "12px !important" }} />}
                            label={s.label}
                            size="small"
                            color={s.color}
                            variant="outlined"
                            sx={{ fontSize: 10, fontWeight: 600, height: 20 }}
                          />
                        </Box>
                      </Box>
                    );
                  })
              }
            </CardContent>
          </Card>
        </Grid>

        {/* AI Insights */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{
            background: isDark
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.25)} 0%, ${alpha(theme.palette.secondary.dark, 0.18)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.06)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: 2.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}>
                  <AutoAwesomeRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>AI Insights</Typography>
                  <Typography className={fontCls} sx={{ fontSize: 11, color: "text.secondary" }}>{t("dashboardPage", "aiInsights")}</Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                {[
                  {
                    title: "Indian Evidence Act §65B — Digital Compliance",
                    desc:  "Recent SC ruling tightens certificate requirements for electronic records in court proceedings.",
                    tag: "Recent Judgment", tagColor: theme.palette.primary.main,
                  },
                  {
                    title: "Pending Document Review",
                    desc:  activeCases > 0
                      ? `You have ${activeCases} active cases with hearings approaching. Prepare your documents now.`
                      : "All your cases are up to date. Great work!",
                    tag: activeCases > 0 ? "Action Required" : "All Clear",
                    tagColor: activeCases > 0 ? theme.palette.warning.main : theme.palette.success.main,
                  },
                  {
                    title: "WhatsApp Client Updates",
                    desc:  "Send automated hearing reminders to clients via WhatsApp Bot. Set up templates once, use forever.",
                    tag: "Pro Tip", tagColor: "#22c55e",
                  },
                ].map((s, i) => (
                  <Grid size={{ xs: 12, md: 4 }} key={i}>
                    <Box sx={{
                      p: 2.5, borderRadius: 3, height: "100%",
                      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)"}`,
                    }}>
                      <Chip
                        label={s.tag}
                        size="small"
                        sx={{ mb: 1.5, fontSize: 10, fontWeight: 700, bgcolor: alpha(s.tagColor, 0.1), color: s.tagColor, border: `1px solid ${alpha(s.tagColor, 0.2)}` }}
                      />
                      <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 0.75, lineHeight: 1.4 }}>{s.title}</Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.5 }}>{s.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
