"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { alpha, useTheme } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import MessageRoundedIcon from "@mui/icons-material/MessageRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

interface WhatsAppStatus {
  configured: boolean;
  sandbox_number: string;
  is_sandbox: boolean;
  join_code: string | null;
  webhook_url: string;
  instructions: string[];
  templates_available: string[];
}

const TEMPLATE_NAMES: Record<string, string> = {
  "1": "Legal Notice", "2": "Bail Application", "3": "Affidavit",
  "4": "Vakalatnama", "5": "Stay Petition", "6": "Power of Attorney",
  "7": "Reply Notice", "8": "Demand Notice", "9": "Petition",
};

function Step({ num, title, desc }: { num: string; title: string; desc: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Box sx={{ flexShrink: 0, width: 28, height: 28, bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
        {num}
      </Box>
      <Box sx={{ mt: 0.25 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{title}</Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>{desc}</Typography>
      </Box>
    </Box>
  );
}

export default function WhatsAppPage() {
  const theme = useTheme();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void fetchStatus(); }, []);

  async function fetchStatus() {
    try {
      const res = await api.get<WhatsAppStatus>("/whatsapp/status");
      setStatus(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  const isActive = status?.configured;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 720, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>WhatsApp Bot</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
          Generate legal documents from WhatsApp — no app needed
        </Typography>
      </Box>

      {/* Status banner */}
      {!loading && status && (
        <Paper elevation={0} sx={{
          borderRadius: 3, border: "1px solid",
          borderColor: isActive ? alpha(theme.palette.success.main, 0.4) : alpha(theme.palette.warning.main, 0.4),
          bgcolor: isActive ? alpha(theme.palette.success.main, 0.06) : alpha(theme.palette.warning.main, 0.06),
          p: 2.5, mb: 3, display: "flex", alignItems: "flex-start", gap: 1.5,
        }}>
          {isActive
            ? <CheckCircleRoundedIcon sx={{ color: "success.main", mt: 0.25 }} />
            : <WarningAmberRoundedIcon sx={{ color: "warning.main", mt: 0.25 }} />}
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: isActive ? "success.dark" : "warning.dark" }}>
              {isActive ? "WhatsApp Bot is Active" : "Setup Required"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>
              {isActive
                ? "Send a WhatsApp message to start generating documents."
                : "Add Twilio credentials to your .env file to activate the bot."}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* How to use */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <MessageRoundedIcon sx={{ fontSize: 20, color: "primary.main" }} />
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>How to Use</Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {status?.is_sandbox && (
            <Step num="1" title="Join the Sandbox" desc={
              <>Send <strong>join {status.join_code ?? "your-code"}</strong> to the Twilio sandbox number on WhatsApp.</>
            } />
          )}
          <Step num={status?.is_sandbox ? "2" : "1"} title="Start the Bot"
            desc={<>Message the number below with <strong>hi</strong> or <strong>menu</strong> to see the template options.</>} />
          <Step num={status?.is_sandbox ? "3" : "2"} title="Pick a Template"
            desc="Reply with a number (1–9) to choose a document. The bot will ask for the required details." />
          <Step num={status?.is_sandbox ? "4" : "3"} title="Receive Your Document"
            desc="Claude generates the document — it appears in your Documents library too." />
        </Box>
      </Paper>

      {/* Sandbox number */}
      {status && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <PhoneRoundedIcon sx={{ fontSize: 20, color: "success.main" }} />
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>WhatsApp Number</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Paper elevation={0} sx={{ flex: 1, p: 1.5, bgcolor: "action.hover", borderRadius: 2, fontFamily: "monospace", fontSize: 14 }}>
              {status.sandbox_number}
            </Paper>
            <IconButton onClick={() => copy(status.sandbox_number)} size="small" sx={{ color: "text.secondary", "&:hover": { color: "primary.main" } }}>
              <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Button variant="contained" color="success" size="small"
              href={`https://wa.me/${(status.sandbox_number ?? "").replace(/\D/g, "")}`}
              target="_blank" rel="noreferrer"
              endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              Open
            </Button>
          </Box>
          {status.is_sandbox && status.join_code && (
            <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 1.5 }}>
              Join code: <strong>join {status.join_code}</strong>
            </Typography>
          )}
          {!status.is_sandbox && (
            <Typography sx={{ fontSize: 12, color: "success.main", fontWeight: 600, mt: 1.5 }}>
              Approved business number — no join code required
            </Typography>
          )}
        </Paper>
      )}

      {/* Available templates */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2 }}>Available Document Templates</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 1 }}>
          {Object.entries(TEMPLATE_NAMES).map(([num, name]) => (
            <Box key={num} sx={{
              display: "flex", alignItems: "center", gap: 1,
              bgcolor: "action.hover", borderRadius: 2, px: 1.5, py: 1.25,
            }}>
              <Box sx={{ width: 22, height: 22, bgcolor: alpha(theme.palette.primary.main, 0.12), color: "primary.main", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {num}
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{name}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Quick commands */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2 }}>Quick Commands</Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {[
            { cmd: "hi / hello / menu", desc: "Show the template menu" },
            { cmd: "cancel / reset", desc: "Cancel current draft and start over" },
            { cmd: "status", desc: "Check current document progress" },
            { cmd: "உதவி / help", desc: "Get help (Tamil & English)" },
          ].map(({ cmd, desc }) => (
            <Box key={cmd} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box component="code" sx={{ fontSize: 12, fontFamily: "monospace", bgcolor: alpha(theme.palette.primary.main, 0.08), color: "primary.main", px: 1.25, py: 0.625, borderRadius: 1, whiteSpace: "nowrap" }}>
                {cmd}
              </Box>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{desc}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Env setup */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "action.hover", p: 3 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 0.75 }}>Environment Setup</Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1.5 }}>
          Add to <Box component="code" sx={{ bgcolor: "action.selected", px: 0.75, borderRadius: 0.75, fontSize: 11 }}>.env</Box>:
        </Typography>
        <Box component="pre" sx={{ bgcolor: "#1e2937", color: "#4ade80", p: 2, borderRadius: 2, fontSize: 12, overflowX: "auto", m: 0 }}>
{`TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886`}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
          Register at{" "}
          <Box component="a" href="https://www.twilio.com/try-twilio" target="_blank" rel="noreferrer"
            sx={{ color: "primary.main", "&:hover": { textDecoration: "underline" } }}>
            twilio.com
          </Box>
          {" "}→ WhatsApp Sandbox. Set webhook URL in Twilio console to:{" "}
          <Box component="code" sx={{ bgcolor: "action.selected", px: 0.75, borderRadius: 0.75, fontSize: 11 }}>
            https://yourdomain.com/api/v1/whatsapp/webhook
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
}
