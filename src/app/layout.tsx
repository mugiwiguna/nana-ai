import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
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
    icon: "/logo-cat.svg",
  },
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              <Navbar />
              {children}
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
