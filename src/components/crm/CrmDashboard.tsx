"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, Plus, X, Upload, User, BarChart3,
} from "lucide-react";
import type { Lead } from "@prisma/client";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { ImportLeadsButton } from "@/components/crm/ImportLeadsButton";
import { LeadDetailModal } from "@/components/crm/LeadDetailModal";
import { SectionHeader } from "@/components/ui/SectionHeader";

// ============================================================
// CrmDashboard — self-contained CRM tab
// ============================================================
export function CrmDashboard() {
  // === Leads State ===
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // === New Lead Modal ===
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");

  // === New Board Modal ===
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  // === Dropdown & Board key ===
  const [showNovoDropdown, setShowNovoDropdown] = useState(false);
  const [boardKey, setBoardKey] = useState(0);

  // === CSV Ref ===
  const csvFileRef = useRef<HTMLInputElement>(null);

  // === Polling & Notifications ===
  const prevLeadsCount = useRef<number | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // ────────────────────────────────────────────
  // Fetch leads on mount & polling
  // ────────────────────────────────────────────
  const fetchLeads = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoadingLeads(true);
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        const fetchedLeads = Array.isArray(data) ? data : (data.leads || []);
        
        if (prevLeadsCount.current !== null && fetchedLeads.length > prevLeadsCount.current) {
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000);
          try {
            const audio = new Audio("https://cdn.freesound.org/previews/515/515652_11308343-lq.mp3");
            audio.play().catch(() => {});
          } catch(e) {}
        }
        
        prevLeadsCount.current = fetchedLeads.length;
        setLeads(fetchedLeads);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isPolling) setLoadingLeads(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(false);
    const interval = setInterval(() => fetchLeads(true), 10000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  // ────────────────────────────────────────────
  // CRUD Handlers
  // ────────────────────────────────────────────
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName) {
      alert("Por favor, preencha o nome do Lead antes de clicar em Novo.");
      return;
    }
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLeadName, phone: newLeadPhone }),
      });
      if (res.ok) {
        setNewLeadName("");
        setNewLeadPhone("");
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads((prev) => prev.filter((lead) => lead.id !== id));
        setSelectedLead(null);
      } else {
        alert("Erro ao excluir lead.");
      }
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro inesperado.");
    }
  };

  const handleSaveLead = async (updatedLead: any) => {
    try {
      const res = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLead),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchLeads();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const moveLead = async (id: string, newStatus: string) => {
    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    try {
      await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (e) {
      console.error(e);
      fetchLeads(); // Revert on error
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n");
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [name, phone] = line.split(",");
        if (name) {
          try {
            await fetch("/api/leads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: name.trim(), phone: phone ? phone.trim() : "" }),
            });
          } catch (err) {
            console.error("Erro importando CSV", err);
          }
        }
      }
      fetchLeads();
      alert("Importação de CSV concluída!");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col relative">
      {/* Toast Notification */}
      {showNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
          <MessageSquare size={18} className="animate-pulse" />
          <span className="font-semibold text-sm">Novo lead recebido!</span>
        </div>
      )}

      <SectionHeader
        icon={<MessageSquare size={22} />}
        title="Gestão de Leads (CRM)"
        subtitle="Organize seus clientes e contatos do WhatsApp."
        color="indigo"
        actions={
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => csvFileRef.current?.click()} className="text-sm font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              <Upload size={16} /> Importar CSV
            </button>
            <input type="file" ref={csvFileRef} accept=".csv" className="hidden" onChange={handleCSVUpload} />
            
            {/* Botão Novo com Dropdown */}
            <div className="relative">
              <button 
                type="button" 
                onClick={() => setShowNovoDropdown(!showNovoDropdown)}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
              >
                <Plus size={16} /> Novo
              </button>
              {showNovoDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNovoDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden w-48 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => { setShowNovoDropdown(false); setShowNewLeadModal(true); }}
                      className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-purple-500/10 flex items-center gap-3 transition-colors"
                    >
                      <User size={16} className="text-purple-400" /> Novo Lead
                    </button>
                    <div className="border-t border-border/50" />
                    <button 
                      onClick={() => { setShowNovoDropdown(false); setShowNewBoardModal(true); }}
                      className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-cyan-500/10 flex items-center gap-3 transition-colors"
                    >
                      <BarChart3 size={16} className="text-cyan-400" /> Novo Quadro
                    </button>
                    <div className="border-t border-border/50" />
                    <ImportLeadsButton onSuccess={() => fetchLeads()} onClose={() => setShowNovoDropdown(false)} />
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <KanbanBoard 
          key={boardKey}
          leads={leads} 
          onLeadMove={moveLead} 
          onLeadClick={(lead) => setSelectedLead(lead)} 
        />
      </div>

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
        />
      )}

      {/* Modal: Novo Lead */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border/50 bg-secondary/30">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="text-purple-500" size={18} /> Novo Lead
              </h3>
              <button onClick={() => setShowNewLeadModal(false)} className="text-muted-foreground hover:text-white p-1 rounded-md hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(e) => { handleAddLead(e); if (newLeadName) setShowNewLeadModal(false); }} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nome do Lead *</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: João Silva"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="input-field text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                <input
                  type="tel"
                  placeholder="(31) 99999-9999"
                  value={newLeadPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    let formatted = digits;
                    if (digits.length > 2) formatted = `(${digits.slice(0,2)}) ${digits.slice(2)}`;
                    if (digits.length > 7) formatted = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
                    setNewLeadPhone(formatted);
                  }}
                  className="input-field text-sm"
                />
              </div>
              <div className="pt-3 flex justify-end gap-3 border-t border-border/50">
                <button type="button" onClick={() => setShowNewLeadModal(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="btn-primary py-2 px-5 text-sm flex items-center gap-2">
                  <Plus size={14} /> Criar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Quadro */}
      {showNewBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border/50 bg-secondary/30">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="text-cyan-500" size={18} /> Novo Quadro
              </h3>
              <button onClick={() => setShowNewBoardModal(false)} className="text-muted-foreground hover:text-white p-1 rounded-md hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nome do Quadro *</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Ex: Pré-Qualificação, Documentação..."
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newBoardName.trim()) {
                      const stored = JSON.parse(localStorage.getItem("lb-kanban-columns") || "null");
                      const cols = stored || ["Lead Novo","Primeiro Contato","Qualificação","Em Negociação","Visita Agendada","Visita Realizada","Proposta Enviada","Aguardando Resposta","Reserva Efetuada","Contrato Assinado","Venda Concluída","Lead Perdido"];
                      if (cols.includes(newBoardName.trim())) { alert("Já existe um quadro com esse nome!"); return; }
                      cols.push(newBoardName.trim());
                      localStorage.setItem("lb-kanban-columns", JSON.stringify(cols));
                      setNewBoardName("");
                      setShowNewBoardModal(false);
                      setBoardKey(k => k + 1);
                    }
                  }}
                  className="input-field text-sm"
                />
              </div>
              <div className="pt-3 flex justify-end gap-3 border-t border-border/50">
                <button type="button" onClick={() => setShowNewBoardModal(false)} className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-xl transition-colors">Cancelar</button>
                <button
                  type="button"
                  onClick={() => {
                    if (!newBoardName.trim()) return;
                    const stored = JSON.parse(localStorage.getItem("lb-kanban-columns") || "null");
                    const cols = stored || ["Lead Novo","Primeiro Contato","Qualificação","Em Negociação","Visita Agendada","Visita Realizada","Proposta Enviada","Aguardando Resposta","Reserva Efetuada","Contrato Assinado","Venda Concluída","Lead Perdido"];
                    if (cols.includes(newBoardName.trim())) { alert("Já existe um quadro com esse nome!"); return; }
                    cols.push(newBoardName.trim());
                    localStorage.setItem("lb-kanban-columns", JSON.stringify(cols));
                    setNewBoardName("");
                    setShowNewBoardModal(false);
                    setBoardKey(k => k + 1);
                  }}
                  className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                >
                  <Plus size={14} /> Criar Quadro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
