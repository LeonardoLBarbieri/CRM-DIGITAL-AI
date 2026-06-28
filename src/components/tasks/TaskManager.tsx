"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, CalendarIcon, AlertCircle, PhoneCall, Mail, DollarSign, Calendar, MessageSquare } from "lucide-react";
import type { Task, Lead } from "@prisma/client";

type TaskWithLead = Task & { lead: Lead };

export function TaskManager() {
  const [tasks, setTasks] = useState<TaskWithLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const completeTask = async (taskId: string) => {
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: "concluida" }),
      });
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const now = new Date();
  
  const overdueTasks = tasks.filter(t => t.status === "pendente" && new Date(t.dueAt) < now);
  
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayTasks = tasks.filter(t => t.status === "pendente" && new Date(t.dueAt) >= now && new Date(t.dueAt) <= todayEnd);
  
  const upcomingTasks = tasks.filter(t => t.status === "pendente" && new Date(t.dueAt) > todayEnd);

  const getTaskIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "ligar": return <PhoneCall size={16} className="text-blue-500" />;
      case "whatsapp": return <MessageSquare size={16} className="text-green-500" />;
      case "proposta": return <DollarSign size={16} className="text-orange-500" />;
      case "visita": return <Calendar size={16} className="text-purple-500" />;
      case "email": return <Mail size={16} className="text-indigo-500" />;
      default: return <CheckCircle2 size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Suas Tarefas</h2>
        <p className="text-muted-foreground mt-1">Acompanhe seus próximos compromissos e contatos com leads.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Atrasadas */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <h3 className="font-semibold text-red-500 flex items-center gap-2 mb-4">
            <AlertCircle size={18} /> Atrasadas ({overdueTasks.length})
          </h3>
          <div className="space-y-3">
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa atrasada. Ótimo trabalho!</p>
            ) : (
              overdueTasks.map(task => (
                <TaskCard key={task.id} task={task} icon={getTaskIcon(task.type)} onComplete={() => completeTask(task.id)} />
              ))
            )}
          </div>
        </div>

        {/* Hoje */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
          <h3 className="font-semibold text-blue-500 flex items-center gap-2 mb-4">
            <Clock size={18} /> Para Hoje ({todayTasks.length})
          </h3>
          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Você não tem tarefas para hoje.</p>
            ) : (
              todayTasks.map(task => (
                <TaskCard key={task.id} task={task} icon={getTaskIcon(task.type)} onComplete={() => completeTask(task.id)} />
              ))
            )}
          </div>
        </div>

        {/* Próximas */}
        <div className="bg-secondary/30 border border-border/40 rounded-2xl p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <CalendarIcon size={18} /> Próximas ({upcomingTasks.length})
          </h3>
          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa agendada.</p>
            ) : (
              upcomingTasks.map(task => (
                <TaskCard key={task.id} task={task} icon={getTaskIcon(task.type)} onComplete={() => completeTask(task.id)} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, icon, onComplete }: { task: TaskWithLead, icon: React.ReactNode, onComplete: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-start gap-3 hover:shadow-md transition-all group">
      <div className="mt-0.5 bg-secondary p-1.5 rounded-md">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-medium text-sm leading-tight capitalize">{task.type}</h4>
        </div>
        <p className="text-xs text-muted-foreground mb-1">Lead: <span className="font-medium text-foreground">{task.lead?.name || "Desconhecido"}</span></p>
        <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
          <Clock size={10} /> 
          {new Date(task.dueAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onComplete}
            className="text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
          >
            <CheckCircle2 size={12} /> Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
