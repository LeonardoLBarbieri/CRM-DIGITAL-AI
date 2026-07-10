"use client";

import { useState } from "react";
import { X, Save, User, MapPin, Building, DollarSign, Loader2, Trash2 } from "lucide-react";
import type { Lead } from "@prisma/client";
import { WhatsAppChat } from "./WhatsAppChat";

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (updatedLead: Partial<Lead>) => Promise<void>;
  onDelete?: (leadId: string) => Promise<void>;
}

export function LeadDetailModal({ lead, onClose, onSave, onDelete }: LeadDetailModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({ ...lead });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "finance" | "property">("details");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    if (type === "number") parsedValue = value ? parseFloat(value) : null;
    else if (type === "checkbox") parsedValue = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar o lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-background border border-border w-full max-w-6xl h-[85vh] rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Left Side: Form */}
        <div className="flex-1 flex flex-col h-full border-r border-border overflow-hidden bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{lead.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Editando informações do contato</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="flex border-b border-border px-5 gap-6">
            <button 
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('details')}
            >
              Detalhes
            </button>
            <button 
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'finance' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('finance')}
            >
              Financeiro
            </button>
            <button 
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'property' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab('property')}
            >
              Interesse Imobiliário
            </button>
          </div>

          <form id="lead-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Nome Completo</label>
                    <input required name="name" value={formData.name || ""} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Telefone / WhatsApp</label>
                    <input name="phone" value={formData.phone || ""} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">E-mail</label>
                    <input type="email" name="email" value={formData.email || ""} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Classificação (Temperatura)</label>
                    <select name="temperature" value={formData.temperature || "Frio"} onChange={handleChange} className="input-field bg-background">
                      <option value="Frio">Frio</option>
                      <option value="Morno">Morno</option>
                      <option value="Quente">Quente</option>
                      <option value="Prioritário">Prioritário</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Cidade</label>
                    <input name="city" value={formData.city || ""} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Bairro</label>
                    <input name="neighborhood" value={formData.neighborhood || ""} onChange={handleChange} className="input-field" />
                  </div>
                </div>
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-medium text-muted-foreground">Observações Gerais</label>
                  <textarea name="notes" value={formData.notes || ""} onChange={handleChange} rows={4} className="input-field resize-none"></textarea>
                </div>
              </div>
            )}

            {activeTab === 'finance' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Faixa de Renda</label>
                    <select name="incomeRange" value={formData.incomeRange || ""} onChange={handleChange} className="input-field bg-background">
                      <option value="">Selecione...</option>
                      <option value="Até R$ 3.000">Até R$ 3.000</option>
                      <option value="R$ 3.001 a R$ 6.000">R$ 3.001 a R$ 6.000</option>
                      <option value="R$ 6.001 a R$ 10.000">R$ 6.001 a R$ 10.000</option>
                      <option value="Acima de R$ 10.000">Acima de R$ 10.000</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Valor Aprox. Entrada</label>
                    <input type="number" name="downPayment" value={formData.downPayment || ""} onChange={handleChange} placeholder="R$" className="input-field" />
                  </div>
                  <div className="col-span-2 flex flex-col gap-3 mt-2 bg-secondary p-4 rounded-lg border border-border">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="hasFgts" checked={formData.hasFgts || false} onChange={handleChange} className="w-4 h-4 rounded border-border text-primary" />
                      <span className="text-sm font-medium">Possui saldo FGTS</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="creditApproved" checked={formData.creditApproved || false} onChange={handleChange} className="w-4 h-4 rounded border-border text-primary" />
                      <span className="text-sm font-medium">Financiamento já aprovado</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'property' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tipo de Imóvel</label>
                    <select name="propertyType" value={formData.propertyType || ""} onChange={handleChange} className="input-field bg-background">
                      <option value="">Selecione...</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Cobertura">Cobertura</option>
                      <option value="Área Privativa">Área Privativa</option>
                      <option value="Lote">Lote</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Região de Interesse</label>
                    <input name="region" value={formData.region || ""} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Empreendimento Específico</label>
                    <input name="development" value={formData.development || ""} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Orçamento / Budget Máx.</label>
                    <input name="budget" value={formData.budget || ""} onChange={handleChange} placeholder="Ex: 500k" className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Quartos</label>
                    <input type="number" name="bedrooms" value={formData.bedrooms || ""} onChange={handleChange} className="input-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Vagas</label>
                    <input type="number" name="parkingSpots" value={formData.parkingSpots || ""} onChange={handleChange} className="input-field" />
                  </div>
                </div>
              </div>
            )}
          </form>
          
          {/* Footer Save Action */}
          <div className="p-4 border-t border-border flex justify-between gap-3 items-center">
            {onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.")) {
                    await onDelete(lead.id);
                  }
                }}
                className="btn-ghost text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={16} className="mr-2" />
                Excluir
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost">
                Cancelar
              </button>
              <button 
                type="submit" 
                form="lead-form"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: WhatsApp Chat */}
        <div className="w-full md:w-[450px] h-[50vh] md:h-full flex flex-col bg-secondary border-l border-border">
          <WhatsAppChat leadId={lead.id} phone={lead.phone} leadName={lead.name} />
        </div>
      </div>
    </div>
  );
}
