import type { Metadata, Viewport } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppNav";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pantry & Plate",
  description: "Household pantry, recipes, meal planning, and grocery budgeting.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pantry & Plate",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6efdd",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${karla.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
