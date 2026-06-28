"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Target, Megaphone, CheckCircle2, AlertCircle, RefreshCw, X, Image as ImageIcon, Smartphone } from "lucide-react";

interface AICampaignCreatorProps {
  onClose?: () => void;
}

export function AICampaignCreator({ onClose }: AICampaignCreatorProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedAd(null);
    setPublished(false);

    try {
      const res = await fetch("/api/ai/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedAd(data);
      } else {
        alert("Erro ao gerar campanha. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedAd) return;
    setIsPublishing(true);

    try {
      const res = await fetch("/api/meta/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedAd),
      });

      if (res.ok) {
        setPublished(true);
      } else {
        alert("Erro ao publicar na Meta. Verifique suas credenciais.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-secondary/20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight text-gradient">Tráfego Guiado por IA</h2>
            <p className="text-xs text-muted-foreground">Meta Ads com Advantage+ e Qualificação</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Side: Prompt & Chat */}
        <div className="flex-1 flex flex-col border-r border-border/50 bg-black/20">
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="bg-purple-500/10 border border-purple-500/20 text-purple-200 p-4 rounded-xl text-sm leading-relaxed">
              Olá! Sou seu <strong>Assistente de Tráfego</strong>. Diga-me o que você quer vender e eu crio a campanha completa no Facebook/Instagram.
              <br/><br/>
              <em>Exemplo: "Quero anunciar apartamentos de luxo no Itaim Bibi, R$ 2.5 milhões, focando em médicos investidores. O orçamento é R$ 50/dia."</em>
            </div>

            {prompt && isGenerating && (
              <div className="flex justify-end">
                <div className="bg-primary text-white p-3 rounded-xl rounded-tr-none max-w-[85%] text-sm">
                  {prompt}
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex gap-3 items-center text-muted-foreground text-sm p-2">
                <RefreshCw size={16} className="animate-spin text-purple-400" />
                <span>Analisando mercado e escrevendo copy de alta conversão...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleGenerate} className="p-4 border-t border-border/50 bg-background/50">
            <div className="relative flex items-center">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva seu imóvel e público-alvo..."
                className="w-full bg-secondary/50 border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                disabled={isGenerating}
              />
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Ad Preview */}
        <div className="w-full md:w-[400px] flex flex-col bg-background/80 shrink-0">
          {!generatedAd && !isGenerating && (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-60">
                <Megaphone size={48} className="mb-4 opacity-50" />
                <p className="text-sm">A prévia do seu anúncio aparecerá aqui após a geração.</p>
             </div>
          )}

          {isGenerating && (
             <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
          )}

          <AnimatePresence>
            {generatedAd && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col h-full overflow-hidden"
              >
                <div className="p-4 border-b border-border/50 bg-secondary/30 flex items-center gap-2">
                  <Smartphone size={16} className="text-purple-400" />
                  <span className="text-sm font-medium">Prévia do Anúncio (Meta)</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  
                  {/* Targeting Info */}
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider mb-2">
                      <Target size={14} /> Estratégia Advantage+
                    </div>
                    <div className="text-xs space-y-1">
                      <p><strong className="text-muted-foreground">Objetivo:</strong> Mensagens (WhatsApp)</p>
                      <p><strong className="text-muted-foreground">Público:</strong> {generatedAd.audienceNotes}</p>
                      <p><strong className="text-muted-foreground">Orçamento:</strong> R$ {generatedAd.dailyBudget}/dia</p>
                    </div>
                  </div>

                  {/* Facebook Mockup */}
                  <div className="bg-white text-black rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 p-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center font-bold text-xs">SuaLogo</div>
                      <div>
                        <div className="font-bold text-sm leading-none">Sua Imobiliária</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Patrocinado</div>
                      </div>
                    </div>
                    
                    <div className="px-3 pb-3 text-sm whitespace-pre-wrap">
                      {generatedAd.primaryText}
                    </div>

                    <div className="w-full aspect-[4/5] bg-gray-100 flex items-center justify-center relative border-y border-gray-200">
                       <ImageIcon size={48} className="text-gray-300" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                         <p className="text-white text-xs font-medium">*{generatedAd.imagePromptHint}</p>
                       </div>
                    </div>

                    <div className="p-3 bg-gray-50 flex items-center justify-between">
                      <div className="max-w-[70%]">
                        <div className="text-[10px] text-gray-500 uppercase">Chat no WhatsApp</div>
                        <div className="font-bold text-sm truncate">{generatedAd.headline}</div>
                        <div className="text-xs text-gray-500 truncate">{generatedAd.description}</div>
                      </div>
                      <button className="bg-gray-200 text-black font-semibold text-xs px-4 py-2 rounded-lg">
                        Enviar Mensagem
                      </button>
                    </div>
                  </div>

                </div>

                <div className="p-4 border-t border-border/50 bg-background shrink-0 space-y-3">
                  {published ? (
                     <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl flex items-center gap-2 text-sm font-medium justify-center">
                        <CheckCircle2 size={18} />
                        Campanha Publicada com Sucesso!
                     </div>
                  ) : (
                    <>
                      <button 
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                      >
                        {isPublishing ? <RefreshCw size={18} className="animate-spin" /> : <Megaphone size={18} />}
                        {isPublishing ? "Publicando na Meta..." : "Publicar Anúncio Agora"}
                      </button>
                      <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                        <AlertCircle size={10} /> Leads cairão no WhatsApp e serão qualificados pela IA.
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
