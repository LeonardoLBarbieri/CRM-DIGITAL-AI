"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, Cell, LabelList
} from "recharts";
import { Users, Calendar, DollarSign, TrendingUp, CheckCircle, Target, ArrowUpRight, X, Loader2, Sparkles } from "lucide-react";
import { TeamManager } from "./TeamManager";
import { AICampaignCreator } from "../campaigns/AICampaignCreator";
import type { DashboardMetrics, LeadStatus } from "@/lib/types";

// Cores por status do funil
const STATUS_COLORS: Partial<Record<LeadStatus, string>> = {
  "Lead Novo":           "#3b82f6",
  "Primeiro Contato":    "#6366f1",
  "Qualificação":        "#8b5cf6",
  "Em Negociação":       "#a855f7",
  "Visita Agendada":     "#f59e0b",
  "Visita Realizada":    "#f97316",
  "Proposta Enviada":    "#ec4899",
  "Aguardando Resposta": "#e879f9",
  "Reserva Efetuada":    "#14b8a6",
  "Contrato Assinado":   "#22c55e",
  "Venda Concluída":     "#10b981",
  "Lead Perdido":        "#ef4444",
};

export function ManagerDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"month" | "3months" | "year">("month");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showAICreator, setShowAICreator] = useState(false);

  const toggleFilter = (filterName: string) => {
    setActiveFilter(activeFilter === filterName ? null : filterName);
  };

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?period=${period}`);
      if (!res.ok) throw new Error("Erro ao buscar métricas");
      const data: DashboardMetrics = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error(e);
      setError("Não foi possível carregar os dados do dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-accent/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-red-400 text-lg font-medium">{error || "Erro desconhecido"}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-xl text-sm font-medium transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Preparar dados do funil para o gráfico de barras
  const funnelData = Object.entries(metrics.funnelDistribution)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([status, count]) => ({
      name: status,
      value: count ?? 0,
      color: STATUS_COLORS[status as LeadStatus] ?? "#8b5cf6",
    }))
    .sort((a, b) => b.value - a.value);

  // Preparar dados de tendência diária (últimos 14 dias com dados)
  const trendData = metrics.dailyNewLeads
    .slice(-14)
    .map((d) => ({
      name: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      leads: d.count,
    }));

  // Calcular conversão de forma legível
  const conversionDisplay = metrics.conversionRate > 0
    ? `${metrics.conversionRate.toFixed(1)}%`
    : "0%";

  return (
    <div className="space-y-8 animate-in fade-in relative overflow-hidden pb-12">
      {/* Header com filtro de período */}
      <header className="mb-8 relative z-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Gerencial</h1>
          <p className="text-muted-foreground mt-2">Visão geral do funil de vendas, conversão e receitas.</p>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <button
            onClick={() => setShowAICreator(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-500/25"
          >
            <Sparkles size={16} />
            Criar Campanha com IA
          </button>
          
          <div className="flex gap-2">
          {(["month", "3months", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                period === p
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "border-border/50 hover:bg-white/5 text-muted-foreground"
              }`}
            >
              {p === "month" ? "30 dias" : p === "3months" ? "3 meses" : "Este ano"}
            </button>
          ))}
          </div>
        </div>
      </header>

      {/* Top Stats Cards */}
      <div className="perspective-container grid grid-cols-2 md:grid-cols-4 gap-5 relative z-10">
        <StatCard
          title="Total de Leads"
          value={metrics.totalLeads}
          icon={<Users size={20} />}
          trend={`+${metrics.leadsToday} hoje`}
          color="blue"
          delay={0}
          isActive={activeFilter === "Total de Leads"}
          hasActiveFilter={!!activeFilter}
          onClick={() => toggleFilter("Total de Leads")}
        />
        <StatCard
          title="Visitas Agendadas"
          value={metrics.pendingVisits}
          icon={<Calendar size={20} />}
          trend="Em aberto"
          color="purple"
          delay={1}
          isActive={activeFilter === "Visitas Agendadas"}
          hasActiveFilter={!!activeFilter}
          onClick={() => toggleFilter("Visitas Agendadas")}
        />
        <StatCard
          title="Vendas Concluídas"
          value={metrics.closedThisMonth}
          icon={<CheckCircle size={20} />}
          trend="No período"
          color="emerald"
          delay={2}
          isActive={activeFilter === "Vendas Concluídas"}
          hasActiveFilter={!!activeFilter}
          onClick={() => toggleFilter("Vendas Concluídas")}
        />
        <StatCard
          title="Taxa de Conversão"
          value={conversionDisplay}
          icon={<Target size={20} />}
          trend={`${metrics.openProposals} propostas abertas`}
          color="orange"
          delay={3}
          isActive={activeFilter === "Taxa de Conversão"}
          hasActiveFilter={!!activeFilter}
          onClick={() => toggleFilter("Taxa de Conversão")}
        />
      </div>

      <div className="perspective-container grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

        {/* Receitas — dados reais */}
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
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(metrics.realizedRevenue)}
                </p>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

              <div>
                <p className="text-sm text-muted-foreground mb-1.5">Receita Estimada (Pipeline)</p>
                <p className="text-2xl font-bold text-muted-foreground tracking-tight">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(metrics.estimatedRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Baseado em priceMax dos leads em pipeline</p>
              </div>
            </div>
          </div>

          <div className="mt-8 stat-card-spatial p-4 flex items-center justify-between !bg-green-500/[0.06] !border-green-500/15">
            <span className="text-sm font-medium text-green-400">
              {metrics.leadsThisWeek} leads esta semana
            </span>
            <ArrowUpRight size={20} className="text-green-400" />
          </div>
        </div>

        {/* Evolução de Leads — dados reais */}
        <div className="chart-panel-glass p-6 lg:col-span-2">
          <h3 className="font-semibold text-lg mb-6 relative z-10">
            Novos Leads — Últimos 14 dias
          </h3>
          {trendData.every((d) => d.leads === 0) ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum lead cadastrado no período selecionado.
            </div>
          ) : (
            <div className="h-64 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#0891B2" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#8888AA", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8888AA", fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                      background: "rgba(12, 12, 30, 0.9)",
                      backdropFilter: "blur(20px)",
                      color: "#F0F0F8",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="url(#lineGlow)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#7C3AED", stroke: "#7C3AED", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#7C3AED", stroke: "rgba(124,58,237,0.3)", strokeWidth: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Distribuição por status — dados reais */}
        <div className="chart-panel-glass p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="font-semibold text-lg">Distribuição de Leads por Status</h3>
            {activeFilter && (
              <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-medium animate-in fade-in flex items-center gap-2">
                Filtrando: {activeFilter}
                <button onClick={() => setActiveFilter(null)} className="hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {funnelData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
              Nenhum lead cadastrado ainda. Adicione leads no CRM para ver o funil.
            </div>
          ) : (
            <div className="h-64 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 60, left: 10, bottom: 10 }} barSize={14}>
                  <defs>
                    {funnelData.map((entry, index) => (
                      <linearGradient key={`grad-${index}`} id={`bar-${index}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={entry.color} stopOpacity={0.7} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis type="number" hide domain={[0, "dataMax + 2"]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={140}
                    tick={{ fill: "#8888AA", fontSize: 12, fontWeight: 500 }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                      background: "rgba(12, 12, 30, 0.9)",
                      backdropFilter: "blur(20px)",
                      color: "#F0F0F8",
                    }}
                    labelStyle={{ color: "#FFFFFF", fontWeight: "bold", paddingBottom: "4px" }}
                    itemStyle={{ color: "#E0E0F0", fontSize: "14px" }}
                  />
                  <Bar
                    dataKey="value"
                    name="Leads"
                    radius={[8, 8, 8, 8]}
                    background={{ fill: "rgba(255, 255, 255, 0.03)", radius: 8 }}
                    onClick={(data: any) => toggleFilter(data.name)}
                    cursor="pointer"
                  >
                    {funnelData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#bar-${index})`}
                        opacity={activeFilter && activeFilter !== entry.name ? 0.3 : 1}
                        style={{ transition: "opacity 0.3s ease" }}
                      />
                    ))}
                    <LabelList dataKey="value" position="right" fill="#F0F0F8" fontSize={13} fontWeight={600} offset={10} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <TeamManager />

      {/* AI Campaign Creator Modal */}
      {showAICreator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <AICampaignCreator onClose={() => setShowAICreator(false)} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, color, delay, isActive, hasActiveFilter, onClick }: any) {
  const colorMap: Record<string, { icon: string; glow: string; border: string }> = {
    blue:    { icon: "text-blue-400 bg-blue-500/10 border-blue-500/15",    glow: "shadow-blue-500/5",    border: "rgba(59, 130, 246, 0.5)" },
    purple:  { icon: "text-purple-400 bg-purple-500/10 border-purple-500/15", glow: "shadow-purple-500/5", border: "rgba(168, 85, 247, 0.5)" },
    emerald: { icon: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15", glow: "shadow-emerald-500/5", border: "rgba(16, 185, 129, 0.5)" },
    orange:  { icon: "text-orange-400 bg-orange-500/10 border-orange-500/15", glow: "shadow-orange-500/5", border: "rgba(249, 115, 22, 0.5)" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`stat-card-spatial p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 ${c.glow}`}
      style={{
        animationDelay: `${delay * 100}ms`,
        opacity: hasActiveFilter && !isActive ? 0.3 : 1,
        borderColor: isActive ? c.border : "",
        boxShadow: isActive ? `0 0 0 1px ${c.border} inset, 0 16px 48px rgba(0,0,0,0.4)` : "",
        transform: isActive ? "translateY(-4px) scale(1.02)" : "",
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={`p-2 rounded-xl border ${c.icon}`}>{icon}</div>
      </div>
      <div>
        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
          <TrendingUp size={12} className={color === "orange" ? "text-orange-400" : "text-green-400"} />
          {trend}
        </p>
      </div>
    </div>
  );
}
