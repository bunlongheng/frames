import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Frames — Device Mockup Generator",
  description: "Place screenshots into realistic Apple device frames — iPhone, iPad, MacBook, iMac, Studio Display",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full" style={{ background: "#0e0e10", margin: 0 }}>{children}</body>
    </html>
  );
}
