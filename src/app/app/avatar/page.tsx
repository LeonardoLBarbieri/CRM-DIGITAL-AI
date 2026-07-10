"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GradientButton } from "@/components/ui/GradientButton";
import { Video, RefreshCw, Loader2, AlertCircle, Check, FileText, Sparkles, Download } from "lucide-react";

export default function AvatarPage() {
  const [heygenAvatars, setHeygenAvatars] = useState<{ id: string; name: string; type: string; thumbnail: string | null; ownership: string }[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("");
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [videoScript, setVideoScript] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState("9:16");
  const [videoBackgroundUrl, setVideoBackgroundUrl] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoStatus, setVideoStatus] = useState("");
  const [videoId, setVideoId] = useState<string>("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchHeygenAvatars();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const fetchHeygenAvatars = async () => {
    setLoadingAvatars(true);
    try {
      const res = await fetch("/api/list-avatars");
      const data = await res.json();
      if (data.avatars) {
        setHeygenAvatars(data.avatars);
        if (data.avatars.length > 0 && !selectedAvatarId) {
          setSelectedAvatarId(data.avatars[0].id);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar avatars:", e);
    } finally {
      setLoadingAvatars(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoScript.trim()) return alert("Digite ou cole o roteiro para gerar o vídeo.");

    setVideoLoading(true);
    setVideoStatus("Enviando roteiro para HeyGen...");
    setVideoUrl("");
    setVideoId("");

    if (pollingRef.current) clearInterval(pollingRef.current);

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: videoScript,
          avatarId: selectedAvatarId || undefined,
          aspectRatio: videoAspectRatio,
          backgroundUrl: videoBackgroundUrl || undefined,
        }),
      });
      const data = await response.json();

      if (data.error) {
        alert(data.error);
        setVideoLoading(false);
        setVideoStatus("");
        return;
      }

      const createdVideoId = data.videoId;
      setVideoId(createdVideoId);
      setVideoStatus("Processando vídeo... isso pode levar alguns minutos.");

      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/heygen-video-status?videoId=${createdVideoId}`);
          const statusData = await statusRes.json();

          if (statusData.status === "completed" && statusData.videoUrl) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setVideoUrl(statusData.videoUrl);
            setVideoStatus("Concluído!");
            setVideoLoading(false);
          } else if (statusData.status === "failed") {
            if (pollingRef.current) clearInterval(pollingRef.current);
            alert(`Falha na geração: ${statusData.failureMessage || "Erro desconhecido."}`);
            setVideoStatus("");
            setVideoLoading(false);
          } else {
            const statusMap: Record<string, string> = {
              pending: "Na fila de processamento...",
              processing: "Renderizando vídeo...",
            };
            setVideoStatus(statusMap[statusData.status] || "Processando...");
          }
        } catch {
          console.error("Erro no polling de status");
        }
      }, 10000);
    } catch {
      alert("Erro ao conectar com o servidor para gerar vídeo.");
      setVideoLoading(false);
      setVideoStatus("");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-full">
      <SectionHeader icon={<Video size={24} />} title="Gerar Avatar" subtitle="Crie vídeos hiper-realistas com seu avatar digital via HeyGen." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card-3d p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2"><Video size={20} className="text-cyan-400" /> Escolher Avatar</h2>
              <button onClick={fetchHeygenAvatars} disabled={loadingAvatars} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all" title="Atualizar lista">
                <RefreshCw size={16} className={loadingAvatars ? "animate-spin" : ""} />
              </button>
            </div>

            {loadingAvatars ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-cyan-400" /></div>
            ) : heygenAvatars.length === 0 ? (
              <div className="text-center py-6 bg-secondary/30 rounded-xl border border-border/40">
                <AlertCircle size={28} className="mx-auto mb-2 text-yellow-400" />
                <p className="text-sm font-medium">Nenhum avatar encontrado.</p>
                <p className="text-xs text-muted-foreground mt-1">Verifique sua chave de API ou crie um avatar na plataforma HeyGen.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                {heygenAvatars.map((avatar) => (
                  <div key={avatar.id} onClick={() => setSelectedAvatarId(avatar.id)} className={`relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${selectedAvatarId === avatar.id ? "border-purple-500 shadow-lg shadow-purple-500/20" : "border-border hover:border-purple-500/50"}`}>
                    {avatar.thumbnail ? (
                      <img src={avatar.thumbnail} alt={avatar.name} className="w-full aspect-[3/4] object-cover" />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-secondary/50 flex items-center justify-center"><Video size={24} className="text-muted-foreground opacity-50" /></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1.5">
                      <p className="text-xs font-medium text-white truncate">{avatar.name}</p>
                      <p className="text-[10px] text-gray-300 capitalize">{avatar.ownership === "private" ? "🎯 Meu Avatar" : "📦 Stock"}</p>
                    </div>
                    {selectedAvatarId === avatar.id && <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-0.5"><Check size={12} className="text-white" /></div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card-3d p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileText size={20} className="text-purple-400" /> Roteiro do Vídeo</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Texto que o avatar vai falar</label>
                <textarea value={videoScript} onChange={(e) => setVideoScript(e.target.value)} className="input-field h-36 resize-none text-sm" placeholder="Cole aqui o roteiro..." />
                <p className="text-xs text-muted-foreground text-right">{videoScript.length} caracteres</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Proporção do Vídeo</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{ label: "9:16", desc: "Reels/Stories" }, { label: "16:9", desc: "YouTube" }, { label: "1:1", desc: "Feed" }].map((ratio) => (
                    <button key={ratio.label} type="button" onClick={() => setVideoAspectRatio(ratio.label)} className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${videoAspectRatio === ratio.label ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-border hover:border-purple-500/50"}`}>
                      <div>{ratio.label}</div>
                      <div className="text-xs text-muted-foreground font-normal">{ratio.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cenário de Fundo (Opcional)</label>
                <input type="url" value={videoBackgroundUrl} onChange={(e) => setVideoBackgroundUrl(e.target.value)} className="input-field" placeholder="URL da imagem..." />
                <p className="text-xs text-muted-foreground text-purple-300">Dica: Cole o link de uma foto para o seu Avatar aparecer na frente do apartamento.</p>
              </div>

              <GradientButton onClick={handleGenerateVideo} disabled={!videoScript.trim()} loading={videoLoading} loadingText={videoStatus || "Processando..."} variant="primary" size="lg">
                <Sparkles size={20} /> Gerar Vídeo com Meu Avatar
              </GradientButton>

              {videoLoading && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                  <p className="text-sm text-purple-300">{videoStatus}</p>
                </div>
              )}
            </div>
          </div>

          {videoUrl && (
            <div className="glass-card-3d p-6 border-purple-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-lg flex items-center gap-2 text-purple-400"><Check size={18} /> Vídeo Gerado com Sucesso</p>
                <a href={videoUrl} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors bg-secondary px-3 py-1.5 rounded-lg"><Download size={14} /> Baixar MP4</a>
              </div>
              <div className={`bg-black/40 rounded-xl overflow-hidden border border-border/50 flex items-center justify-center mx-auto ${videoAspectRatio === "9:16" ? "max-w-xs aspect-[9/16]" : videoAspectRatio === "1:1" ? "max-w-md aspect-square" : "aspect-video"}`}>
                <video controls src={videoUrl} className="w-full h-full object-contain" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card-3d p-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><Check size={18} className="text-green-400" /> Passo a Passo</h3>
            <ul className="space-y-4 text-sm">
              {[
                { n: "1", text: "Crie uma conta na HeyGen e treine seu avatar com um vídeo de 2 minutos." },
                { n: "2", text: "Verifique se HEYGEN_API_KEY está configurada no .env.local." },
                { n: "3", text: "Clique em atualizar para carregar seus avatars." },
                { n: "4", text: "Cole ou gere um roteiro e clique em Gerar Vídeo." },
                { n: "5", text: "Aguarde o processamento." },
              ].map(step => (
                <li key={step.n} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{step.n}</div>
                  <p className="text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ul>
          </div>
          {selectedAvatarId && (
            <div className="glass-panel rounded-2xl p-4 border-green-500/20">
              <p className="text-xs text-muted-foreground mb-1">Avatar selecionado</p>
              <p className="text-sm font-medium text-green-400 truncate">{heygenAvatars.find(a => a.id === selectedAvatarId)?.name || selectedAvatarId}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono truncate opacity-60">{selectedAvatarId}</p>
            </div>
          )}
          {videoId && (
            <div className="glass-panel rounded-2xl p-4 border-purple-500/20">
              <p className="text-xs text-muted-foreground mb-1">ID do vídeo em processamento</p>
              <p className="text-xs font-mono text-purple-400 break-all">{videoId}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
