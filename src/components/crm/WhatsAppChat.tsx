"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Check, CheckCheck, Loader2, Sparkles, Bot, X, RefreshCw } from "lucide-react";
import type { WhatsAppMessage } from "@prisma/client";

interface WhatsAppChatProps {
  leadId: string;
  phone: string | null;
  leadName: string;
}

const POLL_INTERVAL = 10_000;

export function WhatsAppChat({ leadId, phone, leadName }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async (showLoader = false) => {
    if (!leadId) return;
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/messages?leadId=${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      fetchMessages(true);
      pollRef.current = setInterval(() => {
        fetchMessages(false);
      }, POLL_INTERVAL);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [leadId, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !phone) return;

    setSending(true);
    const tempId = Date.now().toString();
    const messageToSend = input.trim();

    const newMsg: any = {
      id: tempId,
      leadId,
      body: messageToSend,
      sender: "system",
      status: "enviada",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          message: messageToSend,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao enviar mensagem");
      }

      await fetchMessages(false);
    } catch (e: any) {
      console.error("Erro ao enviar:", e);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: "erro" } : m
        )
      );
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
        body: JSON.stringify({ type, leadId }),
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-full text-muted-foreground">
        <p className="text-sm font-medium">Sem WhatsApp Cadastrado</p>
        <p className="text-xs mt-1">Atualize o número para enviar mensagens.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="bg-card px-4 py-3 flex items-center gap-3 border-b border-border z-10">
        <div className="w-9 h-9 bg-secondary rounded-full flex items-center justify-center text-foreground font-semibold text-sm shrink-0 border border-border">
          {leadName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{leadName}</h3>
          <p className="text-xs text-muted-foreground">{phone}</p>
        </div>
        <button
          onClick={() => fetchMessages(true)}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="Atualizar mensagens"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 z-10 flex flex-col bg-secondary/10">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-secondary text-muted-foreground text-xs py-2 px-4 rounded-lg mx-auto border border-border">
            As mensagens enviadas para este lead aparecerão aqui.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === "system" || msg.sender === "broker";
            const isAutomated = (msg as any).isAutomated;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-card text-foreground border border-border rounded-tl-sm"
                  }`}
                >
                  <div className="flex flex-col">
                    {isAutomated && (
                      <span className="text-[10px] opacity-70 font-medium flex items-center gap-1 mb-1">
                        <Bot size={10} /> IA Assistente
                      </span>
                    )}
                    <span className="whitespace-pre-wrap leading-relaxed">{msg.body}</span>
                    <div className="flex items-center justify-end gap-1.5 mt-1.5">
                      <span className="text-[10px] opacity-60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <span className="opacity-80">
                          {msg.status === "lida" ? (
                            <CheckCheck size={12} className="text-blue-400" />
                          ) : msg.status === "entregue" ? (
                            <CheckCheck size={12} />
                          ) : msg.status === "erro" ? (
                            <span className="text-destructive text-[10px] font-medium">Erro</span>
                          ) : (
                            <Check size={12} />
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

      {generatingAi && (
        <div className="absolute bottom-16 left-0 right-0 bg-secondary/80 text-foreground text-xs py-2 px-4 flex items-center justify-center gap-2 border-t border-border backdrop-blur-md z-20">
          <Loader2 size={14} className="animate-spin" /> IA gerando mensagem...
        </div>
      )}

      {/* Input */}
      <div className="relative z-10">
        <AnimateAiMenu show={showAiMenu} onSelect={handleAIAssist} onClose={() => setShowAiMenu(false)} />
        <form onSubmit={handleSend} className="bg-card p-3 flex gap-2 items-center border-t border-border">
          <button
            type="button"
            onClick={() => setShowAiMenu(!showAiMenu)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 border ${showAiMenu ? 'bg-primary text-primary-foreground border-transparent' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}
          >
            <Sparkles size={16} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-background text-foreground border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            disabled={sending || generatingAi}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending || generatingAi}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground transition-all disabled:opacity-50 shrink-0"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function AnimateAiMenu({ show, onSelect, onClose }: { show: boolean, onSelect: (type: string) => void, onClose: () => void }) {
  if (!show) return null;
  return (
    <div className="absolute bottom-full left-3 mb-2 w-64 bg-popover border border-border shadow-lg rounded-xl p-2 z-50 animate-in slide-in-from-bottom-2 fade-in">
      <div className="flex justify-between items-center px-2 mb-2 pb-2 border-b border-border">
        <span className="text-xs font-semibold flex items-center gap-1.5"><Bot size={14} /> Assistente IA</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={14} /></button>
      </div>
      <div className="space-y-1">
        <button onClick={() => onSelect('generate_message')} className="w-full text-left px-3 py-2 text-xs font-medium rounded-md hover:bg-secondary transition-colors">Gerar Saudação</button>
        <button onClick={() => onSelect('followup_message')} className="w-full text-left px-3 py-2 text-xs font-medium rounded-md hover:bg-secondary transition-colors">Mensagem de Follow-up</button>
        <button onClick={() => onSelect('presentation_message')} className="w-full text-left px-3 py-2 text-xs font-medium rounded-md hover:bg-secondary transition-colors">Apresentar Empreendimento</button>
      </div>
    </div>
  );
}
