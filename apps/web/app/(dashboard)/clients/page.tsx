"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Skeleton from "@mui/material/Skeleton";
import Avatar from "@mui/material/Avatar";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

type Client = {
  id: string; full_name: string; phone: string | null; email: string | null;
  address: string | null; notes: string | null; created_at: string;
  total_billed: number; total_received: number;
};
type FeeEntry = {
  id: string; amount: number; description: string; entry_date: string;
  is_received: boolean; client_id: string | null; case_id: string | null;
};

const EMPTY_CLIENT = { full_name: "", phone: "", email: "", address: "", notes: "" };
const EMPTY_FEE = { amount: "", description: "", entry_date: new Date().toISOString().slice(0, 10), client_id: "", is_received: false };

export default function ClientsPage() {
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const theme = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [fees, setFees] = useState<FeeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [clientForm, setClientForm] = useState(EMPTY_CLIENT);
  const [feeForm, setFeeForm] = useState(EMPTY_FEE);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  async function loadAll() {
    setIsLoading(true);
    try {
      const [cr, fr] = await Promise.all([
        api.get<Client[]>("/clients"),
        api.get<FeeEntry[]>("/clients/fees/all"),
      ]);
      setClients(cr.data);
      setFees(fr.data);
    } catch { /* empty */ }
    finally { setIsLoading(false); }
  }

  useEffect(() => { void loadAll(); }, []);

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/clients", clientForm);
      toast.success("Client added");
      setClientForm(EMPTY_CLIENT);
      setShowClientForm(false);
      void loadAll();
    } catch { toast.error("Failed to add client"); }
    finally { setSubmitting(false); }
  }

  async function handleAddFee(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/clients/fees", { ...feeForm, amount: Number(feeForm.amount), client_id: feeForm.client_id || null });
      toast.success("Fee entry added");
      setFeeForm(EMPTY_FEE);
      setShowFeeForm(false);
      void loadAll();
    } catch { toast.error("Failed to add fee"); }
    finally { setSubmitting(false); }
  }

  async function handleMarkReceived(feeId: string) {
    try {
      await api.patch(`/clients/fees/${feeId}/mark-received`, {});
      toast.success("Marked as received");
      void loadAll();
    } catch { toast.error("Failed to update"); }
  }

  async function handleDeleteClient(clientId: string) {
    if (!confirm("Delete this client? Fee entries will also be deleted.")) return;
    try {
      await api.delete(`/clients/${clientId}`);
      toast.success("Client deleted");
      void loadAll();
    } catch { toast.error("Failed to delete"); }
  }

  const totalBilled = fees.reduce((s, f) => s + f.amount, 0);
  const totalReceived = fees.filter((f) => f.is_received).reduce((s, f) => s + f.amount, 0);
  const totalPending = totalBilled - totalReceived;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Clients & Fees</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }} className={fontCls}>
            {t("clientsPage", "subtitle")}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" color="success" startIcon={<CurrencyRupeeRoundedIcon />}
            onClick={() => setShowFeeForm(true)} sx={{ borderRadius: 2, fontWeight: 700 }}>
            Add Fee
          </Button>
          <Button variant="contained" startIcon={<AddRoundedIcon />}
            onClick={() => setShowClientForm(true)}
            sx={{ borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg, #4f46e5, #7c3aed)", "&:hover": { background: "linear-gradient(135deg, #4338ca, #6d28d9)" } }}>
            Add Client
          </Button>
        </Box>
      </Box>

      {/* Fee summary cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
        {[
          { label: "Total Billed", native: t("clientsPage", "statTotalBilled"), value: totalBilled, color: "text.primary", bg: "background.paper" },
          { label: "Received", native: t("clientsPage", "statReceived"), value: totalReceived, color: "success.main", bg: alpha(theme.palette.success.main, 0.06) },
          { label: "Pending", native: t("clientsPage", "statPending"), value: totalPending, color: "warning.main", bg: alpha(theme.palette.warning.main, 0.06) },
        ].map(({ label, native, value, color, bg }) => (
          <Paper key={label} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", p: 2.5, bgcolor: bg }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75 }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color }}>
              ₹{value.toLocaleString("en-IN")}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 0.5 }} className={fontCls}>{native}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Clients (${clients.length})`} sx={{ fontWeight: 600, textTransform: "none" }} />
        <Tab label={`Fee Entries (${fees.length})`} sx={{ fontWeight: 600, textTransform: "none" }} />
      </Tabs>

      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={72} sx={{ borderRadius: 2.5 }} />)}
        </Box>
      ) : activeTab === 0 ? (
        clients.length === 0 ? (
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 6, textAlign: "center" }}>
            <PeopleRoundedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography sx={{ fontWeight: 700 }}>No clients yet</Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }} className={fontCls}>{t("clientsPage", "noClients")}</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {clients.map((c) => (
              <Paper key={c.id} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: "divider", p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main", width: 40, height: 40, fontSize: 15, fontWeight: 700 }}>
                  {c.full_name[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{c.full_name}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.25 }}>
                    {c.phone && <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><PhoneRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} /><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{c.phone}</Typography></Box>}
                    {c.email && <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><MailRoundedIcon sx={{ fontSize: 12, color: "text.disabled" }} /><Typography sx={{ fontSize: 12, color: "text.secondary" }}>{c.email}</Typography></Box>}
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>₹{c.total_billed.toLocaleString("en-IN")}</Typography>
                  <Typography sx={{ fontSize: 12, color: "success.main" }}>₹{c.total_received.toLocaleString("en-IN")} received</Typography>
                </Box>
                <Button size="small" color="error" onClick={() => void handleDeleteClient(c.id)}
                  sx={{ minWidth: 0, p: 0.75, borderRadius: 1.5 }}>
                  <DeleteRoundedIcon sx={{ fontSize: 18 }} />
                </Button>
              </Paper>
            ))}
          </Box>
        )
      ) : (
        fees.length === 0 ? (
          <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 6, textAlign: "center" }}>
            <CurrencyRupeeRoundedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography sx={{ fontWeight: 700 }}>No fee entries yet</Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }} className={fontCls}>{t("clientsPage", "noFeeEntries")}</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {fees.map((f) => (
              <Paper key={f.id} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid", borderColor: f.is_received ? alpha(theme.palette.success.main, 0.2) : "divider", p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: f.is_received ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1), flexShrink: 0 }}>
                  <CurrencyRupeeRoundedIcon sx={{ fontSize: 16, color: f.is_received ? "success.main" : "warning.main" }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{f.description}</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>
                    {f.entry_date}{f.client_id && ` · ${clients.find((c) => c.id === f.client_id)?.full_name}`}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 15, flexShrink: 0 }}>₹{f.amount.toLocaleString("en-IN")}</Typography>
                {!f.is_received ? (
                  <Button size="small" color="success" variant="outlined" startIcon={<CheckCircleRoundedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => void handleMarkReceived(f.id)} sx={{ borderRadius: 2, flexShrink: 0, fontSize: 12 }}>
                    Mark received
                  </Button>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                    <CheckCircleRoundedIcon sx={{ fontSize: 14, color: "success.main" }} />
                    <Typography sx={{ fontSize: 12, color: "success.main", fontWeight: 600 }}>Received</Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )
      )}

      {/* Add Client Dialog */}
      <Dialog open={showClientForm} onClose={() => setShowClientForm(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>New Client</DialogTitle>
        <Box component="form" onSubmit={(e: React.FormEvent) => void handleAddClient(e)}>
          <DialogContent sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              {[
                { key: "full_name", label: "Full Name *", placeholder: "Murugan Subramanian", required: true },
                { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
                { key: "email", label: "Email", placeholder: "client@email.com" },
                { key: "address", label: "Address", placeholder: "12, Gandhi Nagar, Chennai" },
              ].map(({ key, label, placeholder, required }) => (
                <Grid size={{ xs: 12, sm: 6 }} key={key}>
                  <TextField fullWidth size="small" label={label} required={required} placeholder={placeholder}
                    value={clientForm[key as keyof typeof clientForm]}
                    onChange={(e) => setClientForm((p) => ({ ...p, [key]: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                </Grid>
              ))}
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Notes" placeholder="Any notes about this client"
                  value={clientForm.notes} onChange={(e) => setClientForm((p) => ({ ...p, notes: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setShowClientForm(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting} sx={{ borderRadius: 2, fontWeight: 700 }}>
              {submitting ? "Adding…" : "Add Client"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Add Fee Dialog */}
      <Dialog open={showFeeForm} onClose={() => setShowFeeForm(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>New Fee Entry</DialogTitle>
        <Box component="form" onSubmit={(e: React.FormEvent) => void handleAddFee(e)}>
          <DialogContent sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Amount (₹) *" type="number" required
                  value={feeForm.amount} onChange={(e) => setFeeForm((p) => ({ ...p, amount: e.target.value }))}
                  slotProps={{ htmlInput: { min: 1 }, input: { sx: { borderRadius: 2 } } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Date *" type="date" required
                  value={feeForm.entry_date} onChange={(e) => setFeeForm((p) => ({ ...p, entry_date: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth size="small" label="Description *" required placeholder="Consultation fee for WP-123/2024"
                  value={feeForm.description} onChange={(e) => setFeeForm((p) => ({ ...p, description: e.target.value }))}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth size="small" label="Client"
                  value={feeForm.client_id} onChange={(e) => setFeeForm((p) => ({ ...p, client_id: e.target.value }))}>
                  <MenuItem value="">— select client —</MenuItem>
                  {clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.full_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={<Checkbox checked={feeForm.is_received} onChange={(e) => setFeeForm((p) => ({ ...p, is_received: e.target.checked }))} />}
                  label={<Typography sx={{ fontSize: 13 }}>Already received</Typography>}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setShowFeeForm(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={submitting} sx={{ borderRadius: 2, fontWeight: 700 }}>
              {submitting ? "Adding…" : "Add Fee"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
