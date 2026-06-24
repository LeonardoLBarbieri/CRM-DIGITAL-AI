"use client";

import { useState } from "react";
import { X, Save, User, MapPin, Building, DollarSign, Loader2 } from "lucide-react";
import type { Lead } from "@prisma/client";
import { WhatsAppChat } from "./WhatsAppChat";

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (updatedLead: Partial<Lead>) => Promise<void>;
}

export function LeadDetailModal({ lead, onClose, onSave }: LeadDetailModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({ ...lead });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: any = value;
    if (type === "number") {
      parsedValue = value ? parseFloat(value) : null;
    } else if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Left Side: Form */}
        <div className="flex-1 flex flex-col h-full border-r border-border overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border bg-card/50">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ficha do Cliente</h2>
              <p className="text-sm text-muted-foreground mt-1">Gerencie as informações detalhadas deste lead.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
              <X size={24} />
            </button>
          </div>

          <form id="lead-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Section: Dados Pessoais */}
            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-blue-500">
                <User size={20} /> Dados Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome Completo</label>
                  <input required name="name" value={formData.name || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone / WhatsApp</label>
                  <input name="phone" value={formData.phone || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <input type="email" name="email" value={formData.email || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Classificação (Temperatura)</label>
                  <select name="temperature" value={formData.temperature || "Frio"} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="Frio">Frio (Pouco interesse)</option>
                    <option value="Morno">Morno (Pesquisando)</option>
                    <option value="Quente">Quente (Compra Imediata)</option>
                    <option value="Prioritário">Prioritário (Alto Potencial)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Section: Localização */}
            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-indigo-500">
                <MapPin size={20} /> Localização Atual
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade</label>
                  <input name="city" value={formData.city || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bairro</label>
                  <input name="neighborhood" value={formData.neighborhood || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              </div>
            </section>

            {/* Section: Perfil Financeiro */}
            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-emerald-500">
                <DollarSign size={20} /> Perfil Financeiro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Faixa de Renda</label>
                  <select name="incomeRange" value={formData.incomeRange || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all">
                    <option value="">Selecione...</option>
                    <option value="Até R$ 3.000">Até R$ 3.000</option>
                    <option value="R$ 3.001 a R$ 6.000">R$ 3.001 a R$ 6.000</option>
                    <option value="R$ 6.001 a R$ 10.000">R$ 6.001 a R$ 10.000</option>
                    <option value="Acima de R$ 10.000">Acima de R$ 10.000</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Aprox. Entrada</label>
                  <input type="number" name="downPayment" value={formData.downPayment || ""} onChange={handleChange} placeholder="R$" className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                
                <div className="md:col-span-2 flex gap-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="hasFgts" checked={formData.hasFgts || false} onChange={handleChange} className="w-5 h-5 rounded border-border text-emerald-500 focus:ring-emerald-500" />
                    <span className="text-sm font-medium">Possui FGTS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="creditApproved" checked={formData.creditApproved || false} onChange={handleChange} className="w-5 h-5 rounded border-border text-emerald-500 focus:ring-emerald-500" />
                    <span className="text-sm font-medium">Financiamento Aprovado</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Section: Interesse Imobiliário */}
            <section>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-purple-500">
                <Building size={20} /> Interesse Imobiliário
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Imóvel</label>
                  <select name="propertyType" value={formData.propertyType || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all">
                    <option value="">Selecione...</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Cobertura">Cobertura</option>
                    <option value="Área Privativa">Área Privativa</option>
                    <option value="Lote">Lote</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Região de Interesse</label>
                  <input name="region" value={formData.region || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Empreendimento Específico</label>
                  <input name="development" value={formData.development || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Orçamento / Budget Máx.</label>
                  <input name="budget" value={formData.budget || ""} onChange={handleChange} placeholder="Ex: 500k" className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quartos</label>
                    <input type="number" name="bedrooms" value={formData.bedrooms || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vagas</label>
                    <input type="number" name="parkingSpots" value={formData.parkingSpots || ""} onChange={handleChange} className="w-full bg-input/50 border border-border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <label className="text-sm font-medium">Observações Gerais</label>
              <textarea name="notes" value={formData.notes || ""} onChange={handleChange} rows={4} className="w-full bg-input/50 border border-border rounded-xl px-4 py-3 mt-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"></textarea>
            </section>
          </form>
          
          {/* Footer Save Action */}
          <div className="p-6 border-t border-border bg-card/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-medium hover:bg-secondary transition-colors">
              Cancelar
            </button>
            <button 
              type="submit" 
              form="lead-form"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Alterações
            </button>
          </div>
        </div>

        {/* Right Side: WhatsApp Chat */}
        <div className="w-full md:w-[400px] h-[50vh] md:h-full flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
          <WhatsAppChat leadId={lead.id} phone={lead.phone} leadName={lead.name} />
        </div>

      </div>
    </div>
  );
}
