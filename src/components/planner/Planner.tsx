"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Plus, Clock, AlertCircle } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export function Planner() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    // Para simplificar, estamos pegando dos leads (onde tasks moram) ou podemos criar rota de tasks
    // O projeto tem um /api/tasks se a gente criasse, mas como MVP vamos usar os leads e pegar as tasks
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        const leads = data.leads || [];
        const allTasks: any[] = [];
        leads.forEach((l: any) => {
          if (l.tasks) {
            l.tasks.forEach((t: any) => allTasks.push({...t, leadName: l.name}));
          }
        });
        setTasks(allTasks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Começa na segunda-feira

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

  return (
    <div className="space-y-6 animate-in fade-in">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Planner</h1>
            <p className="text-muted-foreground mt-1">Organize sua semana e compromissos com clientes.</p>
          </div>
        </div>
        
        <button className="bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 px-5 rounded-xl transition-all shadow-lg flex items-center gap-2">
          <Plus size={18} /> Novo Apontamento
        </button>
      </header>

      <div className="glass-panel rounded-2xl overflow-hidden border border-border/50">
        <div className="flex items-center justify-between p-4 bg-black/10 border-b border-border/50">
          <h2 className="font-semibold text-lg capitalize">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="px-3 py-1.5 rounded-lg border border-border/50 hover:bg-white/5 text-sm">Semana Anterior</button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-lg border border-border/50 hover:bg-white/5 text-sm">Hoje</button>
            <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="px-3 py-1.5 rounded-lg border border-border/50 hover:bg-white/5 text-sm">Próxima Semana</button>
          </div>
        </div>

        <div className="grid grid-cols-7 divide-x divide-border/30">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, new Date());
            const dayTasks = tasks.filter(t => isSameDay(new Date(t.dueAt), day));
            
            return (
              <div key={i} className={`min-h-[400px] flex flex-col ${isToday ? "bg-purple-500/5" : ""}`}>
                <div className={`p-3 text-center border-b border-border/30 ${isToday ? "bg-purple-500/10 text-purple-400 font-bold" : "text-muted-foreground"}`}>
                  <div className="text-xs uppercase font-medium">{format(day, "EEE", { locale: ptBR })}</div>
                  <div className="text-xl mt-1">{format(day, "d")}</div>
                </div>
                
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {dayTasks.map(task => (
                    <div key={task.id} className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-2 text-xs hover:border-purple-500/50 transition-colors cursor-pointer group">
                      <div className="font-semibold mb-1 text-white group-hover:text-purple-400 transition-colors">{task.type}</div>
                      <div className="text-muted-foreground flex items-center gap-1 mb-1.5">
                        <Clock size={10} /> {format(new Date(task.dueAt), "HH:mm")}
                      </div>
                      <div className="bg-white/5 px-2 py-1 rounded truncate">
                        👤 {task.leadName}
                      </div>
                    </div>
                  ))}
                  
                  {dayTasks.length === 0 && (
                    <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button className="text-xs text-purple-400 font-medium flex items-center gap-1">
                        <Plus size={12} /> Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Alertas */}
      <div className="mt-6 flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl">
        <AlertCircle size={20} />
        <span className="text-sm font-medium">Lembrete: Você tem 2 retornos agendados para amanhã que ainda não foram confirmados.</span>
      </div>
    </div>
  );
}
