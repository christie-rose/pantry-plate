import type { Metadata, Viewport } from "next";
import { Elsie_Swash_Caps, Karla, Kaushan_Script } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppNav";

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

const elsie = Elsie_Swash_Caps({
  variable: "--font-elsie",
  weight: "400",
  subsets: ["latin"],
});

const kaushan = Kaushan_Script({
  variable: "--font-kaushan",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plenty of Thyme",
  description: "Recipes, weekly meal planning, and grocery lists.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    // Short enough to fit under the home-screen icon.
    title: "Thyme",
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
      className={`${karla.variable} ${kaushan.variable} ${elsie.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
