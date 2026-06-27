"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MessageSquare, GripVertical, Plus, Trash2, X, Maximize2, Pencil, Check } from "lucide-react";
import type { Lead } from "@prisma/client";

const DEFAULT_COLUMNS = [
  "Lead Novo", "Primeiro Contato", "Qualificação", "Em Negociação",
  "Visita Agendada", "Visita Realizada", "Proposta Enviada", "Aguardando Resposta",
  "Reserva Efetuada", "Contrato Assinado", "Venda Concluída", "Lead Perdido",
];

const ACCENT_COLORS = [
  "from-blue-500/20 to-blue-600/5", "from-indigo-500/20 to-indigo-600/5",
  "from-violet-500/20 to-violet-600/5", "from-purple-500/20 to-purple-600/5",
  "from-amber-500/20 to-amber-600/5", "from-orange-500/20 to-orange-600/5",
  "from-pink-500/20 to-pink-600/5", "from-cyan-500/20 to-cyan-600/5",
  "from-teal-500/20 to-teal-600/5", "from-emerald-500/20 to-emerald-600/5",
  "from-green-500/20 to-green-600/5", "from-red-500/20 to-red-600/5",
];

const DOT_COLORS = [
  "bg-blue-400", "bg-indigo-400", "bg-violet-400", "bg-purple-400",
  "bg-amber-400", "bg-orange-400", "bg-pink-400", "bg-cyan-400",
  "bg-teal-400", "bg-emerald-400", "bg-green-400", "bg-red-400",
  "bg-sky-400", "bg-lime-400", "bg-fuchsia-400", "bg-rose-400",
];

const STORAGE_KEY = "lb-kanban-columns";

