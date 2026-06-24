import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel | LB Digital AI",
  description: "Painel de controle completo para gerenciamento de leads, criação de conteúdo IA e gestão financeira.",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
