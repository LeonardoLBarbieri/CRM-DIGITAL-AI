"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line, Cell, LabelList
} from "recharts";
import { Users, Calendar, DollarSign, TrendingUp, CheckCircle, Target, ArrowUpRight, X, Loader2, Sparkles, MessageSquare, Settings, BarChart3 } from "lucide-react";
import { TeamManager } from "./TeamManager";
import { AICampaignCreator } from "../campaigns/AICampaignCreator";
import WhatsAppSimulator from "../crm/WhatsAppSimulator";
import WhatsAppSettings from "./WhatsAppSettings";
import type { DashboardMetrics, LeadStatus } from "@/lib/types";
import { SectionHeader } from "@/components/ui/SectionHeader";

// Solid flat colors for funnel statuses in Vercel/Linear style
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
  const [showWhatsAppSimulator, setShowWhatsAppSimulator] = useState(false);
  const [showWhatsAppSettings, setShowWhatsAppSettings] = useState(false);

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
        <div className="w-10 h-10 rounded-full border-2 border-border border-t-foreground animate-spin" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-destructive text-sm font-medium">{error || "Erro desconhecido"}</p>
        <button
          onClick={fetchMetrics}
          className="btn-primary py-2 px-4"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const funnelData = Object.entries(metrics.funnelDistribution)
    .filter(([, count]) => (count ?? 0) > 0)
    .map(([status, count]) => ({
      name: status,
      value: count ?? 0,
      color: STATUS_COLORS[status as LeadStatus] ?? "#8b5cf6",
    }))
    .sort((a, b) => b.value - a.value);

  const trendData = metrics.dailyNewLeads
    .slice(-14)
    .map((d) => ({
      name: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      leads: d.count,
    }));

  const conversionDisplay = metrics.conversionRate > 0
    ? `${metrics.conversionRate.toFixed(1)}%`
    : "0%";

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      <SectionHeader
        icon={<BarChart3 size={20} />}
        title="Dashboard Gerencial"
        subtitle="Visão geral do funil de vendas, conversão e receitas."
        color="blue"
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => setShowAICreator(true)}
              className="btn-primary flex items-center gap-1.5 py-1.5 px-3 text-xs"
            >
              <Sparkles size={14} />
              Criar Campanha IA
            </button>

            <button
              onClick={() => setShowWhatsAppSimulator(true)}
              className="btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-xs"
            >
              <MessageSquare size={14} />
              Simular WhatsApp
            </button>

            <button
              onClick={() => setShowWhatsAppSettings(true)}
              className="btn-ghost flex items-center gap-1.5 py-1.5 px-3 text-xs border border-border bg-card"
            >
              <Settings size={14} />
              Config WhatsApp
            </button>
            
            <div className="flex gap-1 border border-border rounded-lg p-0.5 bg-secondary ml-1">
              {(["month", "3months", "year"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                    period === p
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p === "month" ? "30d" : p === "3months" ? "3m" : "Ano"}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Leads"
          value={metrics.totalLeads}
          icon={<Users size={16} />}
          trend={`+${metrics.leadsToday} hoje`}
          color="blue"
          isActive={activeFilter === "Total de Leads"}
          hasActiveFilter={!!activeFilter}
          onClick={() => toggleFilter("Total de Leads")}
        />
        <StatCard
          title="Visitas Agendadas"
          value={metrics.pendingVisits}
          icon={<Calendar size={16} />}
          trend="Em aberto"
          color="purple"
          isActive={activeFilter === "Visitas Agendadas"}
          hasActiveFilter={!!activeFilter}
          onClick={() => toggleFilter("Visitas Agendadas")}
        />
        <StatCard
          title="Vendas Concluídas"
          value={metrics.closedThisMonth}
          icon={<CheckCircle size={16} />}
          trend="No período"
          color="emerald"
          isActive={activeFilter === "Vendas Concluídas"}
          hasActiveFilter={!!activeFilter}
          onClick={() => toggleFilter("Vendas Concluídas")}
        />
        <StatCard
          title="Taxa de Conversão"
          value={conversionDisplay}
          icon={<Target size={16} />}
          trend={`${metrics.openProposals} propostas abertas`}
          color="orange"
          isActive={activeFilter === "Taxa de Conversão"}
          hasActiveFilter={!!activeFilter}
          onClick={() => toggleFilter("Taxa de Conversão")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Receitas */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-5 text-emerald-700">
              <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
                <DollarSign size={14} />
              </div>
              Finanças do Funil
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-emerald-600/70 uppercase tracking-wider font-semibold">Receita Realizada (Vendas)</p>
                <p className="text-2xl font-bold text-emerald-800 tracking-tight mt-0.5">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(metrics.realizedRevenue)}
                </p>
              </div>

              <div className="h-px w-full bg-emerald-200" />

              <div>
                <p className="text-[10px] text-emerald-600/70 uppercase tracking-wider font-semibold">Receita Estimada (Pipeline)</p>
                <p className="text-xl font-bold text-emerald-600 tracking-tight mt-0.5">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(metrics.estimatedRevenue)}
                </p>
                <p className="text-[10px] text-emerald-500 mt-1">Estimado baseado no valor máximo configurado</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white/60 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">
              {metrics.leadsThisWeek} leads esta semana
            </span>
            <ArrowUpRight size={14} className="text-emerald-500" />
          </div>
        </div>

        {/* Evolução de Leads */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-5 text-blue-700">
            📈 Novos Leads — Últimos 14 dias
          </h3>
          {trendData.every((d) => d.leads === 0) ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">
              Nenhum lead cadastrado no período selecionado.
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 10 }} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      fontSize: "11px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    name="Leads"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--background)", stroke: "var(--primary)", strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: "var(--primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Distribuição por status */}
        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100 rounded-2xl p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-sm text-purple-700">🎯 Distribuição de Leads por Status</h3>
            {activeFilter && (
              <div className="px-2 py-0.5 rounded-full bg-secondary border border-border text-foreground text-[10px] font-medium flex items-center gap-1.5">
                Filtrando: {activeFilter}
                <button onClick={() => setActiveFilter(null)} className="hover:text-foreground">
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {funnelData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs">
              Nenhum lead cadastrado ainda. Adicione leads no CRM para ver o funil.
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }} barSize={12}>
                  <XAxis type="number" hide domain={[0, "dataMax + 1"]} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={130}
                    tick={{ fill: "var(--foreground)", fontSize: 11, fontWeight: 500 }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.02)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      fontSize: "11px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Leads"
                    radius={[4, 4, 4, 4]}
                    background={{ fill: "rgba(255, 255, 255, 0.02)", radius: 4 }}
                    onClick={(data: any) => toggleFilter(data.name)}
                    cursor="pointer"
                  >
                    {funnelData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={activeFilter && activeFilter !== entry.name ? 0.3 : 1}
                        style={{ transition: "opacity 0.2s ease" }}
                      />
                    ))}
                    <LabelList dataKey="value" position="right" fill="var(--foreground)" fontSize={11} fontWeight={600} offset={8} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <AICampaignCreator onClose={() => setShowAICreator(false)} />
        </div>
      )}

      {/* WhatsApp Webhook Simulator Modal */}
      {showWhatsAppSimulator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <WhatsAppSimulator onClose={() => setShowWhatsAppSimulator(false)} />
        </div>
      )}

      {/* WhatsApp Settings Modal */}
      {showWhatsAppSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <WhatsAppSettings onClose={() => setShowWhatsAppSettings(false)} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, color, isActive, hasActiveFilter, onClick }: any) {
  const colorMap: Record<string, { bg: string; iconBg: string; trendColor: string }> = {
    blue:    { bg: "bg-gradient-to-br from-blue-500 to-blue-600", iconBg: "bg-white/20", trendColor: "text-blue-100" },
    purple:  { bg: "bg-gradient-to-br from-purple-500 to-purple-600", iconBg: "bg-white/20", trendColor: "text-purple-100" },
    emerald: { bg: "bg-gradient-to-br from-emerald-500 to-emerald-600", iconBg: "bg-white/20", trendColor: "text-emerald-100" },
    orange:  { bg: "bg-gradient-to-br from-orange-400 to-orange-500", iconBg: "bg-white/20", trendColor: "text-orange-100" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`${c.bg} text-white p-5 rounded-2xl flex flex-col justify-between cursor-pointer transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
        hasActiveFilter && !isActive ? "opacity-40 scale-95" : "opacity-100"
      } ${isActive ? "ring-2 ring-white/50 scale-[1.02]" : ""}`}
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">{title}</p>
        <div className={`p-2 rounded-xl ${c.iconBg}`}>{icon}</div>
      </div>
      <div>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        <p className={`text-[11px] ${c.trendColor} mt-1.5 flex items-center gap-1 font-medium`}>
          <TrendingUp size={11} />
          {trend}
        </p>
      </div>
    </div>
  );
}
