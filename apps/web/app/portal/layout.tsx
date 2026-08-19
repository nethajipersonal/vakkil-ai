import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal — VaakiL AI",
  description: "View your cases and documents",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      {children}
    </div>
  );
}
