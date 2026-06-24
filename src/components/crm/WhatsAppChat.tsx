"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Check, CheckCheck, Loader2, Sparkles, Bot, X } from "lucide-react";
import type { WhatsAppMessage } from "@prisma/client";

interface WhatsAppChatProps {
  leadId: string;
  phone: string | null;
  leadName: string;
}

export function WhatsAppChat({ leadId, phone, leadName }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    if (leadId) {
      fetchMessages();
      // Optional: Polling could be added here
    }
  }, [leadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // Create an API route specifically to fetch messages for a lead
      const res = await fetch(`/api/whatsapp/messages?leadId=${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !phone) return;

    setSending(true);
    const tempId = Date.now().toString();
    const newMsg: any = {
      id: tempId,
      leadId,
      body: input.trim(),
      sender: "system",
      status: "enviada",
      timestamp: new Date(),
    };
    
    // Optimistic update
    setMessages((prev) => [...prev, newMsg]);
    const messageToSend = input.trim();
    setInput("");

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          message: messageToSend,
          leadId,
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to send");
      }
      
      // Refresh to get actual DB record
      fetchMessages();
    } catch (e) {
      console.error(e);
      // Remove optimistic message or mark as failed
      setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, status: "falha" } : m));
    } finally {
      setSending(false);
    }
  };

  const handleAIAssist = async (type: string) => {
    setShowAiMenu(false);
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, leadId })
      });
      if (res.ok) {
        const data = await res.json();
        setInput(data.content || "");
      } else {
        alert("Erro ao gerar mensagem com IA");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar mensagem com IA");
    } finally {
      setGeneratingAi(false);
    }
  };

  if (!phone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-card/50 text-muted-foreground p-6 text-center border rounded-xl">
        <p>Este lead não possui um número de WhatsApp cadastrado.</p>
        <p className="text-sm mt-2">Atualize o número na aba de detalhes para enviar mensagens.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] rounded-xl overflow-hidden border border-border relative">
      {/* WhatsApp Header */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-4 py-3 flex items-center gap-3 border-b border-border z-10">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold overflow-hidden shrink-0">
          {leadName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-[#111b21] dark:text-[#e9edef] text-sm">{leadName}</h3>
          <p className="text-xs text-[#667781] dark:text-[#8696a0]">{phone}</p>
        </div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-5 pointer-events-none" style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/yl/r/r_Q_5i2FWqO.png')" }}></div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 z-10 flex flex-col">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-[#fff9c4] dark:bg-[#182229] text-[#111b21] dark:text-[#8696a0] text-xs py-2 px-4 rounded-xl mx-auto shadow-sm">
            As mensagens enviadas para este lead aparecerão aqui.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === "system";
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}>
                <div 
                  className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm shadow-sm relative ${
                    isMe 
                      ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none" 
                      : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="whitespace-pre-wrap leading-relaxed">{msg.body}</span>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-black/40 dark:text-white/40">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <span className="text-black/40 dark:text-white/40">
                          {msg.status === "lida" ? (
                            <CheckCheck size={14} className="text-[#53bdeb]" />
                          ) : msg.status === "entregue" ? (
                            <CheckCheck size={14} />
                          ) : msg.status === "falha" ? (
                            <span className="text-red-500">Erro</span>
                          ) : (
                            <Check size={14} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      {generatingAi && (
        <div className="absolute bottom-16 left-0 right-0 bg-blue-500/10 text-blue-500 text-xs py-2 px-4 flex items-center justify-center gap-2 border-t border-blue-500/20 backdrop-blur-md z-20">
          <Loader2 size={14} className="animate-spin" /> IA gerando mensagem...
        </div>
      )}
      <div className="relative z-10">
        <AnimateAiMenu show={showAiMenu} onSelect={handleAIAssist} onClose={() => setShowAiMenu(false)} />
        <form onSubmit={handleSend} className="bg-[#f0f2f5] dark:bg-[#202c33] p-3 flex gap-2 items-center border-t border-border relative">
          <button
            type="button"
            onClick={() => setShowAiMenu(!showAiMenu)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${showAiMenu ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <Sparkles size={20} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma mensagem"
            className="flex-1 bg-white dark:bg-[#2a3942] text-[#111b21] dark:text-[#e9edef] border-none rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 shadow-sm"
            disabled={sending || generatingAi}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || sending || generatingAi}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#00a884] hover:bg-[#008f6f] text-white transition-colors disabled:opacity-50 shrink-0 shadow-sm"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function AnimateAiMenu({ show, onSelect, onClose }: { show: boolean, onSelect: (type: string) => void, onClose: () => void }) {
  if (!show) return null;
  return (
    <div className="absolute bottom-full left-4 mb-2 w-64 bg-card border border-border shadow-xl rounded-xl p-2 z-50 animate-in slide-in-from-bottom-2 fade-in">
      <div className="flex justify-between items-center px-2 mb-2 pb-2 border-b border-border/50">
        <span className="text-xs font-semibold text-blue-500 flex items-center gap-1"><Bot size={14} /> Assistente IA</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
      </div>
      <button onClick={() => onSelect('generate_message')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors">Gerar Saudação</button>
      <button onClick={() => onSelect('followup_message')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors">Mensagem de Follow-up</button>
      <button onClick={() => onSelect('presentation_message')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors">Apresentar Empreendimento</button>
      <button onClick={() => onSelect('summarize_conversation')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-colors mt-1 font-medium border border-transparent hover:border-blue-500/20">Resumir Conversa</button>
    </div>
  );
}
