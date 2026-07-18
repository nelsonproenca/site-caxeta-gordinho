import type { Metadata } from "next";
import { Barlow_Condensed, Titillium_Web, JetBrains_Mono } from "next/font/google";
import { AuthErrorWatcher } from "@/components/auth-error-watcher";
import "./globals.css";

const displayFont = Barlow_Condensed({
  variable: "--next-font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["italic", "normal"],
});

const bodyFont = Titillium_Web({
  variable: "--next-font-body",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
});

const monoFont = JetBrains_Mono({
  variable: "--next-font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Caxeta Gordinho",
  description: "Gestão de lives, ranking, Caxetão e campeonatos de Caxeta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AuthErrorWatcher />
        {children}
      </body>
    </html>
  );
}
