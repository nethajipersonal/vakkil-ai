"use client";

import { useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { useTheme } from "next-themes";
import { lightTheme, darkTheme } from "@/lib/muiTheme";
import { useThemeSettings } from "@/hooks/useThemeSettings";

export default function MuiRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: false }}>
      <MuiThemeBridge>{children}</MuiThemeBridge>
    </AppRouterCacheProvider>
  );
}

function MuiThemeBridge({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const { settings } = useThemeSettings();

  const theme = useMemo(() => {
    const base = resolvedTheme === "dark" ? darkTheme : lightTheme;
    // Apply accent color dynamically
    return base;
  }, [resolvedTheme, settings.accent]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
