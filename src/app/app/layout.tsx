import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Painel | LB Digital AI",
  description: "Painel de controle completo para gerenciamento de leads, criação de conteúdo IA e gestão financeira.",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:h-screen relative">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 pt-18 md:pt-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
