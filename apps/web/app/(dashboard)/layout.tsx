"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTheme as useNextTheme } from "next-themes";
import NextLink from "next/link";

import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Popover from "@mui/material/Popover";
import Paper from "@mui/material/Paper";
import { alpha, useTheme } from "@mui/material/styles";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

// Icons — MUI
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import GavelRoundedIcon from "@mui/icons-material/GavelRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import ScaleIcon from "@mui/icons-material/Scale";
import MenuOpenRoundedIcon from "@mui/icons-material/MenuOpenRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import { api } from "@/lib/api";
import { useSubscription } from "@/hooks/useSubscription";
import ThemeSettingsModal from "@/components/ThemeSettingsModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/translations";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const DRAWER_FULL = 256;
const DRAWER_MINI = 72;

type NavKey = "dashboard" | "documents" | "cases" | "clients" | "research" | "whatsapp" | "filing" | "billing" | "settings" | "adminPanel";

const NAV: { href: string; label: string; navKey: NavKey; Icon: typeof DashboardRoundedIcon }[] = [
  { href: "/dashboard",  label: "Dashboard",      navKey: "dashboard",  Icon: DashboardRoundedIcon },
  { href: "/documents",  label: "Documents",      navKey: "documents",  Icon: DescriptionRoundedIcon },
  { href: "/cases",      label: "Cases",          navKey: "cases",      Icon: GavelRoundedIcon },
  { href: "/clients",    label: "Clients",        navKey: "clients",    Icon: PeopleRoundedIcon },
  { href: "/research",   label: "Legal Research", navKey: "research",   Icon: SearchRoundedIcon },
  { href: "/whatsapp",   label: "WhatsApp Bot",   navKey: "whatsapp",   Icon: WhatsAppIcon },
  { href: "/filing",     label: "e-Filing Kit",   navKey: "filing",     Icon: FolderOpenRoundedIcon },
  { href: "/billing",    label: "Billing",        navKey: "billing",    Icon: CreditCardRoundedIcon },
  { href: "/settings",   label: "Settings",       navKey: "settings",   Icon: SettingsRoundedIcon },
];

const PAGE_TITLE: Record<string, string> = {
  "/dashboard": "Dashboard", "/documents": "Documents", "/cases": "Cases",
  "/clients": "Clients", "/research": "Legal Research", "/whatsapp": "WhatsApp Bot",
  "/filing": "e-Filing Kit", "/billing": "Billing", "/settings": "Settings", "/admin": "Admin Panel",
};

const FONT_FAMILY_CSS: Record<Locale, string> = {
  en: "Inter, sans-serif",
  ta: "Noto Sans Tamil, sans-serif",
  te: "Noto Sans Telugu, sans-serif",
  hi: "Noto Sans Devanagari, sans-serif",
};

