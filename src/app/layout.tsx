import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import { SidebarProvider } from "@/components/SidebarContext";

export const metadata: Metadata = {
  title: "nanaAI — API Key AI, Akses Instan",
  description:
    "Isi saldo, dapatkan API key, langsung bangun. Bayar sesuai pemakaian. GPT-4o, Claude, DeepSeek, Gemini — satu platform.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.png",
  },
};

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased relative">
        <div className="bg-glow" aria-hidden="true" />
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <Navbar />
              <main className="relative z-10">{children}</main>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
