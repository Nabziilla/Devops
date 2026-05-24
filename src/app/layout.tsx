import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hapana · Compliance",
  description:
    "Compliance, risk, and security posture management. Privacy Act, NDB, SOCI, APRA CPS 234, Essential Eight, CDR.",
  icons: {
    icon: "/hapana-logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <head>
        {/* Tell Dark Reader and similar extensions to skip the page — we ship a native dark theme. */}
        <meta name="darkreader-lock" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="font-sans min-h-screen">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Topbar />
              <main className="flex-1 p-6 overflow-x-auto bg-background">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
