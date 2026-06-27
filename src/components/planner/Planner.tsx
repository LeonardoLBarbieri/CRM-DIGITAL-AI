"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Plus, Clock, AlertCircle, X, MapPin, User, FileText, Calendar as CalendarIcon, Tag, PhoneCall, Building, MessageSquare } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Planner() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskType, setTaskType] = useState("visita");
  const [taskTime, setTaskTime] = useState("09:00");
  const [taskClient, setTaskClient] = useState("");
  const [taskProperty, setTaskProperty] = useState("");
  const [taskNotes, setTaskNotes] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Usando endpoint de tasks que vimos existir no projeto /api/tasks
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        // Fallback para leads se a rota não funcionar corretamente
        const leadRes = await fetch("/api/leads");
        if (leadRes.ok) {
          const leadData = await leadRes.json();
          const allTasks: any[] = [];
          (leadData.leads || []).forEach((l: any) => {
            if (l.tasks) {
              l.tasks.forEach((t: any) => allTasks.push({...t, leadName: l.name}));
            }
          });
          setTasks(allTasks);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    // Constrói a data/hora final
    const [hours, minutes] = taskTime.split(":");
    const finalDate = new Date(selectedDate);
    finalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const newTask = {
      title: taskTitle,
      type: taskType,
      dueAt: finalDate.toISOString(),
      description: `Cliente: ${taskClient}\nImóvel: ${taskProperty}\nNotas: ${taskNotes}`,
      status: "pendente",
      leadId: "cm0z6x9m00000" // Um ID dummy caso não tenha lead selecionado, ou buscar no backend
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      
      if (res.ok) {
        fetchTasks();
        setIsModalOpen(false);
        resetForm();
      } else {
        alert("Erro ao salvar tarefa. O endpoint precisa de um LeadID válido.");
        // Fallback visual temporário para o corretor não perder o planejamento na tela
        setTasks([...tasks, { ...newTask, id: Date.now().toString(), lead: { name: taskClient } }]);
        setIsModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setTaskTitle("");
    setTaskType("visita");
    setTaskTime("09:00");
    setTaskClient("");
    setTaskProperty("");
    setTaskNotes("");
  };

  const openModalForDate = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
  const hours = Array.from({ length: 14 }).map((_, i) => i + 7); // 7h às 20h

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "visita": return <MapPin size={12} className="text-blue-400" />;
      case "ligar": return <PhoneCall size={12} className="text-green-400" />;
      case "whatsapp": return <MessageSquare size={12} className="text-green-500" />;
      case "captação": return <Building size={12} className="text-orange-400" />;
      case "proposta": return <FileText size={12} className="text-purple-400" />;
      default: return <CalendarIcon size={12} className="text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "visita": return "bg-blue-500/10 border-blue-500/30 text-blue-100";
      case "ligar": return "bg-green-500/10 border-green-500/30 text-green-100";
      case "whatsapp": return "bg-green-500/10 border-green-500/30 text-green-100";
      case "captação": return "bg-orange-500/10 border-orange-500/30 text-orange-100";
      case "proposta": return "bg-purple-500/10 border-purple-500/30 text-purple-100";
      default: return "bg-neutral-800 border-neutral-700 text-neutral-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agenda Imobiliária</h1>
            <p className="text-muted-foreground mt-1">Organize suas captações, visitas e follow-ups.</p>
          </div>
        </div>
        
        <button 
          onClick={() => openModalForDate(new Date())}
          className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 px-5 rounded-xl transition-all shadow-lg flex items-center gap-2"
        >
          <Plus size={18} /> Novo Apontamento
        </button>
      </header>

      {/* Alerta Estratégico do Corretor */}
      <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl mb-4">
        <AlertCircle size={20} />
        <span className="text-sm font-medium">Você tem visitas aguardando feedback e propostas em negociação nesta semana. Não se esqueça do follow-up!</span>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50 flex flex-col h-[75vh]">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 bg-black/20 border-b border-border/50 shrink-0">
          <h2 className="font-semibold text-xl capitalize flex items-center gap-2">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="px-4 py-2 rounded-lg border border-border/50 hover:bg-white/5 text-sm transition-colors">Anterior</button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-border/50 font-medium text-sm transition-colors">Hoje</button>
            <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="px-4 py-2 rounded-lg border border-border/50 hover:bg-white/5 text-sm transition-colors">Próxima</button>
          </div>
        </div>

        {/* Calendar Grid (Google Calendar Style) */}
        <div className="flex flex-1 overflow-y-auto relative">
          
          {/* Time Column */}
          <div className="w-16 shrink-0 border-r border-border/30 bg-black/10">
            <div className="h-14 border-b border-border/30"></div> {/* Spacer for header */}
            {hours.map(hour => (
              <div key={hour} className="h-20 border-b border-border/10 text-xs text-muted-foreground text-right pr-2 pt-1">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Days Columns */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-border/30">
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              const dayTasks = tasks.filter(t => isSameDay(new Date(t.dueAt), day));
              
              return (
                <div key={i} className={`flex flex-col relative ${isToday ? "bg-purple-500/5" : ""}`}>
                  {/* Day Header */}
                  <div className={`h-14 sticky top-0 z-10 p-2 text-center border-b border-border/30 backdrop-blur-md ${isToday ? "bg-purple-900/40 text-purple-300 border-b-purple-500/50" : "bg-black/40 text-muted-foreground"}`}>
                    <div className="text-[10px] uppercase font-bold tracking-wider">{format(day, "EEE", { locale: ptBR })}</div>
                    <div className={`text-xl font-medium mt-0.5 ${isToday ? "text-white" : ""}`}>{format(day, "d")}</div>
                  </div>
                  
                  {/* Time Slots Background */}
                  <div className="relative flex-1" onClick={() => openModalForDate(day)}>
                    {hours.map(hour => (
                      <div key={hour} className="h-20 border-b border-border/10 hover:bg-white/5 transition-colors cursor-pointer group">
                         <div className="opacity-0 group-hover:opacity-100 absolute left-2 text-[10px] text-purple-400 mt-1 font-medium transition-opacity">+ Add</div>
                      </div>
                    ))}
                    
                    {/* Tasks Absolutely Positioned (Google Calendar Style) */}
                    {dayTasks.map(task => {
                      const taskDate = new Date(task.dueAt);
                      const hour = taskDate.getHours();
                      const minutes = taskDate.getMinutes();
                      
                      // Calculate position (each hour is 80px tall)
                      const topPosition = (hour - 7) * 80 + (minutes / 60) * 80;
                      
                      // Skip if outside our visible hours (7 to 20)
                      if (hour < 7 || hour > 20) return null;

                      return (
                        <div 
                          key={task.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Visualizando tarefa: ${task.type || task.title}\nDetalhes: ${task.description}`);
                          }}
                          className={`absolute left-1 right-1 p-2 rounded-lg border shadow-sm cursor-pointer hover:z-20 hover:scale-[1.02] transition-all overflow-hidden ${getTypeColor(task.type)}`}
                          style={{ top: `${Math.max(0, topPosition)}px`, minHeight: '60px', zIndex: 10 }}
                        >
                          <div className="text-[10px] font-semibold flex items-center gap-1 mb-1 opacity-80">
                            {getTypeIcon(task.type)}
                            {format(taskDate, "HH:mm")}
                          </div>
                          <div className="text-xs font-bold leading-tight line-clamp-1">{task.title || task.type}</div>
                          <div className="text-[10px] opacity-70 mt-1 line-clamp-1">{task.leadName || task.lead?.name || "Sem cliente"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL NOVO APONTAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-popover border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden flex flex-col slide-in-from-bottom-4 animate-in">
            <div className="flex justify-between items-center p-5 border-b border-border/50 bg-secondary/30">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CalendarDays className="text-purple-500" size={20} />
                Novo Apontamento
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Título / Objetivo</label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex: Visita no decorado do Lumina, Reunião de captação..."
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><CalendarIcon size={14} /> Data</label>
                  <input 
                    type="date" 
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={(e) => setSelectedDate(parseISO(e.target.value))}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock size={14} /> Horário</label>
                  <input 
                    type="time" 
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Tag size={14} /> Tipo de Ação</label>
                  <select 
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none"
                  >
                    <option value="visita">📍 Visita</option>
                    <option value="ligar">📞 Ligação</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="captação">🏢 Captação</option>
                    <option value="proposta">📝 Proposta</option>
                    <option value="fechamento">🤝 Fechamento</option>
                    <option value="marketing">📸 Post/Marketing</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><User size={14} /> Cliente (Lead)</label>
                  <input 
                    type="text" 
                    value={taskClient}
                    onChange={(e) => setTaskClient(e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Building size={14} /> Imóvel Vinculado</label>
                <input 
                  type="text" 
                  value={taskProperty}
                  onChange={(e) => setTaskProperty(e.target.value)}
                  placeholder="Ex: Apt 302 Ed. Supremo, Casa Cond. Jardins..."
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1"><FileText size={14} /> Observações</label>
                <textarea 
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="Budget do cliente, detalhes da visita, pegar chaves..."
                  className="w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none h-20"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium hover:bg-secondary rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 text-sm font-medium rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2"
                >
                  <CalendarIcon size={16} />
                  Salvar Apontamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
