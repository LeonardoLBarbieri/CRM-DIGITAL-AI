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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full pb-4">
        {KANBAN_COLUMNS.map((columnId) => {
          const columnLeads = leads.filter((l) => l.status === columnId);
          const accent = COLUMN_ACCENTS[columnId] || "from-gray-500/20 to-gray-600/5";
          const dot = COLUMN_DOT[columnId] || "bg-gray-400";

          return (
            <div key={columnId} className="kanban-column-glass p-2 flex flex-col min-h-[250px]">
              {/* Column Header */}
              <div className={`flex items-center justify-between mb-2 px-2 py-1.5 rounded-lg bg-gradient-to-r ${accent}`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot} shadow-sm shrink-0`} />
                  <h3 className="font-semibold text-[11px] text-foreground/90 tracking-tight truncate">{columnId}</h3>
                </div>
                <span className="stat-card-spatial px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0">
                  {columnLeads.length}
                </span>
              </div>

              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto space-y-1.5 min-h-[100px] p-1 rounded-xl transition-all duration-300 ${
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
                            className={`lead-card-glass p-2.5 group cursor-pointer ${
                              snapshot.isDragging ? "dragging" : ""
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <GripVertical size={10} className="text-muted-foreground/40 shrink-0 group-hover:text-primary/50 transition-colors" />
                                <h4 className="font-medium text-[11px] leading-tight truncate group-hover:text-primary transition-colors duration-200">
                                  {lead.name}
                                </h4>
                              </div>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ml-1 shrink-0 border backdrop-blur-sm ${getTemperatureColor(lead.temperature)}`}>
                                {lead.temperature || "Frio"}
                              </span>
                            </div>
                            
                            {/* Phone */}
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground pl-4">
                              <MessageSquare size={10} className={lead.phone ? "text-green-400" : "text-muted-foreground/40"} />
                              <span className="truncate">{lead.phone ? lead.phone : "Sem nº"}</span>
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
