"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GradientButton } from "@/components/ui/GradientButton";
import { PenTool, Building2, Sparkles, Check, Copy, Mic, Download, Video } from "lucide-react";

export default function RoteiroPage() {
  const [name, setName] = useState("");
  const [features, setFeatures] = useState("");
  const [style, setStyle] = useState("Consultivo & Humano");
  const [format, setFormat] = useState("Instagram Reels (9:16)");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);

  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");

  useEffect(() => {
    // Load default voice
    fetch("/api/list-voices")
      .then(res => res.json())
      .then(data => {
        if (data.configuredVoiceId) setSelectedVoiceId(data.configuredVoiceId);
      })
      .catch(console.error);
  }, []);

  const handleGenerateScript = async () => {
    if (!name || !features) return alert("Por favor, preencha o nome e os diferenciais.");
    setLoading(true);
    setScript("");

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, features, style, format }),
      });
      const data = await response.json();
      if (data.error) alert(data.error);
      else setScript(data.script);
    } catch {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateAudio = async (text: string) => {
    setAudioLoading(true);
    setAudioUrl("");
    setDownloadUrl("");
    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: text,
          voiceId: selectedVoiceId || undefined,
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.2 },
        }),
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAudioUrl(data.audioDataUrl);
        setDownloadUrl(data.downloadUrl || "");
      }
    } catch {
      alert("Erro ao conectar com o servidor para gerar áudio.");
    } finally {
      setAudioLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <SectionHeader
        icon={<PenTool size={20} />}
        title="Novo Anúncio Imobiliário"
        subtitle="Nossa IA criará um roteiro persuasivo e gravará um vídeo 4K hiper-realista."
        color="pink"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card-3d p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-cyan-400" />
              Dados do Empreendimento
            </h2>

            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Empreendimento</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Ex: Residencial Lumina BH"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Principais Diferenciais</label>
                <textarea
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  className="input-field h-32 resize-none"
                  placeholder="Ex: Varanda gourmet, 3 suítes, Rooftop com vista definitiva..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estilo de Abordagem</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="input-field appearance-none"
                  >
                    <option>Consultivo &amp; Humano</option>
                    <option>Agressivo &amp; Urgência</option>
                    <option>Alto Padrão &amp; Exclusividade</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plataforma (Formato)</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="input-field appearance-none"
                  >
                    <option>Instagram Reels (9:16)</option>
                    <option>Facebook Feed (4:5)</option>
                    <option>YouTube (16:9)</option>
                  </select>
                </div>
              </div>

              <GradientButton
                onClick={handleGenerateScript}
                loading={loading}
                loadingText="Criando mágica..."
                variant="primary"
                size="lg"
              >
                <Sparkles size={20} className="group-hover:animate-pulse" />
                Gerar Roteiro Persuasivo
              </GradientButton>
            </form>
          </div>

          {/* Script Result */}
          {script && (
            <div className="glass-card-3d p-6 border-purple-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-purple-400">Roteiro Gerado</h3>
                <button
                  onClick={copyToClipboard}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-secondary rounded-lg"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
              </div>
              <div className="bg-black/20 rounded-xl p-4 whitespace-pre-wrap font-medium text-foreground/90 leading-relaxed border border-border/50 mb-6">
                {script}
              </div>

              <GradientButton
                onClick={() => handleGenerateAudio(script)}
                loading={audioLoading}
                loadingText="Clonando Voz..."
                variant="creative"
              >
                <Mic size={20} className="group-hover:scale-110 transition-transform" />
                Gerar Áudio com Minha Voz
              </GradientButton>

              {audioUrl && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium flex items-center gap-2 text-purple-400">
                      <Check size={16} /> Áudio Gerado com Sucesso
                    </p>
                    {downloadUrl && (
                      <a
                        href={downloadUrl}
                        download
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <Download size={14} /> Baixar MP3
                      </a>
                    )}
                  </div>
                  <div className="audio-player-wrapper">
                    <audio controls src={audioUrl} className="w-full" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="glass-card-3d p-6 relative overflow-hidden h-[500px] flex flex-col items-center justify-center text-center border-dashed border-2 border-border/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5" />
            <Video size={48} className="text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-medium text-lg mb-2">Preview do Avatar</h3>
            <p className="text-sm text-muted-foreground px-4">
              O roteiro gerado será interpretado pelo Avatar de Leonardo Barbieri nesta tela.
            </p>

            <div className="absolute bottom-6 left-0 right-0 px-6">
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-0 transition-all duration-500"></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Aguardando roteiro...</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
