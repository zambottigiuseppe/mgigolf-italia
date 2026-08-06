import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Registrazione Garanzia — MGI Golf Italia",
  description:
    "Registra la garanzia ufficiale del tuo carrello MGI. Assistenza e ricambi originali gestiti direttamente in Italia da Vertical Solution, partner ufficiale MGI per l'Italia.",
  metadataBase: new URL("https://mgigolfitalia.it"),
  openGraph: {
    title: "Registrazione Garanzia — MGI Golf Italia",
    description:
      "Attiva la garanzia ufficiale del tuo carrello MGI. Assistenza e ricambi originali in Italia.",
    url: "https://mgigolfitalia.it",
    siteName: "MGI Golf Italia",
    locale: "it_IT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
