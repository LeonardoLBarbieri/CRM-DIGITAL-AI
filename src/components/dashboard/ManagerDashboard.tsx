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
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-accent/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in relative overflow-hidden">
      <header className="mb-8 relative z-10">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Gerencial</h1>
        <p className="text-muted-foreground mt-2">Visão geral do funil de vendas, conversão e receitas.</p>
      </header>

      {/* Top Stats Cards — Spatial UI */}
      <div className="perspective-container grid grid-cols-2 md:grid-cols-4 gap-5 relative z-10">
        <StatCard title="Total de Leads" value={stats.totalLeads} icon={<Users size={20} />} trend="+12% este mês" color="blue" delay={0} />
        <StatCard title="Visitas Agendadas" value={stats.visitsScheduled} icon={<Calendar size={20} />} trend="5 para esta semana" color="purple" delay={1} />
        <StatCard title="Vendas Concluídas" value={stats.salesCompleted} icon={<CheckCircle size={20} />} trend="+2 que o mês passado" color="emerald" delay={2} />
        <StatCard title="Taxa de Conversão" value={`${stats.conversionRate}%`} icon={<Target size={20} />} trend="+1.5% este mês" color="orange" delay={3} />
      </div>

      <div className="perspective-container grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Receitas — 3D Glass Card */}
        <div className="glass-card-3d p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/15">
                <DollarSign size={18} className="text-green-400" />
              </div>
              Receitas
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1.5">Receita Realizada (Vendas)</p>
                <p className="text-3xl font-bold text-foreground tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.revenueRealized)}
                </p>
              </div>
              
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              
              <div>
                <p className="text-sm text-muted-foreground mb-1.5">Receita Estimada (Propostas)</p>
                <p className="text-2xl font-bold text-muted-foreground tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.revenueEstimated)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 stat-card-spatial p-4 flex items-center justify-between !bg-green-500/[0.06] !border-green-500/15">
            <span className="text-sm font-medium text-green-400">Batendo a meta</span>
            <ArrowUpRight size={20} className="text-green-400" />
          </div>
        </div>

        {/* Evolução Semestre — 3D Chart Panel */}
        <div className="chart-panel-glass p-6 lg:col-span-2">
          <h3 className="font-semibold text-lg mb-6 relative z-10">Evolução do Semestre</h3>
          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyTrend}>
                <defs>
                  <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#0891B2" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8888AA', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8888AA', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                    background: 'rgba(12, 12, 30, 0.9)',
                    backdropFilter: 'blur(20px)',
                    color: '#F0F0F8',
                  }}
                />
                <Line type="monotone" dataKey="leads" name="Leads" stroke="url(#lineGlow)" strokeWidth={3} dot={{ r: 4, fill: '#7C3AED', stroke: '#7C3AED', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#7C3AED', stroke: 'rgba(124,58,237,0.3)', strokeWidth: 4 }} />
                <Line type="monotone" dataKey="vendas" name="Vendas" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', stroke: '#10b981', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Distribuição — 3D Chart Panel */}
        <div className="chart-panel-glass p-6 lg:col-span-3">
          <h3 className="font-semibold text-lg mb-6 relative z-10">Distribuição de Leads</h3>
          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.leadsByStatus} layout="vertical" margin={{ left: 20 }}>
                <defs>
                  {stats.leadsByStatus.map((entry: any, index: number) => (
                    <linearGradient key={`grad-${index}`} id={`bar-${index}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#8888AA', fontSize: 12 }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(124, 58, 237, 0.04)' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
                    background: 'rgba(12, 12, 30, 0.9)',
                    backdropFilter: 'blur(20px)',
                    color: '#F0F0F8',
                  }}
                />
                <Bar dataKey="value" name="Leads" radius={[0, 8, 8, 0]}>
                  {stats.leadsByStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={`url(#bar-${index})`} />
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

function StatCard({ title, value, icon, trend, color, delay }: any) {
  const colorMap: Record<string, { icon: string; glow: string }> = {
    blue: { icon: "text-blue-400 bg-blue-500/10 border-blue-500/15", glow: "shadow-blue-500/5" },
    purple: { icon: "text-purple-400 bg-purple-500/10 border-purple-500/15", glow: "shadow-purple-500/5" },
    emerald: { icon: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15", glow: "shadow-emerald-500/5" },
    orange: { icon: "text-orange-400 bg-orange-500/10 border-orange-500/15", glow: "shadow-orange-500/5" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`stat-card-spatial p-5 flex flex-col justify-between cursor-pointer ${c.glow}`}
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-xl border ${c.icon}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
          <TrendingUp size={12} className={color === 'orange' ? 'text-orange-400' : 'text-green-400'} /> {trend}
        </p>
      </div>
    </div>
  );
}
