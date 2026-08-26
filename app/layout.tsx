import type { Metadata } from "next";
import "./globals.css";
import SwRegister from "./sw-register";

export const metadata: Metadata = {
  title: "Frames — Device Mockup Generator",
  description: "Place screenshots into realistic Apple device frames — iPhone, iPad, MacBook, iMac, Studio Display",
  manifest: "/manifest.webmanifest",
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
