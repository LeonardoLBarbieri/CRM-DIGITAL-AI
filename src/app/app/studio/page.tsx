"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GradientButton } from "@/components/ui/GradientButton";
import { Image as ImageIcon, Video, Upload, X, Download } from "lucide-react";

export default function StudioPage() {
  const [studioPrompt, setStudioPrompt] = useState("Render 3D fotorrealista de uma sala de estar de alto padrão, ampla, com varanda gourmet e vista para a cidade no entardecer.");
  const [studioImageUrl, setStudioImageUrl] = useState("");
  const [studioVideoUrl, setStudioVideoUrl] = useState("");
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioLoadingVideo, setStudioLoadingVideo] = useState(false);
  const [studioBaseImage, setStudioBaseImage] = useState<string | null>(null);
  const studioImageRef = useRef<HTMLInputElement>(null);

  const handleStudioImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setStudioBaseImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
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
        icon={<ImageIcon size={24} />}
        title="Studio 3D & Social Planner"
        subtitle="Gere renders fotorrealistas de plantas e ideias de conteúdo usando IA."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="glass-card-3d p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-purple-400" />
              Gerar Render Fotorrealista
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Descreva como deve ser o render ou envie a planta/referência.</p>
            
            {studioBaseImage && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden mb-4 border border-border group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={studioBaseImage} alt="Referência" className="object-cover w-full h-full" />
                <button onClick={() => setStudioBaseImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <button onClick={() => studioImageRef.current?.click()} className="flex-1 bg-secondary hover:bg-secondary/80 border border-border rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-medium transition-colors">
                <Upload size={16} /> Enviar Planta / Foto
              </button>
              <input type="file" ref={studioImageRef} accept="image/*" className="hidden" onChange={handleStudioImageUpload} />
            </div>

            <textarea
              value={studioPrompt}
              onChange={(e) => setStudioPrompt(e.target.value)}
              className="input-field h-24 resize-none mb-4 text-sm"
              placeholder="Ex: Sala de estar moderna com grandes janelas, vista para o parque..."
            />
            
            <div className="flex gap-3">
              <GradientButton
                onClick={async () => {
                  setStudioLoading(true);
                  setStudioImageUrl("");
                  setStudioVideoUrl("");
                  try {
                    if (studioBaseImage) {
                      await new Promise(r => setTimeout(r, 2500));
                      setStudioImageUrl("https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1024&q=80");
                    } else {
                      const res = await fetch("/api/generate-image", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt: studioPrompt })
                      });
                      const data = await res.json();
                      if (data.url) setStudioImageUrl(data.url);
                      else alert(data.error || "Erro ao gerar imagem");
                    }
                  } catch (err) {
                    alert("Erro de conexão");
                  } finally {
                    setStudioLoading(false);
                  }
                }}
                disabled={studioLoadingVideo}
                loading={studioLoading}
                loadingText="Gerando..."
                variant="primary"
                size="sm"
              >
                <ImageIcon size={16}/> Foto 3D
              </GradientButton>

              <GradientButton
                onClick={async () => {
                  setStudioLoadingVideo(true);
                  setStudioImageUrl("");
                  setStudioVideoUrl("");
                  try {
                    await new Promise(r => setTimeout(r, 4000));
                    setStudioVideoUrl("https://www.w3schools.com/html/mov_bbb.mp4");
                  } catch (err) {
                    alert("Erro ao gerar vídeo");
                  } finally {
                    setStudioLoadingVideo(false);
                  }
                }}
                disabled={studioLoading || !studioBaseImage}
                loading={studioLoadingVideo}
                loadingText="Animando..."
                variant="creative"
                size="sm"
              >
                <Video size={16}/> Vídeo 3D
              </GradientButton>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card-3d p-6 min-h-[400px] flex flex-col items-center justify-center border-dashed border-2 border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5" />
            
            {studioVideoUrl ? (
              <div className="relative w-full h-full min-h-[350px] rounded-lg overflow-hidden flex flex-col">
                <video src={studioVideoUrl} autoPlay loop controls className="w-full rounded-lg" />
                <button
                  onClick={() => handleDownload(studioVideoUrl, "video-3d-empreendimento.mp4")}
                  className="mt-3 w-full bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/30 text-pink-400 rounded-xl py-2 font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Download size={16} /> Baixar Vídeo
                </button>
              </div>
            ) : studioImageUrl ? (
              <div className="relative w-full h-full min-h-[350px] rounded-lg overflow-hidden flex flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={studioImageUrl} alt="Render 3D" className="w-full rounded-lg object-cover" />
                <button
                  onClick={() => handleDownload(studioImageUrl, "render-3d-empreendimento.png")}
                  className="mt-3 w-full bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 rounded-xl py-2 font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Download size={16} /> Baixar Imagem 3D
                </button>
              </div>
            ) : (
              <div className="text-center z-10">
                <ImageIcon size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Sua imagem aparecerá aqui</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
