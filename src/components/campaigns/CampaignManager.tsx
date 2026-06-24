"use client";

import { useState, useEffect } from "react";
import { Megaphone, Users, Calendar, Play, FileSpreadsheet, Loader2, Plus, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New campaign state
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("Olá {nome}, tudo bem?");
  const [segmentation, setSegmentation] = useState({ temperature: "", city: "" });
  const [importedLeads, setImportedLeads] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      
      // Assume Excel has Name and Phone columns
      const parsed = json.map((row: any) => ({
        name: row.Nome || row.name || row.Name || "Desconhecido",
        phone: row.Telefone || row.phone || row.Phone || row.WhatsApp || ""
      })).filter((l: any) => l.phone);

      setImportedLeads(parsed);
      alert(`${parsed.length} contatos importados com sucesso!`);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent, startNow: boolean) => {
    e.preventDefault();
    if (!name || !message) return alert("Preencha o nome e a mensagem da campanha.");
    
    setSubmitting(true);
    try {
      // 1. If we have imported leads, create them first
      const leadIds: string[] = [];
      if (importedLeads.length > 0) {
        for (const lead of importedLeads) {
          try {
            const res = await fetch("/api/leads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: lead.name, phone: String(lead.phone), status: "Lead Novo" })
            });
            if (res.ok) {
              const data = await res.json();
              leadIds.push(data.id);
            }
          } catch (e) {
            console.error("Failed to import lead", lead);
          }
        }
      }

      // 2. Create the campaign
      const payload: any = {
        name,
        message,
        action: startNow ? "start" : "save"
      };

      if (leadIds.length > 0) {
        payload.recipientLeadIds = leadIds;
      } else if (segmentation.temperature || segmentation.city) {
        payload.segmentation = {};
        if (segmentation.temperature) payload.segmentation.temperature = segmentation.temperature;
        if (segmentation.city) payload.segmentation.city = segmentation.city;
      }

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsCreating(false);
        setName("");
        setMessage("Olá {nome}, tudo bem?");
        setSegmentation({ temperature: "", city: "" });
        setImportedLeads([]);
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao criar campanha");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Disparos Automáticos</h2>
          <p className="text-muted-foreground mt-1">Crie campanhas e envie mensagens em massa pelo WhatsApp.</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> Nova Campanha
          </button>
        )}
      </header>

      {isCreating ? (
        <div className="glass-panel rounded-2xl p-6 border border-blue-500/30 shadow-lg animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-semibold mb-6 text-blue-500 flex items-center gap-2">
            <Megaphone size={20} /> Configurar Nova Campanha
          </h3>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nome da Campanha</label>
                <input 
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: Lançamento Residencial Lumina"
                  className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium flex justify-between">
                  Mensagem
                  <span className="text-xs text-muted-foreground">Variáveis suportadas: {"{nome}"}</span>
                </label>
                <textarea 
                  value={message} onChange={e => setMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-input/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                />
              </div>

              {/* Segmentation Options */}
              <div className="space-y-4 p-4 border border-border rounded-xl bg-secondary/20 md:col-span-2">
                <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                  <Users size={16} className="text-indigo-400" /> Público Alvo (Segmentação)
                </h4>
                
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Filtrar por Temperatura</label>
                    <select 
                      value={segmentation.temperature} onChange={e => setSegmentation({...segmentation, temperature: e.target.value})}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none"
                    >
                      <option value="">Todos</option>
                      <option value="Frio">Frio</option>
                      <option value="Morno">Morno</option>
                      <option value="Quente">Quente</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground">Filtrar por Cidade</label>
                    <input 
                      value={segmentation.city} onChange={e => setSegmentation({...segmentation, city: e.target.value})}
                      placeholder="Ex: São Paulo"
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground font-medium uppercase">Ou</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl px-4 py-3 transition-colors w-max">
                    <FileSpreadsheet size={18} />
                    <span className="text-sm font-medium">Importar Lista do Excel / CSV</span>
                    <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {importedLeads.length > 0 && (
                    <p className="text-xs text-green-500 mt-2 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> {importedLeads.length} contatos prontos para envio.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-6 py-2.5 rounded-xl font-medium hover:bg-secondary transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, false)}
                disabled={submitting}
                className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
              >
                Salvar como Rascunho
              </button>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, true)}
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all text-sm disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                Salvar e Disparar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 bg-secondary/30 rounded-2xl border border-border/40">
              <Megaphone size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">Nenhuma campanha criada ainda.</p>
            </div>
          ) : (
            campaigns.map(camp => (
              <div key={camp.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg flex items-center gap-2">
                    {camp.name}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      camp.status === 'draft' ? 'bg-gray-500/20 text-gray-400' :
                      camp.status === 'running' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {camp.status === 'draft' ? 'Rascunho' : camp.status === 'running' ? 'Em andamento' : 'Concluída'}
                    </span>
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{camp.message}</p>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Enviados</p>
                    <p className="font-bold text-green-500">{camp.recipientStats.sent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Falhas</p>
                    <p className="font-bold text-red-500">{camp.recipientStats.failed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                    <p className="font-bold">{camp.recipientStats.pending}</p>
                  </div>
                  
                  {camp.status === 'draft' && (
                    <button className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 p-2 rounded-lg transition-colors">
                      <Play size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