// Formata telefone como (XX) XXXXX-XXXX
function formatPhone(value: string | null): string {
  if (!value) return "Sem nº";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return value;
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}

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
    // Update columns
    const newCols = columns.map(c => c === oldName ? newName : c);
    saveColumns(newCols);
    // Move leads from old status to new status
    leads.filter(l => l.status === oldName).forEach(l => onLeadMove(l.id, newName));
    setEditingColumnName(null);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onLeadMove(draggableId, destination.droppableId);
  };

  const getTemperatureColor = (temp: string | null) => {
    if (!temp) return "bg-gray-500/15 text-gray-400 border-gray-500/20";
    const t = temp.toLowerCase();
    if (t === "frio") return "bg-blue-500/15 text-blue-300 border-blue-500/20";
    if (t === "morno") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
    if (t === "quente") return "bg-orange-500/15 text-orange-300 border-orange-500/20";
    if (t === "prioritário" || t === "prioritario") return "bg-red-500/15 text-red-300 border-red-500/20";
    return "bg-gray-500/15 text-gray-400 border-gray-500/20";
  };

  const renderLeadCard = (lead: Lead, index: number, isModal = false) => (
    <Draggable key={lead.id} draggableId={lead.id} index={index} isDragDisabled={isModal}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onLeadClick(lead)}
          className={`lead-card-glass p-2.5 group cursor-pointer ${snapshot.isDragging ? "dragging" : ""}`}
        >
          <div className="flex justify-between items-start mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {!isModal && <GripVertical size={10} className="text-muted-foreground/40 shrink-0 group-hover:text-primary/50 transition-colors" />}
              <h4 className="font-medium text-[11px] leading-tight truncate group-hover:text-primary transition-colors duration-200">
                {lead.name}
              </h4>
            </div>
            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ml-1 shrink-0 border backdrop-blur-sm ${getTemperatureColor(lead.temperature)}`}>
              {lead.temperature || "Frio"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground pl-4">
            <MessageSquare size={10} className={lead.phone ? "text-green-400" : "text-muted-foreground/40"} />
            <span className="truncate">{formatPhone(lead.phone)}</span>
          </div>
        </div>
      )}
    </Draggable>
  );

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-4">
          {columns.map((columnId, colIndex) => {
            const columnLeads = leads.filter((l) => l.status === columnId);
            const accent = ACCENT_COLORS[colIndex % ACCENT_COLORS.length];
            const dot = DOT_COLORS[colIndex % DOT_COLORS.length];

            return (
              <div key={columnId} className="kanban-column-glass p-2 flex flex-col" style={{ height: '320px' }}>
                {/* Column Header */}
                <div className={`flex items-center justify-between mb-2 px-2 py-1.5 rounded-lg bg-gradient-to-r ${accent}`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot} shadow-sm shrink-0`} />
                    {editingColumnName === columnId ? (
                      <input
                        autoFocus
                        value={editColumnValue}
                        onChange={(e) => setEditColumnValue(e.target.value)}
                        onBlur={() => handleRenameColumn(columnId)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRenameColumn(columnId); if (e.key === "Escape") setEditingColumnName(null); }}
                        className="bg-transparent border-b border-white/30 text-[11px] font-semibold outline-none w-full text-foreground/90"
                      />
                    ) : (
                      <h3 className="font-semibold text-[11px] text-foreground/90 tracking-tight truncate">{columnId}</h3>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <span className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{columnLeads.length}</span>
                    <button
                      onClick={() => { setEditingColumnName(columnId); setEditColumnValue(columnId); }}
                      className="text-muted-foreground/50 hover:text-purple-400 transition-all p-0.5 rounded"
                      title="Renomear quadro"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      onClick={() => setExpandedColumn(columnId)}
                      className="text-muted-foreground/50 hover:text-cyan-400 transition-all p-0.5 rounded"
                      title="Expandir quadro"
                    >
                      <Maximize2 size={10} />
                    </button>
                    <button
                      onClick={() => handleDeleteColumn(columnId)}
                      className="text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all p-0.5 rounded-md"
                      title="Excluir quadro"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>

                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto space-y-1.5 p-1 rounded-xl transition-all duration-300 ${
                        snapshot.isDraggingOver ? "bg-primary/5 ring-1 ring-primary/20 ring-dashed" : ""
                      }`}
                    >
                      {columnLeads.map((lead, index) => renderLeadCard(lead, index))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}

          {/* Botão + Novo Quadro */}
          {!showNewColumn ? (
            <button
              onClick={() => setShowNewColumn(true)}
              className="border-2 border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-purple-400 hover:border-purple-500/30 transition-all group"
              style={{ height: '320px' }}
            >
              <Plus size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Novo Quadro</span>
            </button>
          ) : (
            <div className="border-2 border-purple-500/30 rounded-xl p-3 flex flex-col gap-3 bg-purple-500/5" style={{ height: '320px' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-400">Novo Quadro</span>
                <button onClick={() => { setShowNewColumn(false); setNewColumnName(""); }} className="text-muted-foreground hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                autoFocus
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddColumn(); }}
                placeholder="Nome do quadro..."
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button
                onClick={handleAddColumn}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Criar Quadro
              </button>
            </div>
          )}
        </div>
      </DragDropContext>

      {/* Modal: Quadro Expandido */}
      {expandedColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setExpandedColumn(null)}>
          <div className="bg-popover border border-border shadow-2xl rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-border/50 bg-secondary/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${DOT_COLORS[columns.indexOf(expandedColumn) % DOT_COLORS.length]} shadow-sm`} />
                <h3 className="text-lg font-bold">{expandedColumn}</h3>
                <span className="text-sm text-muted-foreground ml-2">
                  ({leads.filter(l => l.status === expandedColumn).length} leads)
                </span>
              </div>
              <button onClick={() => setExpandedColumn(null)} className="text-muted-foreground hover:text-white p-1.5 rounded-md hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId={expandedColumn}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 overflow-y-auto p-4 space-y-2"
                  >
                    {leads.filter(l => l.status === expandedColumn).length === 0 ? (
                      <div className="text-center text-muted-foreground py-12 text-sm">Nenhum lead neste quadro.</div>
                    ) : (
                      leads.filter(l => l.status === expandedColumn).map((lead, index) => (
                        <div
                          key={lead.id}
                          onClick={() => { setExpandedColumn(null); onLeadClick(lead); }}
                          className="lead-card-glass p-4 cursor-pointer hover:border-purple-500/30 transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <MessageSquare size={12} className={lead.phone ? "text-green-400" : "text-muted-foreground/40"} />
                                <span>{formatPhone(lead.phone)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border backdrop-blur-sm ${getTemperatureColor(lead.temperature)}`}>
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
