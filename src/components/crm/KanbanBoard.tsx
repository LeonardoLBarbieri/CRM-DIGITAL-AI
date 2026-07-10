"use client";

import React, { useState, useEffect, memo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MessageSquare, GripVertical, Plus, Trash2, X, Maximize2, Pencil } from "lucide-react";
import type { Lead } from "@prisma/client";

const DEFAULT_COLUMNS = [
  "Lead Novo", "Primeiro Contato", "Qualificação", "Em Negociação",
  "Visita Agendada", "Visita Realizada", "Proposta Enviada", "Aguardando Resposta",
  "Reserva Efetuada", "Contrato Assinado", "Venda Concluída", "Lead Perdido",
];

const DOT_COLORS = [
  "bg-[#0070F3]", "bg-[#7928CA]", "bg-[#F5A623]", "bg-[#F81CE5]",
  "bg-[#7928CA]", "bg-[#FF0080]", "bg-[#00C969]", "bg-[#E5484D]",
  "bg-[#0070F3]", "bg-[#F5A623]", "bg-[#00C969]", "bg-[#E5484D]",
];

const STORAGE_KEY = "lb-kanban-columns";

function formatPhone(value: string | null): string {
  if (!value) return "Sem nº";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return value;
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}

interface LeadCardProps {
  lead: Lead;
  index: number;
  isModal?: boolean;
  onClick: (lead: Lead) => void;
}

const getTemperatureColor = (temp: string | null) => {
  if (!temp) return "bg-accent text-muted-foreground border-border";
  const t = temp.toLowerCase();
  if (t === "frio") return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (t === "morno") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  if (t === "quente") return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  if (t === "prioritário" || t === "prioritario") return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-accent text-muted-foreground border-border";
};

