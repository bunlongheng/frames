import type { Metadata, Viewport } from "next";
import "./globals.css";
import SwRegister from "./sw-register";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://frames-bheng.vercel.app";
const title = "Frames - Device Mockup Generator";
const description =
  "Place screenshots into realistic Apple device frames - iPhone, iPad, MacBook, iMac, Studio Display.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Frames",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Frames",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Frames",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0e10",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full" style={{ background: "#0e0e10", margin: 0 }}>
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
