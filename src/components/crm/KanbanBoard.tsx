"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { MessageSquare, DollarSign, User } from "lucide-react";
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
    if (!temp) return "bg-gray-500/20 text-gray-500";
    const t = temp.toLowerCase();
    if (t === "frio") return "bg-blue-500/20 text-blue-400";
    if (t === "morno") return "bg-yellow-500/20 text-yellow-500";
    if (t === "quente") return "bg-orange-500/20 text-orange-400";
    if (t === "prioritário" || t === "prioritario") return "bg-red-500/20 text-red-500";
    return "bg-gray-500/20 text-gray-400";
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full min-w-max pb-4">
        {KANBAN_COLUMNS.map((columnId) => {
          const columnLeads = leads.filter((l) => l.status === columnId);

          return (
            <div key={columnId} className="w-80 bg-secondary/30 rounded-2xl p-3 border border-border/40 flex flex-col h-full shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-sm text-foreground/80">{columnId}</h3>
                <span className="bg-background/80 px-2 py-0.5 rounded-full text-xs text-muted-foreground border border-border/50 shadow-sm">
                  {columnLeads.length}
                </span>
              </div>

              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto space-y-3 min-h-[150px] p-1 rounded-xl transition-colors ${
                      snapshot.isDraggingOver ? "bg-blue-500/5 border border-blue-500/20 border-dashed" : "border border-transparent"
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
                            className={`bg-card border rounded-xl p-4 shadow-sm transition-all group cursor-grab active:cursor-grabbing ${
                              snapshot.isDragging ? "border-blue-500 shadow-xl shadow-blue-500/20 rotate-2 scale-105 z-50" : "border-border hover:border-blue-400/50 hover:shadow-md"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm leading-tight group-hover:text-blue-400 transition-colors">{lead.name}</h4>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-2 shrink-0 ${getTemperatureColor(lead.temperature)}`}>
                                {lead.temperature || "Frio"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                              <MessageSquare size={12} className={lead.phone ? "text-green-500" : ""} />
                              {lead.phone ? lead.phone : "Sem número"}
                            </div>

                            <div className="flex gap-2 flex-wrap text-[10px] text-muted-foreground">
                              {lead.budget && (
                                <span className="flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded-md">
                                  <DollarSign size={10} /> {lead.budget}
                                </span>
                              )}
                              {lead.propertyType && (
                                <span className="flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded-md">
                                  <User size={10} /> {lead.propertyType}
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
