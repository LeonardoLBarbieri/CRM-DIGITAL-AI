"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MessageSquare, DollarSign, User, GripVertical } from "lucide-react";
import type { Lead } from "@prisma/client";

export const KANBAN_COLUMNS = [
  "Lead Novo",
  "Primeiro Contato",
  "Qualificação",
  "Em Negociação",
  "Visita Agendada",
  "Visita Realizada",
  "Proposta Enviada",
  "Aguardando Resposta",
  "Reserva Efetuada",
  "Contrato Assinado",
  "Venda Concluída",
  "Lead Perdido",
];

const COLUMN_ACCENTS: Record<string, string> = {
  "Lead Novo": "from-blue-500/20 to-blue-600/5",
  "Primeiro Contato": "from-indigo-500/20 to-indigo-600/5",
  "Qualificação": "from-violet-500/20 to-violet-600/5",
  "Em Negociação": "from-purple-500/20 to-purple-600/5",
  "Visita Agendada": "from-amber-500/20 to-amber-600/5",
  "Visita Realizada": "from-orange-500/20 to-orange-600/5",
  "Proposta Enviada": "from-pink-500/20 to-pink-600/5",
  "Aguardando Resposta": "from-cyan-500/20 to-cyan-600/5",
  "Reserva Efetuada": "from-teal-500/20 to-teal-600/5",
  "Contrato Assinado": "from-emerald-500/20 to-emerald-600/5",
  "Venda Concluída": "from-green-500/20 to-green-600/5",
  "Lead Perdido": "from-red-500/20 to-red-600/5",
};

const COLUMN_DOT: Record<string, string> = {
  "Lead Novo": "bg-blue-400",
  "Primeiro Contato": "bg-indigo-400",
  "Qualificação": "bg-violet-400",
  "Em Negociação": "bg-purple-400",
  "Visita Agendada": "bg-amber-400",
  "Visita Realizada": "bg-orange-400",
  "Proposta Enviada": "bg-pink-400",
  "Aguardando Resposta": "bg-cyan-400",
  "Reserva Efetuada": "bg-teal-400",
  "Contrato Assinado": "bg-emerald-400",
  "Venda Concluída": "bg-green-400",
  "Lead Perdido": "bg-red-400",
};

interface KanbanBoardProps {
  leads: Lead[];
  onLeadMove: (leadId: string, newStatus: string) => void;
  onLeadClick: (lead: Lead) => void;
}

export function KanbanBoard({ leads, onLeadMove, onLeadClick }: KanbanBoardProps) {
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

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

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-5 h-full min-w-max pb-4">
        {KANBAN_COLUMNS.map((columnId) => {
          const columnLeads = leads.filter((l) => l.status === columnId);
          const accent = COLUMN_ACCENTS[columnId] || "from-gray-500/20 to-gray-600/5";
          const dot = COLUMN_DOT[columnId] || "bg-gray-400";

          return (
            <div key={columnId} className="w-80 kanban-column-glass p-3.5 flex flex-col h-full shrink-0">
              {/* Column Header */}
              <div className={`flex items-center justify-between mb-4 px-2 py-2 rounded-xl bg-gradient-to-r ${accent}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${dot} shadow-sm`} />
                  <h3 className="font-semibold text-sm text-foreground/90 tracking-tight">{columnId}</h3>
                </div>
                <span className="stat-card-spatial px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {columnLeads.length}
                </span>
              </div>

              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto space-y-3 min-h-[150px] p-1.5 rounded-2xl transition-all duration-300 ${
                      snapshot.isDraggingOver
                        ? "bg-primary/5 ring-1 ring-primary/20 ring-dashed"
                        : ""
                    }`}
                  >
                    {columnLeads.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onLeadClick(lead)}
                            className={`lead-card-glass p-4 group cursor-pointer ${
                              snapshot.isDragging ? "dragging" : ""
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-2.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <GripVertical size={14} className="text-muted-foreground/40 shrink-0 group-hover:text-primary/50 transition-colors" />
                                <h4 className="font-medium text-sm leading-tight truncate group-hover:text-primary transition-colors duration-200">
                                  {lead.name}
                                </h4>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 border backdrop-blur-sm ${getTemperatureColor(lead.temperature)}`}>
                                {lead.temperature || "Frio"}
                              </span>
                            </div>
                            
                            {/* Phone */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 pl-6">
                              <MessageSquare size={12} className={lead.phone ? "text-green-400" : "text-muted-foreground/40"} />
                              <span className="truncate">{lead.phone ? lead.phone : "Sem número"}</span>
                            </div>

                            {/* Tags */}
                            <div className="flex gap-2 flex-wrap text-[10px] text-muted-foreground pl-6">
                              {lead.budget && (
                                <span className="flex items-center gap-1 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] px-2 py-0.5 rounded-lg">
                                  <DollarSign size={10} className="text-green-400" /> {lead.budget}
                                </span>
                              )}
                              {lead.propertyType && (
                                <span className="flex items-center gap-1 bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] px-2 py-0.5 rounded-lg">
                                  <User size={10} className="text-blue-400" /> {lead.propertyType}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
