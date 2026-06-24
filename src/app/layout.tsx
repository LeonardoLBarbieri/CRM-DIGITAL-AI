import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leonardo Barbieri Digital AI | Avatar Imobiliário com IA",
  description: "Plataforma completa de IA para corretores imobiliários: avatar digital 4K, clonagem de voz, CRM com WhatsApp, geração de roteiros e gestão financeira.",
  keywords: ["avatar digital", "IA imobiliária", "clonagem de voz", "CRM imobiliário", "HeyGen", "ElevenLabs"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
