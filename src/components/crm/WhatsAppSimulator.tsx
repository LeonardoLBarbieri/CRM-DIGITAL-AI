"use client";

import { useState } from "react";
import { MessageSquare, X, Send, CheckCircle2 } from "lucide-react";

interface WhatsAppSimulatorProps {
  onClose: () => void;
}

export default function WhatsAppSimulator({ onClose }: WhatsAppSimulatorProps) {
  const [name, setName] = useState("Leonardo Teste");
  const [phone, setPhone] = useState("5531982820976");
  const [message, setMessage] = useState(
    "Olá, vi seu anúncio. Gostaria de saber mais sobre a cobertura em Moema. Meu orçamento é de R$ 2.5 milhões."
  );
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    // Limpa formatação básica de telefone
    const cleanPhone = phone.replace(/\D/g, "");

    // Payload idêntico ao que a Meta Cloud API envia
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "15556599920",
                  phone_number_id: "1196038610259888"
                },
                contacts: [
                  {
                    profile: { name },
                    wa_id: cleanPhone
                  }
                ],
                messages: [
                  {
                    from: cleanPhone,
                    id: `wamid.HBgLNTUzMTk4MjgyMDk3Ng==_${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: { body: message },
                    type: "text"
                  }
                ]
              },
              field: "messages"
            }
          ]
        }
      ]
    };

    try {
      const res = await fetch("/api/whatsapp/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Erro na simulação do Webhook");
      }

      await res.json();
      setResponse({
        success: true,
        message: "Mensagem recebida pelo Webhook!",
        status: "Lead processado no banco de dados e qualificado."
      });
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all"
      >
        <X size={18} />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <MessageSquare size={22} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">Simulador de WhatsApp</h3>
          <p className="text-xs text-zinc-400">Envie mensagens locais para testar a IA</p>
        </div>
      </div>

      {!response ? (
        <form onSubmit={handleSimulate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nome do Lead</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">WhatsApp do Lead</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Mensagem do Lead</label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white py-3 rounded-2xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send size={15} />
                Disparar Mensagem Local
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="text-center py-6 space-y-4">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 animate-bounce">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h4 className="font-bold text-white text-base">{response.message}</h4>
            <p className="text-xs text-zinc-400 mt-1">{response.status}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left">
            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1">Simulado com Sucesso</p>
            <p className="text-xs text-zinc-300">
              O lead <strong>{name}</strong> foi cadastrado e qualificado. Vá até a aba <strong>CRM</strong> no painel lateral para ver o card dele!
            </p>
          </div>
          <button
            onClick={() => setResponse(null)}
            className="text-xs text-emerald-400 hover:underline font-medium"
          >
            Simular outra mensagem
          </button>
        </div>
      )}
    </div>
  );
}
