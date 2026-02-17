import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ApiProvider } from "@/lib/api/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Build With Hardware (BWH)",
  title: {
    default: "Build With Hardware (BWH)",
    template: "%s · BWH",
  },
  description:
    "A beginner-friendly educational drone kit ecosystem: learn, fly, build, and share.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BWH",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "Build With Hardware (BWH)",
    title: "Build With Hardware (BWH)",
    description:
      "A beginner-friendly educational drone kit ecosystem: learn, fly, build, and share.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-slate-950 text-slate-50 antialiased`}
      >
        <ApiProvider>
          <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">{children}</div>
        </ApiProvider>
        <BottomNav />
      </body>
    </html>
  );
}
