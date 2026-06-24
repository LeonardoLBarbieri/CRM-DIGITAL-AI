"use client";

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import { Users, Calendar, DollarSign, TrendingUp, CheckCircle, Target, ArrowUpRight } from "lucide-react";

export function ManagerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from /api/dashboard/stats
    // For now we simulate with mock data for the UI
    setTimeout(() => {
      setStats({
        totalLeads: 245,
        leadsToday: 12,
        leadsWeek: 45,
        leadsMonth: 120,
        conversionRate: 14.2,
        visitsScheduled: 18,
        proposalsSent: 8,
        salesCompleted: 4,
        revenueEstimated: 8500000,
        revenueRealized: 1250000,
        leadsByStatus: [
          { name: "Novos", value: 45, color: "#3b82f6" },
          { name: "Atendimento", value: 80, color: "#8b5cf6" },
          { name: "Visita", value: 30, color: "#f59e0b" },
          { name: "Proposta", value: 15, color: "#ec4899" },
          { name: "Fechados", value: 75, color: "#10b981" },
        ],
        monthlyTrend: [
          { name: 'Jan', leads: 65, vendas: 2 },
          { name: 'Fev', leads: 85, vendas: 3 },
          { name: 'Mar', leads: 120, vendas: 5 },
          { name: 'Abr', leads: 95, vendas: 4 },
          { name: 'Mai', leads: 150, vendas: 7 },
          { name: 'Jun', leads: 245, vendas: 12 },
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Gerencial</h1>
        <p className="text-muted-foreground mt-2">Visão geral do funil de vendas, conversão e receitas.</p>
      </header>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total de Leads" value={stats.totalLeads} icon={<Users size={20} />} trend="+12% este mês" color="blue" />
        <StatCard title="Visitas Agendadas" value={stats.visitsScheduled} icon={<Calendar size={20} />} trend="5 para esta semana" color="purple" />
        <StatCard title="Vendas Concluídas" value={stats.salesCompleted} icon={<CheckCircle size={20} />} trend="+2 que o mês passado" color="emerald" />
        <StatCard title="Taxa de Conversão" value={`${stats.conversionRate}%`} icon={<Target size={20} />} trend="+1.5% este mês" color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Receitas */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-1 border border-border/50 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-6">
              <DollarSign size={20} className="text-green-500" /> Receitas
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Receita Realizada (Vendas)</p>
                <p className="text-3xl font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.revenueRealized)}
                </p>
              </div>
              
              <div className="h-px w-full bg-border" />
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Receita Estimada (Propostas)</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.revenueEstimated)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Batendo a meta</span>
            <ArrowUpRight size={20} className="text-green-500" />
          </div>
        </div>

        {/* Gráfico Funil/Status */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 border border-border/50 shadow-sm">
          <h3 className="font-semibold text-lg mb-6">Evolução do Semestre</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="vendas" name="Vendas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Leads por Status */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-3 border border-border/50 shadow-sm">
          <h3 className="font-semibold text-lg mb-6">Distribuição de Leads</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.leadsByStatus} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.2} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {stats.leadsByStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    orange: "text-orange-500 bg-orange-500/10",
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-border/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <TrendingUp size={12} className={color === 'orange' ? 'text-orange-500' : 'text-green-500'} /> {trend}
        </p>
      </div>
    </div>
  );
}
