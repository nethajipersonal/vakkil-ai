"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import { alpha, useTheme } from "@mui/material/styles";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";

const PLANS = [
  {
    tier: "free",
    name: "Free",
    nameTa: "இலவசம்",
    price: 0,
    priceSuffix: "/மாதம்",
    Icon: StarRoundedIcon,
    color: "#64748b",
    features: [
      "5 documents / month",
      "Legal Notice, Rent Agreement, Consumer Complaint",
      "Case Diary (unlimited cases)",
      "Client Directory",
      "Email hearing reminders",
    ],
  },
  {
    tier: "standard",
    name: "Standard",
    nameTa: "நிலையான",
    price: 299,
    priceSuffix: "/மாதம்",
    Icon: BoltRoundedIcon,
    color: "#4f46e5",
    popular: true,
    features: [
      "50 documents / month",
      "All templates including premium",
      "WhatsApp share",
      "Priority email support",
      "Bail Application, Stay Petition",
    ],
  },
  {
    tier: "professional",
    name: "Professional",
    nameTa: "தொழில்முறை",
    price: 999,
    priceSuffix: "/மாதம்",
    Icon: WorkspacePremiumRoundedIcon,
    color: "#d97706",
    features: [
      "Unlimited documents",
      "All templates",
      "Bulk document generation",
      "Dedicated support",
      "Early access to new features",
    ],
  },
];

declare global {
  interface Window {
    Razorpay: new (options: object) => { open(): void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;
  const theme = useTheme();
  const { subscription, isLoading, mutate } = useSubscription();
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(tier: string) {
    setError(null);
    setPaying(tier);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Failed to load Razorpay. Check your internet connection.");

      const { data: order } = await api.post<{
        order_id: string; amount: number; currency: string; plan_name: string;
      }>("/billing/create-order", { plan_tier: tier });

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: subscription?.razorpay_key_id ?? "",
          amount: order.amount,
          currency: order.currency,
          name: "VaakiL AI",
          description: `${order.plan_name} Plan`,
          order_id: order.order_id,
          theme: { color: "#4F46E5" },
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            try {
              await api.post("/billing/verify-payment", { ...response, plan_tier: tier });
              await mutate();
              resolve();
            } catch {
              reject(new Error("Payment verification failed. Please contact support."));
            }
          },
          modal: { ondismiss: () => reject(new Error("__dismissed__")) },
        });
        rzp.open();
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== "__dismissed__") setError(err.message);
    } finally {
      setPaying(null);
    }
  }

  const currentTier = subscription?.plan_tier ?? "free";
  const docsUsed = subscription?.documents_used ?? 0;
  const docLimit = subscription?.document_limit ?? 5;
  const usagePct = docLimit === 0 ? 0 : Math.min((docsUsed / docLimit) * 100, 100);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 900, mx: "auto" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Billing & Plans</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }} className={fontCls}>
          {t("billingPage", "subtitle")}
        </Typography>
      </Box>

      {/* Current plan + usage */}
      {!isLoading && subscription && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", p: 3, mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Box sx={{ p: 0.75, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1.5, display: "flex" }}>
                  <PaymentsRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
                </Box>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Current Plan
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 18, mt: 0.5 }}>{subscription.plan_name}</Typography>
            </Box>
            <Chip label={subscription.status} color="primary" size="small"
              sx={{ textTransform: "uppercase", fontWeight: 700, fontSize: 11 }} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>Documents this month</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {docsUsed} / {docLimit === 0 ? "∞" : docLimit}
            </Typography>
          </Box>
          {docLimit > 0 && (
            <LinearProgress variant="determinate" value={usagePct}
              color={usagePct > 80 ? "error" : usagePct > 60 ? "warning" : "primary"}
              sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.divider, 0.5) }} />
          )}
          {subscription.period_end && (
            <Typography sx={{ fontSize: 12, color: "text.disabled", mt: 1.5 }}>
              Renews on {new Date(subscription.period_end).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </Typography>
          )}
        </Paper>
      )}

      {error && (
        <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "error.light", bgcolor: alpha(theme.palette.error.main, 0.05), p: 2, mb: 3 }}>
          <Typography sx={{ fontSize: 13, color: "error.main" }}>{error}</Typography>
        </Paper>
      )}

      {/* Plan cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.tier;
          const isUpgrade = PLANS.findIndex((p) => p.tier === currentTier) < PLANS.findIndex((p) => p.tier === plan.tier);
          const PlanIcon = plan.Icon;

          return (
            <Paper key={plan.tier} elevation={0} sx={{
              borderRadius: 3,
              border: "2px solid",
              borderColor: plan.popular ? "primary.main" : isCurrent ? "divider" : "divider",
              boxShadow: plan.popular ? `0 0 0 1px ${theme.palette.primary.main}, 0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}` : "none",
              p: 3, display: "flex", flexDirection: "column", position: "relative",
            }}>
              {plan.popular && (
                <Box sx={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)" }}>
                  <Chip label="Most Popular" color="primary" size="small"
                    sx={{ fontWeight: 700, fontSize: 11, height: 24, px: 0.5 }} />
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: alpha(plan.color, 0.12), display: "flex" }}>
                  <PlanIcon sx={{ fontSize: 20, color: plan.color }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{plan.name}</Typography>
              </Box>

              <Box sx={{ mb: 2.5 }}>
                {plan.price === 0 ? (
                  <Typography sx={{ fontSize: 28, fontWeight: 800 }}>Free</Typography>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                    <Typography sx={{ fontSize: 28, fontWeight: 800 }}>₹{plan.price}</Typography>
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }} className={fontCls}>{plan.priceSuffix}</Typography>
                  </Box>
                )}
              </Box>

              <Box component="ul" sx={{ p: 0, m: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 1.25, mb: 3, flex: 1 }}>
                {plan.features.map((feature) => (
                  <Box key={feature} component="li" sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <CheckRoundedIcon sx={{ fontSize: 16, color: "primary.main", mt: 0.25, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{feature}</Typography>
                  </Box>
                ))}
              </Box>

              {isCurrent ? (
                <Paper elevation={0} sx={{ py: 1.25, borderRadius: 2, border: "2px solid", borderColor: "divider", textAlign: "center" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.disabled" }}>Current Plan</Typography>
                </Paper>
              ) : plan.price === 0 ? (
                <Paper elevation={0} sx={{ py: 1.25, borderRadius: 2, border: "2px solid", borderColor: "divider", textAlign: "center", cursor: "not-allowed" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.disabled" }}>Downgrade</Typography>
                </Paper>
              ) : (
                <Button variant="contained" fullWidth disabled={paying !== null || !isUpgrade}
                  onClick={() => void handleUpgrade(plan.tier)}
                  startIcon={paying === plan.tier ? <CircularProgress size={14} color="inherit" /> : undefined}
                  sx={{
                    py: 1.25, borderRadius: 2, fontWeight: 700,
                    background: plan.popular ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : undefined,
                    "&:hover": { background: plan.popular ? "linear-gradient(135deg, #4338ca, #6d28d9)" : undefined },
                  }}>
                  {paying === plan.tier ? "Processing..." : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </Paper>
          );
        })}
      </Box>

      <Typography sx={{ mt: 4, textAlign: "center", fontSize: 12, color: "text.disabled" }}>
        Payments are processed securely by Razorpay. Prices are in INR and inclusive of GST.{" "}
        <Box component="a" href="mailto:support@vakkil.ai" sx={{ color: "primary.main", "&:hover": { textDecoration: "underline" } }}>
          support@vakkil.ai
        </Box>{" "}
        for billing queries.
      </Typography>
    </Box>
  );
}
