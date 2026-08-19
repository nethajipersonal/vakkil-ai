"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/i18n/translations";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { alpha, useTheme } from "@mui/material/styles";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        title="Language / மொழி"
        data-testid="language-switcher"
        size="small"
        sx={{ gap: 0.75, borderRadius: 2, px: 1, color: "text.secondary", "&:hover": { color: "text.primary", bgcolor: "action.hover" } }}
      >
        <LanguageRoundedIcon sx={{ fontSize: 18 }} />
        <Typography sx={{ fontSize: 12, fontWeight: 600, display: { xs: "none", sm: "inline" } }}
          className={LOCALE_LABELS[locale].font}>
          {LOCALE_LABELS[locale].native}
        </Typography>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 8,
            sx: { borderRadius: 2.5, minWidth: 180, mt: 0.75, border: "1px solid", borderColor: "divider" },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>Language / மொழி</Typography>
        </Box>
        <Divider />
        <Box sx={{ p: 0.75 }}>
          {SUPPORTED_LOCALES.map((code) => {
            const active = code === locale;
            const { label, native, font } = LOCALE_LABELS[code];
            return (
              <MenuItem
                key={code}
                data-lang={code}
                onClick={() => { setLocale(code); setAnchorEl(null); }}
                sx={{
                  borderRadius: 1.5, py: 1.25,
                  bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : "transparent",
                  "&:hover": { bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : "action.hover" },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: active ? "primary.main" : "text.primary" }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.25 }} className={font}>
                    {native}
                  </Typography>
                </Box>
                {active && <CheckRoundedIcon sx={{ fontSize: 16, color: "primary.main", ml: 1, flexShrink: 0 }} />}
              </MenuItem>
            );
          })}
        </Box>
      </Menu>
    </>
  );
}
