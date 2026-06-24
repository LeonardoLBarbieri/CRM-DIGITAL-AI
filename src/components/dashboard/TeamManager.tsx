"use client";

import { useState, useEffect } from "react";
import { Users, Mail, UserPlus, ChevronDown } from "lucide-react";

export function TeamManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUsers, resLeads] = await Promise.all([
        fetch("/api/users").then(r => r.json()),
        fetch("/api/leads").then(r => r.json())
      ]);
      if (resUsers.users) setUsers(resUsers.users);
      if (resLeads.leads) setLeads(resLeads.leads);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const assignLead = async (leadId: string, brokerId: string) => {
    try {
      await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, brokerId }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Carregando equipe...</div>;

  const brokers = users.filter(u => u.role === "CORRETOR");

  return (
    <div className="space-y-6 mt-8">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Users size={20} className="text-blue-500" /> Distribuição de Leads
      </h3>
      
      <div className="glass-panel rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-black/10">
              <th className="p-4 font-medium text-muted-foreground">Nome do Lead</th>
              <th className="p-4 font-medium text-muted-foreground">Status</th>
              <th className="p-4 font-medium text-muted-foreground">Corretor Atribuído</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-b border-border/20 hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-foreground">{lead.name}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                    {lead.status}
                  </span>
                </td>
                <td className="p-4">
                  <select
                    className="bg-neutral-900 border border-neutral-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    value={lead.brokerId || ""}
                    onChange={(e) => assignLead(lead.id, e.target.value)}
                  >
                    <option value="">Não atribuído</option>
                    {brokers.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-muted-foreground">Nenhum lead encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
