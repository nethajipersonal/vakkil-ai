"use client";

import { useState } from "react";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";
import { alpha, useTheme } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import { api } from "@/lib/api";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";

interface Props { open: boolean; onClose: () => void; }

function getStrength(pw: string): { score: number; label: string; color: "error" | "warning" | "info" | "success" } {
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Weak",   color: "error"   as const },
    { label: "Fair",   color: "warning" as const },
    { label: "Good",   color: "info"    as const },
    { label: "Strong", color: "success" as const },
    { label: "Strong", color: "success" as const },
  ];
  return { score, ...levels[score] };
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const theme = useTheme();
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const [current, setCurrent]     = useState("");
  const [newPwd, setNewPwd]       = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  const strength   = getStrength(newPwd);
  const matches    = newPwd.length > 0 && newPwd === confirm;
  const mismatches = confirm.length > 0 && newPwd !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirm) { toast.error("Passwords don't match"); return; }
    if (newPwd.length < 6)  { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await api.post("/auth/change-password", { current_password: current || undefined, new_password: newPwd });
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => { setSuccess(false); setCurrent(""); setNewPwd(""); setConfirm(""); onClose(); }, 1800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to update password";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setCurrent(""); setNewPwd(""); setConfirm(""); setSuccess(false);
    onClose();
  }

  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <IconButton size="small" onClick={onToggle} edge="end" sx={{ color: "text.secondary" }}>
      {show ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
    </IconButton>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2.5,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
        }}>
          <LockRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Change Password</Typography>
          <Typography className={fontCls} sx={{ fontSize: 11, color: "text.secondary" }}>{t("changePasswordModal", "title")}</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} disabled={loading} sx={{ color: "text.secondary" }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Success state */}
      {success ? (
        <DialogContent>
          <Box sx={{ py: 5, textAlign: "center" }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 56, color: "success.main", mb: 2 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 0.5 }}>Password Updated!</Typography>
            <Typography className={fontCls} sx={{ fontSize: 13, color: "text.secondary" }}>{t("changePasswordModal", "successSubtitle")}</Typography>
          </Box>
        </DialogContent>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Current Password (optional)"
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Leave blank if set via OTP"
              fullWidth
              slotProps={{ input: { endAdornment: <EyeToggle show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} /> } }}
            />

            <Box>
              <TextField
                label="New Password"
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                fullWidth
                slotProps={{ input: { endAdornment: <EyeToggle show={showNew} onToggle={() => setShowNew(!showNew)} /> } }}
              />
              {newPwd.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <LinearProgress
                        key={i}
                        variant="determinate"
                        value={strength.score > i ? 100 : 0}
                        color={strength.color}
                        sx={{ flex: 1, height: 3, borderRadius: 99, bgcolor: alpha(theme.palette.text.primary, 0.08) }}
                      />
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: 11, color: `${strength.color}.main`, fontWeight: 600 }}>{strength.label}</Typography>
                </Box>
              )}
            </Box>

            <TextField
              label="Confirm New Password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              fullWidth
              error={mismatches}
              helperText={mismatches ? "Passwords don't match" : matches ? "✓ Passwords match" : ""}
              slotProps={{
                input: { endAdornment: <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} /> },
                formHelperText: { sx: { color: matches ? "success.main" : undefined } },
              }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Button onClick={handleClose} disabled={loading} sx={{ color: "text.secondary" }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !newPwd || !confirm || mismatches}
            >
              {loading ? "Updating…" : "Update Password"}
            </Button>
          </DialogActions>
        </Box>
      )}
    </Dialog>
  );
}