// Memoized LeadCard to prevent unnecessary re-renders during drag and drop
const LeadCard = memo(({ lead, index, isModal = false, onClick }: LeadCardProps) => {
  return (
    <Draggable draggableId={lead.id} index={index} isDragDisabled={isModal}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(lead)}
          className={`bg-card border border-border p-2.5 rounded-lg group cursor-pointer transition-colors ${
            snapshot.isDragging ? "shadow-md ring-1 ring-primary/50" : "hover:border-[#444]"
          }`}
        >
          <div className="flex justify-between items-start mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {!isModal && <GripVertical size={12} className="text-muted-foreground opacity-30 shrink-0 group-hover:opacity-100 transition-opacity" />}
              <h4 className="font-medium text-xs leading-tight truncate text-foreground">
                {lead.name}
              </h4>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-medium ml-1 shrink-0 border ${getTemperatureColor(lead.temperature)}`}>
              {lead.temperature || "Frio"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pl-5">
            <MessageSquare size={10} className={lead.phone ? "text-success" : "text-muted-foreground opacity-50"} />
            <span className="truncate">{formatPhone(lead.phone)}</span>
          </div>
        </div>
      )}
    </Draggable>
  );
});

LeadCard.displayName = "LeadCard";

interface KanbanBoardProps {
  leads: Lead[];
  onLeadMove: (leadId: string, newStatus: string) => void;
  onLeadClick: (lead: Lead) => void;
}

export function KanbanBoard({ leads, onLeadMove, onLeadClick }: KanbanBoardProps) {
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [showNewColumn, setShowNewColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState<string | null>(null);
  const [editColumnValue, setEditColumnValue] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setColumns(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const saveColumns = (cols: string[]) => {
    setColumns(cols);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cols)); } catch { /* ignore */ }
  };

  const handleAddColumn = () => {
    const name = newColumnName.trim();
    if (!name) return;
    if (columns.includes(name)) { alert("Já existe um quadro com esse nome!"); return; }
    saveColumns([...columns, name]);
    setNewColumnName("");
    setShowNewColumn(false);
  };

  const handleDeleteColumn = (columnId: string) => {
    const columnLeads = leads.filter((l) => l.status === columnId);
    if (columnLeads.length > 0) {
      alert(`Não é possível excluir "${columnId}" pois possui ${columnLeads.length} lead(s). Mova-os primeiro.`);
      return;
    }
    if (!confirm(`Excluir o quadro "${columnId}"?`)) return;
    saveColumns(columns.filter((c) => c !== columnId));
  };

  const handleRenameColumn = (oldName: string) => {
    const newName = editColumnValue.trim();
    if (!newName || newName === oldName) { setEditingColumnName(null); return; }
    if (columns.includes(newName)) { alert("Já existe um quadro com esse nome!"); return; }
    const newCols = columns.map(c => c === oldName ? newName : c);
    saveColumns(newCols);
    leads.filter(l => l.status === oldName).forEach(l => onLeadMove(l.id, newName));
    setEditingColumnName(null);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onLeadMove(draggableId, destination.droppableId);
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-4">
          {columns.map((columnId, colIndex) => {
            const columnLeads = leads.filter((l) => l.status === columnId);
            const dot = DOT_COLORS[colIndex % DOT_COLORS.length];

            return (
              <div key={columnId} className="bg-secondary border border-border rounded-xl p-2 flex flex-col" style={{ height: '380px' }}>
                <div className="flex items-center justify-between mb-2 px-1 py-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                    {editingColumnName === columnId ? (
                      <input
                        autoFocus
                        value={editColumnValue}
                        onChange={(e) => setEditColumnValue(e.target.value)}
                        onBlur={() => handleRenameColumn(columnId)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRenameColumn(columnId); if (e.key === "Escape") setEditingColumnName(null); }}
                        className="bg-background border border-border rounded px-1.5 py-0.5 text-xs font-medium outline-none w-full text-foreground"
                      />
                    ) : (
                      <h3 className="font-semibold text-xs text-foreground tracking-tight truncate">{columnId}</h3>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-1.5 text-[10px] font-medium text-muted-foreground">{columnLeads.length}</span>
                    <button onClick={() => { setEditingColumnName(columnId); setEditColumnValue(columnId); }} className="text-muted-foreground hover:text-foreground transition-all p-0.5" title="Renomear">
                      <Pencil size={10} />
                    </button>
                    <button onClick={() => setExpandedColumn(columnId)} className="text-muted-foreground hover:text-foreground transition-all p-0.5" title="Expandir">
                      <Maximize2 size={10} />
                    </button>
                    <button onClick={() => handleDeleteColumn(columnId)} className="text-muted-foreground hover:text-destructive transition-all p-0.5" title="Excluir">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>

                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto space-y-2 p-1 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? "bg-accent ring-1 ring-border" : ""
                      }`}
                    >
                      {columnLeads.map((lead, index) => (
                        <LeadCard key={lead.id} lead={lead} index={index} onClick={onLeadClick} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}

          {!showNewColumn ? (
            <button
              onClick={() => setShowNewColumn(true)}
              className="border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all"
              style={{ height: '380px' }}
            >
              <Plus size={24} />
              <span className="text-sm font-medium">Novo Quadro</span>
            </button>
          ) : (
            <div className="border border-border rounded-xl p-3 flex flex-col gap-3 bg-secondary" style={{ height: '380px' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-foreground">Novo Quadro</span>
                <button onClick={() => { setShowNewColumn(false); setNewColumnName(""); }} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <input
                type="text"
                autoFocus
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddColumn(); }}
                placeholder="Nome da coluna..."
                className="input-field"
              />
              <button onClick={handleAddColumn} className="btn-primary w-full">
                Criar
              </button>
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Modal: Quadro Expandido */}
      {expandedColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setExpandedColumn(null)}>
          <div className="bg-popover border border-border shadow-lg rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-border bg-secondary shrink-0">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${DOT_COLORS[columns.indexOf(expandedColumn) % DOT_COLORS.length]}`} />
                <h3 className="text-lg font-bold">{expandedColumn}</h3>
                <span className="text-sm text-muted-foreground ml-2">({leads.filter(l => l.status === expandedColumn).length} leads)</span>
              </div>
              <button onClick={() => setExpandedColumn(null)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                <X size={20} />
              </button>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId={expandedColumn}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 overflow-y-auto p-4 space-y-2">
                    {leads.filter(l => l.status === expandedColumn).length === 0 ? (
                      <div className="text-center text-muted-foreground py-12 text-sm">Nenhum lead neste quadro.</div>
                    ) : (
                      leads.filter(l => l.status === expandedColumn).map((lead, index) => (
                        <div
                          key={lead.id}
                          onClick={() => { setExpandedColumn(null); onLeadClick(lead); }}
                          className="bg-card border border-border p-4 rounded-lg cursor-pointer hover:border-muted-foreground transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <MessageSquare size={12} className={lead.phone ? "text-success" : "text-muted-foreground opacity-50"} />
                                <span>{formatPhone(lead.phone)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-sm font-medium border ${getTemperatureColor(lead.temperature)}`}>
                              {lead.temperature || "Frio"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      )}
    </>
  );
}
