import type { Metadata } from "next";
import "./globals.css";

const shareImage = {
  url: "/share-card.png",
  width: 1200,
  height: 630,
  alt: "Intindi. Understand code in Taglish.",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://intindi-hackathon.vercel.app"),
  title: "Intindi — Taglish Tech Tutor",
  description:
    "Paste code or an English doc excerpt and get it explained in Taglish. On-device AI when possible, cloud AI when needed.",
  openGraph: {
    images: [shareImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [shareImage],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--intindi-paper)] text-[var(--intindi-ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
