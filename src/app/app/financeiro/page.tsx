"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GradientButton } from "@/components/ui/GradientButton";
import { DollarSign, Loader2, Trash2, ArrowUpCircle, ArrowDownCircle, TrendingUp, AlertCircle, Plus, BarChart3 } from "lucide-react";

interface Commission {
  id: string;
  description: string;
  amount: number;
  type: string;
  date: string;
  createdAt: string;
}

export default function FinanceiroPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [commDesc, setCommDesc] = useState("");
  const [commAmount, setCommAmount] = useState("");
  const [commType, setCommType] = useState("income");
  const [commDate, setCommDate] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyGoal, setMonthlyGoal] = useState("15000");

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    setCommLoading(true);
    try {
      const res = await fetch("/api/commissions");
      if (res.ok) setCommissions(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setCommLoading(false);
    }
  };

  const handleAddCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commDesc || !commAmount) return;
    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: commDesc, amount: commAmount, type: commType, date: commDate }),
      });
      if (res.ok) {
        setCommDesc("");
        setCommAmount("");
        fetchCommissions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCommission = async (id: string) => {
    try {
      await fetch("/api/commissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchCommissions();
    } catch (e) {
      console.error(e);
    }
  };

  const income = commissions.filter(c => c.type === "income").reduce((s, c) => s + c.amount, 0);
  const expense = commissions.filter(c => c.type === "expense").reduce((s, c) => s + c.amount, 0);
  const balance = income - expense;
  const goal = parseFloat(monthlyGoal) || 0;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const incomeThisMonth = commissions.filter(c => c.type === "income" && c.date === currentMonth).reduce((s, c) => s + c.amount, 0);
  const progressPct = goal > 0 ? Math.min((incomeThisMonth / goal) * 100, 100) : 0;
  const reserveSuggested = income * 0.30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <SectionHeader
        icon={<DollarSign size={20} />}
        title="Gestão Financeira"
        subtitle="Controle suas comissões, gastos e planeje sua reserva de emergência."
        color="emerald"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-xs text-white/80 font-semibold uppercase tracking-wide mb-1">Total Recebido</p>
          <p className="text-2xl font-bold">R$ {income.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p>
          <ArrowUpCircle size={16} className="text-white/60 mt-2" />
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-xs text-white/80 font-semibold uppercase tracking-wide mb-1">Total Gasto</p>
          <p className="text-2xl font-bold">R$ {expense.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p>
          <ArrowDownCircle size={16} className="text-white/60 mt-2" />
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-xs text-white/80 font-semibold uppercase tracking-wide mb-1">Saldo Atual</p>
          <p className="text-2xl font-bold">R$ {balance.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p>
          <TrendingUp size={16} className="text-white/60 mt-2" />
        </div>
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl p-5 shadow-lg">
          <p className="text-xs text-white/80 font-semibold uppercase tracking-wide mb-1">Reserva Ideal (30%)</p>
          <p className="text-2xl font-bold">R$ {reserveSuggested.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p>
          <AlertCircle size={16} className="text-white/60 mt-2" />
        </div>
      </div>

      {/* Monthly Goal Bar */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold text-sm text-emerald-700">🎯 Meta do Mês Atual</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">R$</span>
            <input
              type="number"
              value={monthlyGoal}
              onChange={e => setMonthlyGoal(e.target.value)}
              className="input-field !w-28 py-1 text-sm"
            />
          </div>
        </div>
        <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              progressPct >= 100 ? "bg-green-500" : progressPct >= 60 ? "bg-purple-500" : "bg-yellow-500"
            }`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>R$ {incomeThisMonth.toLocaleString("pt-BR", {minimumFractionDigits: 2})} recebidos</span>
          <span>{progressPct.toFixed(0)}% da meta</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Commission Form */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700">
            <div className="p-1.5 rounded-lg bg-green-500 text-white"><Plus size={14} /></div> Registrar Entrada / Saída
          </h2>
          <form onSubmit={handleAddCommission} className="space-y-4">
            <div className="flex gap-2">
              <button type="button" onClick={() => setCommType("income")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${commType === "income" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-secondary text-muted-foreground"}`}>
                + Entrada
              </button>
              <button type="button" onClick={() => setCommType("expense")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${commType === "expense" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-secondary text-muted-foreground"}`}>
                - Saída
              </button>
            </div>
            <input
              type="text"
              placeholder="Descrição (ex: Comissão Apt 203)"
              value={commDesc}
              onChange={e => setCommDesc(e.target.value)}
              className="input-field"
            />
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Valor (R$)"
                value={commAmount}
                onChange={e => setCommAmount(e.target.value)}
                className="input-field flex-1"
              />
              <input
                type="month"
                value={commDate}
                onChange={e => setCommDate(e.target.value)}
                className="input-field flex-1"
              />
            </div>
            <GradientButton type="submit" variant="primary" size="md">
              <DollarSign size={16} /> Registrar
            </GradientButton>
          </form>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <div className="p-1.5 rounded-lg bg-blue-500 text-white"><BarChart3 size={14} /></div> Histórico de Lançamentos
          </h2>
          {commLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : commissions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <DollarSign size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum lançamento ainda.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {commissions.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.description}</p>
                    <p className="text-xs text-muted-foreground">{c.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${c.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {c.type === "income" ? "+" : "-"} R$ {c.amount.toLocaleString("pt-BR", {minimumFractionDigits: 2})}
                    </span>
                    <button onClick={() => handleDeleteCommission(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
