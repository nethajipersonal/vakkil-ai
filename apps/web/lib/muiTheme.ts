import { createTheme, alpha } from "@mui/material/styles";

const baseShape = { borderRadius: 12 };

const baseShadows = [
  "none",
  "0 1px 2px rgba(0,0,0,0.07)",
  "0 2px 8px rgba(0,0,0,0.08)",
  "0 4px 16px rgba(0,0,0,0.10)",
  "0 8px 24px rgba(0,0,0,0.12)",
  "0 12px 32px rgba(0,0,0,0.14)",
  "0 16px 40px rgba(0,0,0,0.16)",
  "0 20px 48px rgba(0,0,0,0.18)",
  "0 24px 56px rgba(0,0,0,0.20)",
  "0 28px 64px rgba(0,0,0,0.22)",
  "0 32px 72px rgba(0,0,0,0.24)",
  "0 36px 80px rgba(0,0,0,0.26)",
  "0 40px 88px rgba(0,0,0,0.28)",
  "0 44px 96px rgba(0,0,0,0.30)",
  "0 48px 104px rgba(0,0,0,0.32)",
  "0 52px 112px rgba(0,0,0,0.34)",
  "0 56px 120px rgba(0,0,0,0.36)",
  "0 60px 128px rgba(0,0,0,0.38)",
  "0 64px 136px rgba(0,0,0,0.40)",
  "0 68px 144px rgba(0,0,0,0.42)",
  "0 72px 152px rgba(0,0,0,0.44)",
  "0 76px 160px rgba(0,0,0,0.46)",
  "0 80px 168px rgba(0,0,0,0.48)",
  "0 84px 176px rgba(0,0,0,0.50)",
  "0 88px 184px rgba(0,0,0,0.52)",
] as const;

function buildTheme(dark: boolean) {
  const primary = { main: "#6366f1", light: "#818cf8", dark: "#4f46e5", contrastText: "#fff" };

  return createTheme({
    palette: {
      mode: dark ? "dark" : "light",
      primary,
      secondary: { main: "#7c3aed", light: "#a78bfa", dark: "#5b21b6", contrastText: "#fff" },
      error:   { main: "#f43f5e" },
      warning: { main: "#f59e0b" },
      success: { main: "#10b981" },
      info:    { main: "#0ea5e9" },
      background: dark
        ? { default: "#030712", paper: "#0d1117" }
        : { default: "#f8fafc", paper: "#ffffff" },
      text: dark
        ? { primary: "#f1f5f9", secondary: "#94a3b8", disabled: "#475569" }
        : { primary: "#0f172a", secondary: "#475569", disabled: "#94a3b8" },
      divider: dark ? "rgba(148,163,184,0.08)" : "rgba(15,23,42,0.08)",
    },

    shape: baseShape,

    typography: {
      fontFamily: "Inter, system-ui, sans-serif",
      h1: { fontWeight: 800, letterSpacing: "-0.025em" },
      h2: { fontWeight: 700, letterSpacing: "-0.02em" },
      h3: { fontWeight: 700, letterSpacing: "-0.015em" },
      h4: { fontWeight: 600, letterSpacing: "-0.01em" },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500, letterSpacing: "-0.005em" },
      subtitle2: { fontWeight: 500 },
      body1: { lineHeight: 1.6 },
      body2: { lineHeight: 1.55 },
      button: { fontWeight: 600, letterSpacing: "0.01em", textTransform: "none" },
      caption: { letterSpacing: "0.02em" },
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    shadows: [...baseShadows] as any,

    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Tamil:wght@400;600;700&display=swap');
          html { -webkit-font-smoothing: antialiased; }
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${dark ? "rgba(148,163,184,0.2)" : "rgba(15,23,42,0.15)"}; border-radius: 99px; }
          .font-tamil { font-family: 'Noto Sans Tamil', sans-serif; }
        `,
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          },
          contained: {
            "&.MuiButton-colorPrimary": {
              background: `linear-gradient(135deg, ${primary.main}, ${primary.dark})`,
              "&:hover": { background: `linear-gradient(135deg, ${primary.light}, ${primary.main})` },
            },
          },
        },
        defaultProps: { disableElevation: true },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow: dark
              ? "0 0 0 1px rgba(148,163,184,0.06), 0 4px 24px rgba(0,0,0,0.3)"
              : "0 0 0 1px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.06)",
            borderRadius: 16,
            transition: "box-shadow 0.2s, transform 0.2s",
            "&:hover": {
              boxShadow: dark
                ? "0 0 0 1px rgba(99,102,241,0.2), 0 8px 32px rgba(0,0,0,0.4)"
                : "0 0 0 1px rgba(99,102,241,0.15), 0 8px 24px rgba(15,23,42,0.1)",
            },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
          rounded: { borderRadius: 16 },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: primary.main,
                borderWidth: 1.5,
                boxShadow: `0 0 0 3px ${alpha(primary.main, 0.12)}`,
              },
            },
          },
        },
        defaultProps: { size: "small" },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 500 },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginBottom: 2,
            "&.Mui-selected": {
              background: `linear-gradient(135deg, ${primary.main}, ${primary.dark})`,
              color: "#fff",
              boxShadow: `0 4px 16px ${alpha(primary.main, 0.4)}`,
              "&:hover": { background: `linear-gradient(135deg, ${primary.light}, ${primary.main})` },
              "& .MuiListItemIcon-root": { color: "#fff" },
              "& .MuiListItemText-primary": { color: "#fff", fontWeight: 600 },
              "& .MuiListItemText-secondary": { color: "rgba(255,255,255,0.65)" },
            },
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 20, backgroundImage: "none" },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            background: dark ? "#1e293b" : "#0f172a",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          },
          arrow: { color: dark ? "#1e293b" : "#0f172a" },
        },
        defaultProps: { arrow: true },
      },

      MuiAvatar: {
        styleOverrides: {
          root: {
            background: `linear-gradient(135deg, ${primary.main}, ${primary.dark})`,
            fontWeight: 700,
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },

      MuiDivider: {
        styleOverrides: {
          root: { borderColor: dark ? "rgba(148,163,184,0.08)" : "rgba(15,23,42,0.08)" },
        },
      },

      MuiBadge: {
        styleOverrides: {
          badge: { fontWeight: 700, fontSize: 10 },
        },
      },
    },
  });
}

export const lightTheme = buildTheme(false);
export const darkTheme  = buildTheme(true);
