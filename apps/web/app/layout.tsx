import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import MuiRegistry from "@/components/MuiRegistry";
import "./globals.css";

export const metadata: Metadata = {
  title: "VaakiL AI — வாக்கீல் AI",
  description: "Advocate's Daily OS — Tamil legal document generation & case management",
  keywords: ["legal", "advocate", "Tamil", "lawyer", "document", "court"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VaakiL AI",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-180x180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <LanguageProvider>
            <MuiRegistry>
              {children}
              <Toaster richColors position="top-right" toastOptions={{ style: { borderRadius: 12 } }} />
            </MuiRegistry>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
