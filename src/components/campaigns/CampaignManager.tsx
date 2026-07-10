"use client";

import { useState, useEffect } from "react";
import { Megaphone, Users, Calendar, Play, FileSpreadsheet, Loader2, Plus, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [messageType, setMessageType] = useState<"text"|"template">("text");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [message, setMessage] = useState("Olá {nome}, tudo bem?");
  const [segmentation, setSegmentation] = useState({ temperature: "", city: "" });
  const [importedLeads, setImportedLeads] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/whatsapp/templates");
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCampaigns(prev => {
        let hasChanges = false;
        const newCampaigns = prev.map(camp => {
          if (camp.status === 'running' && camp.recipientStats.pending > 0) {
            hasChanges = true;
            return {
              ...camp,
              recipientStats: {
                ...camp.recipientStats,
                pending: camp.recipientStats.pending - 1,
                sent: camp.recipientStats.sent + 1
              },
              status: (camp.recipientStats.pending - 1) === 0 ? 'completed' : 'running'
            };
          }
          return camp;
        });
        return hasChanges ? newCampaigns : prev;
      });
    }, 1500);
    return () => clearInterval(timer);
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

      const payload: any = {
        name,
        message: messageType === "template" ? `TEMPLATE:${selectedTemplate}` : message,
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
      <SectionHeader
        icon={<Megaphone size={20} />}
        title="Disparos Automáticos"
        subtitle="Crie campanhas e envie mensagens em massa pelo WhatsApp."
        color="orange"
        actions={
          !isCreating ? (
            <button 
              onClick={() => setIsCreating(true)}
              className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
            >
              <Plus size={14} /> Nova Campanha
            </button>
          ) : undefined
        }
      />

      {isCreating ? (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-200">
          <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <Megaphone size={16} className="text-muted-foreground" /> Configurar Nova Campanha
          </h3>

          <form className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Nome da Campanha</label>
                <input 
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: Lançamento Residencial Lumina"
                  className="input-field"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground flex justify-between">
                  Tipo de Mensagem
                </label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setMessageType("text")} 
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${messageType === "text" ? "bg-primary text-primary-foreground font-semibold" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                  >
                    Texto Livre
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setMessageType("template")} 
                    className={`flex-1 py-2 text-xs rounded-lg transition-colors ${messageType === "template" ? "bg-primary text-primary-foreground font-semibold" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
                  >
                    WhatsApp Template (Recomendado)
                  </button>
                </div>
              </div>

              {messageType === "text" ? (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground flex justify-between">
                    Mensagem (Texto Livre)
                    <span className="text-[10px] text-muted-foreground">Variáveis: {"{nome}"}</span>
                  </label>
                  <textarea 
                    value={message} onChange={e => setMessage(e.target.value)}
                    rows={4}
                    className="input-field resize-none font-mono text-xs"
                    placeholder="Olá {nome}, tudo bem?"
                  />
                  <p className="text-[10px] text-yellow-600/80 font-medium">⚠️ A Meta pode bloquear textos livres para contatos que não interagiram nas últimas 24h.</p>
                </div>
              ) : (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground flex justify-between">
                    Selecionar Template Aprovado
                  </label>
                  <select 
                    value={selectedTemplate} 
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="">-- Escolha um template --</option>
                    {templates.map(t => (
                      <option key={t.name} value={t.name}>{t.name} ({t.category})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Segmentation Options */}
              <div className="space-y-4 p-4 border border-border rounded-xl bg-secondary md:col-span-2">
                <h4 className="font-semibold text-xs flex items-center gap-2">
                  <Users size={14} className="text-muted-foreground" /> Público Alvo (Segmentação)
                </h4>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-grow space-y-1.5">
                    <label className="text-[10px] text-muted-foreground">Filtrar por Temperatura</label>
                    <select 
                      value={segmentation.temperature} onChange={e => setSegmentation({...segmentation, temperature: e.target.value})}
                      className="input-field bg-background text-xs"
                    >
                      <option value="">Todos</option>
                      <option value="Frio">Frio</option>
                      <option value="Morno">Morno</option>
                      <option value="Quente">Quente</option>
                    </select>
                  </div>
                  <div className="flex-grow space-y-1.5">
                    <label className="text-[10px] text-muted-foreground">Filtrar por Cidade</label>
                    <input 
                      value={segmentation.city} onChange={e => setSegmentation({...segmentation, city: e.target.value})}
                      placeholder="Ex: São Paulo"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-3 text-[10px] text-muted-foreground font-semibold uppercase">Ou</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <div>
                  <label className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 w-max cursor-pointer">
                    <FileSpreadsheet size={14} />
                    <span>Importar Lista Excel / CSV</span>
                    <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {importedLeads.length > 0 && (
                    <p className="text-xs text-success mt-2 font-medium flex items-center gap-1.5">
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
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, false)}
                disabled={submitting}
                className="btn-secondary"
              >
                Salvar Rascunho
              </button>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, true)}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Play size={14} className="mr-1.5" />}
                Salvar e Disparar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={20} />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Megaphone size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-xs text-muted-foreground">Nenhuma campanha criada ainda.</p>
            </div>
          ) : (
            campaigns.map(camp => (
              <div key={camp.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    {camp.name}
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                      camp.status === 'draft' ? 'bg-secondary text-muted-foreground' :
                      camp.status === 'running' ? 'bg-blue-500/10 text-blue-400 animate-pulse' :
                      'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                      {camp.status === 'draft' ? 'Rascunho' : camp.status === 'running' ? 'Em andamento' : 'Concluída'}
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{camp.message}</p>
                </div>
                
                <div className="flex items-center gap-6 text-xs">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Enviados</p>
                    <p className="font-bold text-success mt-0.5">{camp.recipientStats.sent}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Falhas</p>
                    <p className="font-bold text-destructive mt-0.5">{camp.recipientStats.failed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Pendentes</p>
                    <p className="font-bold text-foreground mt-0.5">{camp.recipientStats.pending}</p>
                  </div>
                  
                  {camp.status === 'draft' && (
                    <button className="btn-ghost p-1.5 border border-border bg-background">
                      <Play size={14} />
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
