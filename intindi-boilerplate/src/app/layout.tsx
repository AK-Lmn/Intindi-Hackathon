import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intindi — Taglish Tech Tutor",
  description:
    "Paste code or an English doc excerpt and get it explained in Taglish. On-device AI when possible, cloud AI when needed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