interface UserProfile { full_name: string; email: string; role: string; }

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  advocate: "Advocate",
  staff: "Staff",
};
interface HearingItem { id: string; case_id: string; hearing_date: string; case_type: string; case_number: string; case_year: number; court_name: string; }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const { resolvedTheme, setTheme } = useNextTheme();
  const { subscription } = useSubscription();
  const isDark = resolvedTheme === "dark";

  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hearings, setHearings] = useState<HearingItem[]>([]);

  // Anchor states for dropdowns
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [calAnchor, setCalAnchor] = useState<null | HTMLElement>(null);
  const [notifSeen, setNotifSeen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;

  const drawerW = collapsed ? DRAWER_MINI : DRAWER_FULL;

  useEffect(() => {
    const s = localStorage.getItem("sidebar-collapsed");
    if (s === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    api.get<UserProfile>("/users/me").then((r) => {
      setProfile(r.data);
      setIsAdmin(r.data.role === "admin" || r.data.role === "super_admin");
    }).catch(() => {});
    api.get<{ hearings: HearingItem[] }>("/cases/hearings/upcoming").then((r) => setHearings(r.data.hearings ?? [])).catch(() => {});
  }, []);

  function toggleSidebar() {
    setCollapsed((c) => { localStorage.setItem("sidebar-collapsed", String(!c)); return !c; });
  }

  async function logout() {
    try { await api.post("/auth/logout", {}); } catch {}
    router.push("/login");
  }

  const todayH = hearings.filter((h) => isToday(parseISO(h.hearing_date)));
  const tomorrowH = hearings.filter((h) => isTomorrow(parseISO(h.hearing_date)));
  const otherH = hearings.filter((h) => !isToday(parseISO(h.hearing_date)) && !isTomorrow(parseISO(h.hearing_date))).slice(0, 3);
  const unread = todayH.length + tomorrowH.length;

  const docsUsed = subscription?.documents_used ?? 0;
  const docLimit = subscription?.document_limit ?? 5;
  const planName = subscription?.plan_name ?? "Free";
  const usagePct = docLimit === 0 ? 0 : Math.min((docsUsed / docLimit) * 100, 100);
  const initials = profile ? (profile.full_name || profile.email).slice(0, 2).toUpperCase() : "??";

  const pageTitle = useMemo(() => {
    const key = Object.keys(PAGE_TITLE).find((k) => pathname === k || (k !== "/dashboard" && pathname.startsWith(k)));
    return key ? PAGE_TITLE[key] : "VaakiL AI";
  }, [pathname]);

  const sidebarBg = isDark
    ? "linear-gradient(180deg, #0a0f1e 0%, #0d1117 100%)"
    : "linear-gradient(180deg, #1e1b4b 0%, #1e1b4b 100%)";

  const navItems: { href: string; label: string; navKey: NavKey; Icon: typeof DashboardRoundedIcon }[] =
    [...NAV, ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", navKey: "adminPanel" as NavKey, Icon: AdminPanelSettingsRoundedIcon }] : [])];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>

      {/* ── Sidebar Drawer ─────────────────────────────────────────────────── */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerW,
          flexShrink: 0,
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          "& .MuiDrawer-paper": {
            width: drawerW,
            overflowX: "hidden",
            background: sidebarBg,
            borderRight: "1px solid",
            borderColor: "rgba(99,102,241,0.12)",
            transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
            boxSizing: "border-box",
          },
        }}
      >
        {/* Logo */}
        <Box sx={{
          px: 2, py: 2.5,
          borderBottom: "1px solid rgba(99,102,241,0.12)",
          display: "flex", alignItems: "center", gap: 1.5, minHeight: 64,
          background: "rgba(99,102,241,0.04)",
        }}>
          <Box sx={{
            position: "relative", flexShrink: 0,
            width: 40, height: 40,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.5)}`,
          }}>
            <ScaleIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          {!collapsed && (
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                VaakiL AI
              </Typography>
              <Typography className={fontCls} sx={{ color: alpha(theme.palette.primary.light, 0.7), fontSize: 11, mt: 0.5, whiteSpace: "nowrap" }}>
                {t("dashboardLayout", "brandSubtitle")}
              </Typography>
            </Box>
          )}
          {!collapsed && (
            <Chip label="BETA" size="small" sx={{
              ml: "auto", height: 18, fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              color: theme.palette.primary.light,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
            }} />
          )}
        </Box>

        {/* Nav list */}
        <List sx={{ flex: 1, px: 1.5, py: 2, overflowY: "auto", overflowX: "hidden" }}>
          {navItems.map(({ href, label, navKey, Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            const item = (
              <ListItemButton
                component={NextLink}
                href={href}
                selected={active}
                sx={{
                  borderRadius: 2.5,
                  mb: 0.5,
                  px: collapsed ? 1.5 : 1.5,
                  py: 1.25,
                  minHeight: 48,
                  justifyContent: collapsed ? "center" : "flex-start",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": active ? {
                    content: '""',
                    position: "absolute",
                    left: 0, top: "25%", bottom: "25%",
                    width: 3, borderRadius: "0 3px 3px 0",
                    background: "#fff",
                  } : {},
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 0,
                  mr: collapsed ? 0 : 1.5,
                  justifyContent: "center",
                  color: active ? "#fff" : "rgba(148,163,184,0.6)",
                }}>
                  <Icon sx={{ fontSize: 19 }} />
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={label}
                    secondary={t("nav", navKey)}
                    slotProps={{
                      primary:   { sx: { fontSize: 13.5, fontWeight: active ? 600 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
                      secondary: { sx: { fontSize: 10, fontFamily: FONT_FAMILY_CSS[locale], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: active ? "rgba(255,255,255,0.55)" : "rgba(100,116,139,0.8)" } },
                    }}
                  />
                )}
              </ListItemButton>
            );

            return collapsed ? (
              <Tooltip key={href} title={label} placement="right">
                <span>{item}</span>
              </Tooltip>
            ) : (
              <span key={href}>{item}</span>
            );
          })}
        </List>

        {/* Usage bar */}
        {!collapsed && (
          <Box sx={{ px: 2, py: 2, borderTop: "1px solid rgba(99,102,241,0.12)" }}>
            <Box sx={{
              p: 1.5, borderRadius: 3,
              bgcolor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: "rgba(148,163,184,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {planName} Plan
                </Typography>
                {docLimit > 0 && (
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: usagePct > 80 ? "#f87171" : "rgba(148,163,184,0.5)" }}>
                    {docsUsed}/{docLimit}
                  </Typography>
                )}
              </Box>
              {docLimit > 0 ? (
                <LinearProgress
                  variant="determinate"
                  value={usagePct}
                  sx={{
                    height: 4, borderRadius: 99,
                    bgcolor: "rgba(255,255,255,0.08)",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 99,
                      background: usagePct > 80
                        ? "linear-gradient(to right, #ef4444, #f43f5e)"
                        : `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    },
                  }}
                />
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <AutoAwesomeRoundedIcon sx={{ fontSize: 12, color: theme.palette.primary.light }} />
                  <Typography sx={{ fontSize: 10, fontWeight: 600, color: theme.palette.primary.light }}>Unlimited</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}>

        {/* ── AppBar ── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: isDark ? alpha("#0d1117", 0.85) : alpha("#ffffff", 0.85),
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid",
            borderColor: "divider",
            color: "text.primary",
          }}
        >
          <Toolbar sx={{ gap: 1.5, minHeight: "64px !important" }}>
            {/* Sidebar toggle */}
            <Tooltip title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <IconButton size="small" onClick={toggleSidebar} sx={{ color: "text.secondary" }}>
                {collapsed ? <MenuRoundedIcon fontSize="small" /> : <MenuOpenRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Page title */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{pageTitle}</Typography>
            </Box>

            {/* Theme toggle */}
            <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
              <IconButton size="small" onClick={() => setTheme(isDark ? "light" : "dark")} sx={{ color: "text.secondary" }}>
                {isDark ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton size="small" onClick={(e) => { setNotifAnchor(e.currentTarget); setNotifSeen(true); setCalAnchor(null); }} sx={{ color: "text.secondary" }}>
                <Badge badgeContent={notifSeen ? 0 : unread} color="error" max={9}>
                  <NotificationsNoneRoundedIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Calendar */}
            <Tooltip title="Today's hearings">
              <IconButton size="small" onClick={(e) => { setCalAnchor(e.currentTarget); setNotifAnchor(null); }} sx={{ color: "text.secondary" }}>
                <Badge variant="dot" color="warning" invisible={todayH.length === 0}>
                  <CalendarTodayRoundedIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Language */}
            <LanguageSwitcher />

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Profile */}
            <Box
              onClick={(e) => { setProfileAnchor(e.currentTarget); setNotifAnchor(null); setCalAnchor(null); }}
              sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", px: 1, py: 0.5, borderRadius: 2.5, "&:hover": { bgcolor: "action.hover" }, transition: "background 0.15s" }}
            >
              <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700 }}>{initials}</Avatar>
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{profile?.full_name?.split(" ")[0] ?? "Advocate"}</Typography>
                <Typography sx={{ fontSize: 10, color: "text.secondary", lineHeight: 1.2 }}>{ROLE_LABELS[profile?.role ?? "advocate"] ?? "Advocate"}</Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* ── Main page content ── */}
        <Box component="main" sx={{ flex: 1, overflow: "auto" }}>
          {children}
        </Box>
      </Box>

      {/* ── Notifications Menu ── */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { width: 320, maxHeight: 400, overflow: "auto" } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Notifications</Typography>
          {unread > 0 && <Chip label={`${unread} new`} size="small" color="error" sx={{ fontSize: 10 }} />}
        </Box>
        <Divider />
        {[...todayH.map(h => ({ ...h, tag: "TODAY" as const, color: "error" as const })),
          ...tomorrowH.map(h => ({ ...h, tag: "TMR" as const, color: "warning" as const })),
          ...otherH.map(h => ({ ...h, tag: "" as const, color: "primary" as const }))].length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CheckCircleOutlineRoundedIcon sx={{ fontSize: 36, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No upcoming hearings</Typography>
          </Box>
        ) : (
          [...todayH.map(h => ({ ...h, tag: "TODAY" as const, color: "error" as const })),
           ...tomorrowH.map(h => ({ ...h, tag: "TMR" as const, color: "warning" as const })),
           ...otherH.map(h => ({ ...h, tag: "" as const, color: "default" as const }))].map((h) => (
            <MenuItem key={h.id} component={NextLink} href={`/cases/${h.case_id}`} onClick={() => setNotifAnchor(null)} sx={{ py: 1.5 }}>
              <ListItemAvatar>
                <Avatar sx={{ width: 36, height: 36, bgcolor: `${h.color}.main`, opacity: 0.15, "& + *": { position: "absolute" } }}>
                  <EventNoteRoundedIcon sx={{ color: `${h.color}.main`, position: "absolute" }} fontSize="small" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={`${h.case_type} ${h.case_number}/${h.case_year}`}
                secondary={`${h.court_name} · ${format(parseISO(h.hearing_date), "dd MMM")}`}
                slotProps={{
                  primary:   { sx: { fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
                  secondary: { sx: { fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
                }}
              />
              {h.tag && <Chip label={h.tag} size="small" color={h.color as "error" | "warning"} sx={{ fontSize: 9, fontWeight: 700, height: 18, ml: 1 }} />}
            </MenuItem>
          ))
        )}
      </Menu>

      {/* ── Calendar Popover ── */}
      <Popover
        open={Boolean(calAnchor)}
        anchorEl={calAnchor}
        onClose={() => setCalAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Paper sx={{ width: 280, p: 0, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{format(new Date(), "EEEE, d MMMM")}</Typography>
            <Typography className={fontCls} variant="caption" color="text.secondary">{t("dashboardLayout", "today")}</Typography>
          </Box>
          <Box sx={{ p: 1.5 }}>
            {todayH.length === 0 ? (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 32, color: "success.main", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No hearings today</Typography>
                <Typography className={fontCls} variant="caption" color="text.disabled">{t("dashboardLayout", "noCourtToday")}</Typography>
              </Box>
            ) : (
              todayH.map((h) => (
                <ListItemButton key={h.id} component={NextLink} href={`/cases/${h.case_id}`} onClick={() => setCalAnchor(null)}
                  sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.08), mb: 0.5, "&:hover": { bgcolor: alpha(theme.palette.warning.main, 0.14) } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "warning.main", flexShrink: 0 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.case_type} {h.case_number}/{h.case_year}</Typography>
                      <Typography sx={{ fontSize: 11, color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.court_name}</Typography>
                    </Box>
                  </Box>
                </ListItemButton>
              ))
            )}
            <ListItemButton component={NextLink} href="/cases" onClick={() => setCalAnchor(null)}
              sx={{ borderRadius: 2, mt: 0.5, justifyContent: "center", color: "primary.main", fontWeight: 600, fontSize: 13 }}>
              View all cases →
            </ListItemButton>
          </Box>
        </Paper>
      </Popover>

      {/* ── Profile Menu ── */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { sx: { width: 220 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 38, height: 38, fontSize: 14 }}>{initials}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name || "Advocate"}</Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.email}</Typography>
          </Box>
        </Box>
        <Divider />
        {[
          { label: "Profile",         native: t("dashboardLayout", "profile"),         Icon: PersonRoundedIcon,   action: () => router.push("/settings") },
          { label: "Change Password", native: t("dashboardLayout", "changePassword"),  Icon: LockRoundedIcon,     action: () => { setProfileAnchor(null); setPwdOpen(true); } },
          { label: "Appearance",      native: t("dashboardLayout", "appearance"),      Icon: PaletteRoundedIcon,  action: () => { setProfileAnchor(null); setThemeOpen(true); } },
          { label: "Settings",        native: t("nav", "settings"),                    Icon: SettingsRoundedIcon, action: () => router.push("/settings") },
        ].map(({ label, native, Icon, action }) => (
          <MenuItem key={label} onClick={() => { setProfileAnchor(null); action(); }} sx={{ py: 1.25, gap: 1.5 }}>
            <Icon sx={{ fontSize: 17, color: "text.secondary" }} />
            <Box>
              <Typography sx={{ fontWeight: 500, fontSize: 13, lineHeight: 1.2 }}>{label}</Typography>
              <Typography className={fontCls} sx={{ fontSize: 9, color: "text.disabled" }}>{native}</Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => void logout()} sx={{ py: 1.25, gap: 1.5, color: "error.main" }}>
          <LogoutRoundedIcon sx={{ fontSize: 17 }} />
          <Box>
            <Typography sx={{ fontWeight: 500, fontSize: 13, lineHeight: 1.2 }}>Sign Out</Typography>
            <Typography className={fontCls} sx={{ fontSize: 9, color: "inherit", opacity: 0.7 }}>{t("dashboardLayout", "signOut")}</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* ── Modals ── */}
      <ThemeSettingsModal open={themeOpen} onClose={() => setThemeOpen(false)} />
      <ChangePasswordModal open={pwdOpen} onClose={() => setPwdOpen(false)} />
    </Box>
  );
}
