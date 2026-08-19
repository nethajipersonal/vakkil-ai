"use client";

import { useTheme as useNextTheme } from "next-themes";

import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { alpha, useTheme } from "@mui/material/styles";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import SettingsBrightnessRoundedIcon from "@mui/icons-material/SettingsBrightnessRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";

import { useThemeSettings, ACCENT_COLORS, FONT_FAMILIES } from "@/hooks/useThemeSettings";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALE_LABELS } from "@/lib/i18n/translations";

interface Props { open: boolean; onClose: () => void; }

const MODES = [
  { value: "light",  label: "Light",  modeKey: "modeLight",  Icon: LightModeRoundedIcon          },
  { value: "dark",   label: "Dark",   modeKey: "modeDark",   Icon: DarkModeRoundedIcon            },
  { value: "system", label: "System", modeKey: "modeSystem", Icon: SettingsBrightnessRoundedIcon  },
] as const;

const ACCENT_LIST = Object.values(ACCENT_COLORS);
const FONT_LIST   = Object.values(FONT_FAMILIES);

export default function ThemeSettingsModal({ open, onClose }: Props) {
  const theme = useTheme();
  const { theme: nextTheme, setTheme } = useNextTheme();
  const { settings, updateAccent, updateFont } = useThemeSettings();
  const { locale, t } = useLanguage();
  const fontCls = LOCALE_LABELS[locale].font;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100%", sm: 420 },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* ── Header ── */}
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1.5, px: 3, py: 2.5,
        borderBottom: "1px solid", borderColor: "divider", flexShrink: 0,
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2.5,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
        }}>
          <PaletteRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Appearance</Typography>
          <Typography className={fontCls} sx={{ fontSize: 11, color: "text.secondary" }}>{t("themeModal", "title")}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Scrollable content ── */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2.5 }}>
        {/* ── Mode ── */}
        <SectionHeader label="Color Mode" labelNative={t("themeModal", "colorMode")} fontCls={fontCls} Icon={SettingsBrightnessRoundedIcon} />
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 0.5 }}>
          {MODES.map(({ value, label, modeKey, Icon }) => {
            const active = nextTheme === value;
            return (
              <Box
                key={value}
                onClick={() => setTheme(value)}
                sx={{
                  p: 2, borderRadius: 3, cursor: "pointer", textAlign: "center",
                  border: `2px solid ${active ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.08)}`,
                  bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                  transition: "all 0.2s",
                  "&:hover": { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.05) },
                  position: "relative",
                }}
              >
                {active && (
                  <Chip
                    icon={<CheckRoundedIcon sx={{ fontSize: "10px !important" }} />}
                    label="Active"
                    size="small"
                    color="primary"
                    sx={{ position: "absolute", top: 6, right: 6, height: 16, fontSize: 9, fontWeight: 700 }}
                  />
                )}
                <Icon sx={{ fontSize: 26, color: active ? theme.palette.primary.main : "text.secondary", mb: 0.75 }} />
                <Typography sx={{ fontWeight: active ? 700 : 500, fontSize: 13 }}>{label}</Typography>
                <Typography className={fontCls} sx={{ fontSize: 9, color: "text.disabled" }}>{t("themeModal", modeKey)}</Typography>
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* ── Accent Colors ── */}
        <SectionHeader label="Accent Color" labelNative={t("themeModal", "accentColor")} fontCls={fontCls} Icon={PaletteRoundedIcon} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 0.5 }}>
          {ACCENT_LIST.map((color) => {
            const selected = settings.accent === color.name.toLowerCase();
            return (
              <Tooltip key={color.name} title={color.name} arrow>
                <Box
                  onClick={() => updateAccent(color.name.toLowerCase() as Parameters<typeof updateAccent>[0])}
                  sx={{
                    width: 44, height: 44, borderRadius: 3, cursor: "pointer",
                    bgcolor: color.hex,
                    border: `3px solid ${selected ? "#fff" : "transparent"}`,
                    outline: `2px solid ${selected ? color.hex : "transparent"}`,
                    transition: "all 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: selected ? `0 4px 16px ${alpha(color.hex, 0.55)}` : "none",
                    "&:hover": { transform: "scale(1.12)", boxShadow: `0 4px 14px ${alpha(color.hex, 0.4)}` },
                  }}
                >
                  {selected && <CheckRoundedIcon sx={{ color: "#fff", fontSize: 18, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* ── Font Family ── */}
        <SectionHeader label="Font Family" labelNative={t("themeModal", "fontFamily")} fontCls={fontCls} Icon={TextFieldsRoundedIcon} />
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mb: 0.5 }}>
          {FONT_LIST.map((font) => {
            const key = Object.keys(FONT_FAMILIES).find((k) => (FONT_FAMILIES as Record<string, { name: string }>)[k].name === font.name);
            const selected = settings.font === key;
            return (
              <Box
                key={font.name}
                onClick={() => key && updateFont(key as Parameters<typeof updateFont>[0])}
                sx={{
                  p: 2, borderRadius: 3, cursor: "pointer",
                  border: `2px solid ${selected ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.08)}`,
                  bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : "transparent",
                  transition: "all 0.2s",
                  "&:hover": { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.04) },
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.2, mb: 0.25, color: selected ? "primary.main" : "text.primary" }}>
                  Aa
                </Typography>
                <Typography sx={{ fontWeight: selected ? 700 : 500, fontSize: 12, color: selected ? "primary.main" : "text.primary" }}>
                  {font.name}
                </Typography>
                <Typography sx={{ fontSize: 10, color: "text.disabled", display: "block", mt: 0.25 }}>
                  The quick brown fox
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{
        display: "flex", alignItems: "center", gap: 2, px: 3, py: 2,
        borderTop: "1px solid", borderColor: "divider", flexShrink: 0,
      }}>
        <Typography className={fontCls} sx={{ fontSize: 11, color: "text.disabled", flex: 1 }}>
          {t("themeModal", "footerNote")}
        </Typography>
        <Button onClick={onClose} variant="contained">{t("common", "done")}</Button>
      </Box>
    </Drawer>
  );
}

function SectionHeader({ label, labelNative, fontCls, Icon }: { label: string; labelNative: string; fontCls: string; Icon: React.ElementType }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      <Icon sx={{ fontSize: 16, color: "text.secondary" }} />
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{label}</Typography>
        <Typography className={fontCls} sx={{ fontSize: 9, color: "text.disabled" }}>{labelNative}</Typography>
      </Box>
    </Box>
  );
}
