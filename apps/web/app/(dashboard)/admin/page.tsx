"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import { alpha, useTheme } from "@mui/material/styles";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

interface Stats {
  total_users: number; active_users: number;
  total_documents_generated: number; paid_subscriptions: number;
  plan_breakdown: Record<string, number>;
}
interface AdminUser {
  id: string; email: string; full_name: string; phone: string | null;
  state: string | null; is_active: boolean; role: string; is_verified: boolean;
  created_at: string; plan_tier: string; documents_used: number;
}
interface Template {
  id: string; name: string; slug: string; doc_type: string;
  is_premium: boolean; is_active: boolean; supported_languages: string[];
}

const PLAN_COLOR: Record<string, "default" | "primary" | "warning"> = {
  free: "default", standard: "primary", professional: "warning",
};

export default function AdminPage() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<Stats>("/admin/stats")
      .then((r) => setStats(r.data))
      .catch((e) => { if (e?.response?.status === 403) setForbidden(true); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 1 && users.length === 0) api.get<AdminUser[]>("/admin/users").then((r) => setUsers(r.data));
    if (tab === 2 && templates.length === 0) api.get<Template[]>("/admin/templates").then((r) => setTemplates(r.data));
  }, [tab, users.length, templates.length]);

  async function toggleActive(userId: string, currentValue: boolean) {
    try {
      await api.patch(`/admin/users/${userId}`, { is_active: !currentValue });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !currentValue } : u));
      toast.success("User updated");
    } catch { toast.error("Failed to update user"); }
  }

  async function setUserRole(userId: string, role: string) {
    try {
      await api.patch(`/admin/users/${userId}`, { role });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      toast.success("Role updated");
    } catch { toast.error("Failed to update role. Only super admins can assign admin roles."); }
  }

  async function toggleTemplate(templateId: string, currentActive: boolean) {
    try {
      await api.patch(`/admin/templates/${templateId}`, { is_active: !currentActive });
      setTemplates((prev) => prev.map((t) => t.id === templateId ? { ...t, is_active: !currentActive } : t));
      toast.success(`Template ${!currentActive ? "enabled" : "disabled"}`);
    } catch { toast.error("Failed to update template"); }
  }

  if (forbidden) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 1.5 }}>
        <ShieldRoundedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
        <Typography sx={{ fontWeight: 700 }}>Admin access required</Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>You don&apos;t have permission to view this page.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Admin Panel</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>VaakiL AI நிர்வாகம்</Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Stats" sx={{ fontWeight: 600, textTransform: "none" }} />
        <Tab label="Users" sx={{ fontWeight: 600, textTransform: "none" }} />
        <Tab label="Templates" sx={{ fontWeight: 600, textTransform: "none" }} />
      </Tabs>

      {/* Stats */}
      {tab === 0 && stats && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
            {[
              { label: "Total Users", value: stats.total_users, Icon: PeopleRoundedIcon, color: theme.palette.primary.main },
              { label: "Active Users", value: stats.active_users, Icon: TrendingUpRoundedIcon, color: theme.palette.success.main },
              { label: "Documents Generated", value: stats.total_documents_generated, Icon: DescriptionRoundedIcon, color: theme.palette.warning.main },
              { label: "Paid Subscriptions", value: stats.paid_subscriptions, Icon: CreditCardRoundedIcon, color: "#a855f7" },
            ].map(({ label, value, Icon, color }) => (
              <Paper key={label} elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3 }}>
                <Box sx={{ p: 1.25, bgcolor: alpha(color, 0.1), borderRadius: 2, display: "inline-flex", mb: 2 }}>
                  <Icon sx={{ fontSize: 20, color }} />
                </Box>
                <Typography sx={{ fontSize: 26, fontWeight: 800 }}>{value.toLocaleString()}</Typography>
                <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.25 }}>{label}</Typography>
              </Paper>
            ))}
          </Box>

          {Object.keys(stats.plan_breakdown).length > 0 && (
            <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>Plan Breakdown</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {Object.entries(stats.plan_breakdown).map(([tier, count]) => (
                  <Box key={tier} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Chip label={tier} size="small" color={PLAN_COLOR[tier] ?? "default"}
                      sx={{ textTransform: "capitalize", fontWeight: 700 }} />
                    <Typography sx={{ fontWeight: 700 }}>{count} users</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Users */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                {["Name / Email", "State", "Plan", "Docs", "Active", "Role"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "text.secondary" }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{u.full_name || "(no name)"}</Typography>
                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{u.email}</Typography>
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: 13 }}>{u.state || "—"}</Typography></TableCell>
                  <TableCell>
                    <Chip label={u.plan_tier} size="small" color={PLAN_COLOR[u.plan_tier] ?? "default"}
                      sx={{ textTransform: "capitalize", fontWeight: 700, height: 20, fontSize: 11 }} />
                  </TableCell>
                  <TableCell><Typography sx={{ fontSize: 13 }}>{u.documents_used}</Typography></TableCell>
                  <TableCell>
                    <Switch size="small" checked={u.is_active} onChange={() => void toggleActive(u.id, u.is_active)} color="success" />
                  </TableCell>
                  <TableCell>
                    <Select size="small" value={u.role} onChange={(e) => void setUserRole(u.id, e.target.value)}
                      sx={{ fontSize: 12, minWidth: 120, borderRadius: 1.5 }}>
                      <MenuItem value="advocate">Advocate</MenuItem>
                      <MenuItem value="staff">Staff</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="super_admin">Super Admin</MenuItem>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Templates */}
      {tab === 2 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {templates.map((t) => (
            <Paper key={t.id} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: t.is_active ? "success.main" : "action.disabled" }} />
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{t.name}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{t.slug} · {t.supported_languages.join(", ")}</Typography>
                    {t.is_premium && <Chip label="Premium" size="small" color="warning" sx={{ height: 18, fontSize: 10 }} />}
                  </Box>
                </Box>
              </Box>
              <Switch checked={t.is_active} onChange={() => void toggleTemplate(t.id, t.is_active)} color="success" size="small" />
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
