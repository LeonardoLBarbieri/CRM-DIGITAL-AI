"use client";
import {
  BrainCircuit, BarChart3, MessageSquare, CalendarDays,
  Megaphone, PenTool, Mic, Video,
  Image as ImageIcon, DollarSign, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TabId = "dashboard" | "crm" | "campanhas" | "tarefas" | "roteiro" | "voz" | "avatar" | "studio" | "financeiro";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const navGroups = [
  {
    label: "Gestão",
    items: [
      { id: "dashboard" as TabId, icon: <BarChart3 size={18} />, label: "Dashboard" },
      { id: "crm" as TabId, icon: <MessageSquare size={18} />, label: "Gestão de Leads" },
      { id: "campanhas" as TabId, icon: <Megaphone size={18} />, label: "Disparos" },
      { id: "tarefas" as TabId, icon: <CalendarDays size={18} />, label: "Minhas Tarefas" },
    ],
  },
  {
    label: "Criação IA",
    items: [
      { id: "roteiro" as TabId, icon: <PenTool size={18} />, label: "Criar Roteiro" },
      { id: "voz" as TabId, icon: <Mic size={18} />, label: "Voz & Áudio" },
      { id: "avatar" as TabId, icon: <Video size={18} />, label: "Gerar Avatar" },
      { id: "studio" as TabId, icon: <ImageIcon size={18} />, label: "Studio 3D" },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { id: "financeiro" as TabId, icon: <DollarSign size={18} />, label: "Gestão Financeira" },
    ],
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-gradient">LB Digital AI</span>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Avatar Imobiliário</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            <div className="space-y-0.5 mb-1">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileOpen(false);
                  }}
                  className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
            LB
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">Leonardo B.</p>
            <p className="text-[11px] text-muted-foreground">Plano Pro</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-60 glass-sidebar hidden md:flex flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-sidebar h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BrainCircuit size={22} className="text-purple-400" />
          <span className="text-sm font-bold text-gradient">LB Digital AI</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 glass-sidebar z-50 md:hidden flex flex-col"
            >
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
