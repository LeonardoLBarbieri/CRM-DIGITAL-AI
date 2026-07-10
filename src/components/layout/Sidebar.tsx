"use client";
import {
  BrainCircuit, BarChart3, MessageSquare, CalendarDays,
  Megaphone, PenTool, Mic, Video,
  Image as ImageIcon, DollarSign, Menu, X, Home, Building2, Sparkles, Settings

} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  bgActive: string;
}

const navGroups = [
  {
    label: "Gestão",
    allowedRoles: ["GERENTE"],
    items: [
      { 
        id: "/app", 
        icon: <BarChart3 size={18} />, 
        label: "Dashboard", 
        color: "text-blue-500", 
        bgActive: "bg-blue-50 text-blue-600 border-l-4 border-blue-500 rounded-l-none" 
      },
      { 
        id: "/app/campanhas", 
        icon: <Megaphone size={18} />, 
        label: "Disparos", 
        color: "text-orange-500", 
        bgActive: "bg-orange-50 text-orange-600 border-l-4 border-orange-500 rounded-l-none" 
      },
      { 
        id: "/app/financeiro", 
        icon: <DollarSign size={18} />, 
        label: "Gestão Financeira", 
        color: "text-emerald-500", 
        bgActive: "bg-emerald-50 text-emerald-600 border-l-4 border-emerald-500 rounded-l-none" 
      },
      { 
        id: "/app/integracoes", 
        icon: <Settings size={18} />, 
        label: "Integrações (API)", 
        color: "text-purple-500", 
        bgActive: "bg-purple-50 text-purple-600 border-l-4 border-purple-500 rounded-l-none" 
      },
    ],
  },
  {
    label: "Meu Trabalho",
    allowedRoles: ["GERENTE", "CORRETOR"],
    items: [
      { 
        id: "/app/crm", 
        icon: <MessageSquare size={18} />, 
        label: "Meus Leads", 
        color: "text-indigo-500", 
        bgActive: "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500 rounded-l-none" 
      },
      { 
        id: "/app/planner", 
        icon: <CalendarDays size={18} />, 
        label: "Planner & Agenda", 
        color: "text-rose-500", 
        bgActive: "bg-rose-50 text-rose-600 border-l-4 border-rose-500 rounded-l-none" 
      },
      { 
        id: "/app/properties", 
        icon: <Building2 size={18} />, 
        label: "Empreendimentos", 
        color: "text-teal-500", 
        bgActive: "bg-teal-50 text-teal-600 border-l-4 border-teal-500 rounded-l-none" 
      },
    ],
  },
  {
    label: "Criação IA",
    allowedRoles: ["GERENTE", "CORRETOR"],
    items: [
      { 
        id: "/app/instagram", 
        icon: <Sparkles size={18} />, 
        label: "Ideias Instagram", 
        color: "text-purple-500", 
        bgActive: "bg-purple-50 text-purple-600 border-l-4 border-purple-500 rounded-l-none" 
      },
      { 
        id: "/app/roteiro", 
        icon: <PenTool size={18} />, 
        label: "Criar Roteiro", 
        color: "text-pink-500", 
        bgActive: "bg-pink-50 text-pink-600 border-l-4 border-pink-500 rounded-l-none" 
      },
      { 
        id: "/app/voz", 
        icon: <Mic size={18} />, 
        label: "Voz & Áudio", 
        color: "text-cyan-500", 
        bgActive: "bg-cyan-50 text-cyan-600 border-l-4 border-cyan-500 rounded-l-none" 
      },
      { 
        id: "/app/avatar", 
        icon: <Video size={18} />, 
        label: "Gerar Avatar", 
        color: "text-indigo-500", 
        bgActive: "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500 rounded-l-none" 
      },
      { 
        id: "/app/studio", 
        icon: <ImageIcon size={18} />, 
        label: "Studio 3D", 
        color: "text-fuchsia-500", 
        bgActive: "bg-fuchsia-50 text-fuchsia-600 border-l-4 border-fuchsia-500 rounded-l-none" 
      },
    ],
  },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const userRole = "GERENTE";
  const userName = "Leonardo B.";

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <BrainCircuit size={20} className="text-primary-foreground" />
          </div>
          <div>
            <span className="text-base font-semibold text-foreground">LB Digital AI</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Avatar Imobiliário</p>
          </div>
        </div>
        <Link
          href="/"
          className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-black/[0.03] cursor-pointer"
        >
          <Home size={14} />
          Voltar ao Site
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-3">
        {navGroups
          .filter(g => g.allowedRoles.includes(userRole))
          .map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item: NavItem) => {
                const isActive = pathname === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.id}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      isActive 
                        ? `${item.bgActive} font-semibold shadow-sm` 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className={isActive ? item.color : "text-muted-foreground"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold text-sm border border-border">
            LB
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-[11px] text-muted-foreground">{userRole}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-60 bg-card border-r border-border hidden md:flex flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BrainCircuit size={22} className="text-foreground" />
          <span className="text-sm font-bold">LB Digital AI</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-card border-r border-border z-50 md:hidden flex flex-col"
            >
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
