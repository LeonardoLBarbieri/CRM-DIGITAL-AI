"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GradientButton } from "@/components/ui/GradientButton";
import { Mic, Upload, Music, X, Sparkles, Volume2, Play, Check, Download, RefreshCw, Loader2, Clock, Trash2 } from "lucide-react";

interface Voice {
  voiceId: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  previewUrl: string | null;
}

interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
}

interface AudioHistoryItem {
  id: string;
  text: string;
  audioUrl: string;
  downloadUrl: string;
  timestamp: number;
  voiceName: string;
}

export default function VozPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 50,
    similarityBoost: 75,
    style: 20,
  });

  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [cloneName, setCloneName] = useState("Leonardo Barbieri");
  const [cloning, setCloning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [testText, setTestText] = useState("Olá! Eu sou Leonardo Barbieri, especialista em lançamentos imobiliários. Vamos juntos encontrar o imóvel perfeito para você.");
  const [audioHistory, setAudioHistory] = useState<AudioHistoryItem[]>([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVoices();
    try {
      const stored = localStorage.getItem("lb-audio-history");
      if (stored) setAudioHistory(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const fetchVoices = async () => {
    setLoadingVoices(true);
    try {
      const response = await fetch("/api/list-voices");
      const data = await response.json();
      if (!data.error) {
        setVoices(data.voices || []);
        if (data.configuredVoiceId && !selectedVoiceId) setSelectedVoiceId(data.configuredVoiceId);
      }
    } catch (error) {
      console.error("Erro ao carregar vozes:", error);
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleCloneVoice = async () => {
    if (cloneFiles.length === 0) return alert("Envie pelo menos um arquivo de áudio.");
    if (!cloneName.trim()) return alert("Dê um nome para sua voz.");

    setCloning(true);
    try {
      const formData = new FormData();
      formData.append("name", cloneName.trim());
      cloneFiles.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/clone-voice", { method: "POST", body: formData });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert(data.message);
        setSelectedVoiceId(data.voiceId);
        setCloneFiles([]);
        fetchVoices();
      }
    } catch {
      alert("Erro ao conectar com o servidor para clonar voz.");
    } finally {
      setCloning(false);
    }
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
          voiceSettings: {
            stability: voiceSettings.stability / 100,
            similarityBoost: voiceSettings.similarityBoost / 100,
            style: voiceSettings.style / 100,
          },
        }),
      });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAudioUrl(data.audioDataUrl);
        setDownloadUrl(data.downloadUrl || "");

        const selectedVoice = voices.find((v) => v.voiceId === selectedVoiceId);
        const historyItem: AudioHistoryItem = {
          id: crypto.randomUUID(),
          text: text.substring(0, 120) + (text.length > 120 ? "..." : ""),
          audioUrl: data.audioDataUrl,
          downloadUrl: data.downloadUrl || "",
          timestamp: Date.now(),
          voiceName: selectedVoice?.name || "Voz Padrão",
        };
        const newHistory = [historyItem, ...audioHistory].slice(0, 10);
        setAudioHistory(newHistory);
        localStorage.setItem("lb-audio-history", JSON.stringify(newHistory));
      }
    } catch {
      alert("Erro ao conectar com o servidor para gerar áudio.");
    } finally {
      setAudioLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|m4a|webm|ogg|opus|mp4)$/i)
    );
    if (droppedFiles.length > 0) setCloneFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setCloneFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => setCloneFiles((prev) => prev.filter((_, i) => i !== index));

  const removeHistoryItem = (id: string) => {
    const newHistory = audioHistory.filter((item) => item.id !== id);
    setAudioHistory(newHistory);
    localStorage.setItem("lb-audio-history", JSON.stringify(newHistory));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-full">
      <SectionHeader icon={<Mic size={24} />} title="Voz & Áudio" subtitle="Clone sua voz, ajuste os parâmetros e gere áudios profissionais para seus anúncios." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card-3d p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Upload size={20} className="text-purple-400" /> Clonar Minha Voz
              </h2>
              <div className={`status-badge ${selectedVoiceId ? "configured" : "not-configured"}`}>
                <span className={`pulse-dot ${selectedVoiceId ? "green" : "yellow"}`} />
                {selectedVoiceId ? "Voz Configurada" : "Sem Voz"}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Voz</label>
                <input type="text" value={cloneName} onChange={(e) => setCloneName(e.target.value)} className="input-field" placeholder="Ex: Leonardo Barbieri" />
              </div>

              <div
                className={`dropzone ${dragOver ? "drag-over" : ""} ${cloneFiles.length > 0 ? "has-files" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.opus,.mp4" multiple onChange={handleFileSelect} className="hidden" />
                <div className="relative z-10">
                  <Music size={32} className="mx-auto mb-3 text-purple-400 opacity-70" />
                  <p className="font-medium mb-1">{dragOver ? "Solte o arquivo aqui!" : "Arraste seus áudios aqui"}</p>
                  <p className="text-sm text-muted-foreground">ou clique para selecionar • MP3, WAV, M4A, OGG, MP4</p>
                  <p className="text-xs text-muted-foreground mt-2">Grave pelo menos 1-2 minutos de áudio limpo, sem ruído de fundo</p>
                </div>
              </div>

              {cloneFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {cloneFiles.map((file, index) => (
                    <div key={index} className="file-chip">
                      <Music size={14} /> <span>{file.name}</span> <span className="text-xs opacity-60">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                      <button onClick={(e) => { e.stopPropagation(); removeFile(index); }}><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}

              <GradientButton onClick={handleCloneVoice} disabled={cloneFiles.length === 0} loading={cloning} loadingText="Clonando Voz..." variant="creative">
                <Sparkles size={20} /> Clonar Minha Voz com IA
              </GradientButton>
            </div>
          </div>

          <div className="glass-card-3d p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Volume2 size={20} className="text-cyan-400" /> Ajustes de Voz</h2>
            <div className="space-y-6">
              <SliderControl label="Estabilidade" description="Controla a consistência do tom. Menor = mais expressivo." value={voiceSettings.stability} onChange={(v) => setVoiceSettings((s) => ({ ...s, stability: v }))} leftLabel="Expressivo" rightLabel="Estável" />
              <SliderControl label="Similaridade" description="Quão próximo da voz original." value={voiceSettings.similarityBoost} onChange={(v) => setVoiceSettings((s) => ({ ...s, similarityBoost: v }))} leftLabel="Criativo" rightLabel="Fiel" />
              <SliderControl label="Estilo & Expressividade" description="Adiciona emoção e variação na fala." value={voiceSettings.style} onChange={(v) => setVoiceSettings((s) => ({ ...s, style: v }))} leftLabel="Neutro" rightLabel="Expressivo" />
            </div>
          </div>

          <div className="glass-card-3d p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Play size={20} className="text-emerald-400" /> Testar Voz</h2>
            <div className="space-y-4">
              <textarea value={testText} onChange={(e) => setTestText(e.target.value)} className="input-field h-28 resize-none" placeholder="Digite um texto para testar..." />
              <GradientButton onClick={() => handleGenerateAudio(testText)} disabled={!testText.trim()} loading={audioLoading} loadingText="Gerando Áudio..." variant="success">
                <Mic size={20} /> Gerar Áudio de Teste
              </GradientButton>
              {audioUrl && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium flex items-center gap-2 text-emerald-400"><Check size={16} /> Áudio Pronto</p>
                    {downloadUrl && <a href={downloadUrl} download className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"><Download size={14} /> Baixar</a>}
                  </div>
                  <div className="audio-player-wrapper"><audio controls src={audioUrl} className="w-full" /></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card-3d p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2"><Volume2 size={18} className="text-purple-400" /> Minhas Vozes</h3>
              <button onClick={fetchVoices} disabled={loadingVoices} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"><RefreshCw size={16} className={loadingVoices ? "animate-spin" : ""} /></button>
            </div>
            {loadingVoices ? (
              <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-purple-400" /></div>
            ) : voices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><Mic size={32} className="mx-auto mb-3 opacity-40" /><p className="text-sm">Nenhuma voz encontrada.</p></div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {voices.map((voice) => (
                  <div key={voice.voiceId} className={`voice-card ${selectedVoiceId === voice.voiceId ? "selected" : ""}`} onClick={() => setSelectedVoiceId(voice.voiceId)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{voice.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{voice.category}</p>
                      </div>
                      {selectedVoiceId === voice.voiceId && <Check size={16} className="text-purple-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card-3d p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Clock size={18} className="text-cyan-400" /> Histórico</h3>
            {audioHistory.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground"><Clock size={28} className="mx-auto mb-2 opacity-40" /><p className="text-sm">Nenhum áudio gerado ainda.</p></div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {audioHistory.map((item) => (
                  <div key={item.id} className="history-item group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.voiceName}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setAudioUrl(item.audioUrl); setDownloadUrl(item.downloadUrl); }} className="p-1.5 hover:bg-secondary rounded-md"><Play size={12} /></button>
                      {item.downloadUrl && <a href={item.downloadUrl} download className="p-1.5 hover:bg-secondary rounded-md"><Download size={12} /></a>}
                      <button onClick={() => removeHistoryItem(item.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SliderControl({ label, description, value, onChange, leftLabel, rightLabel }: { label: string; description: string; value: number; onChange: (v: number) => void; leftLabel: string; rightLabel: string; }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm text-purple-400 font-mono">{value}%</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="voice-slider" />
      <div className="flex justify-between mt-1"><span className="text-xs text-muted-foreground">{leftLabel}</span><span className="text-xs text-muted-foreground">{rightLabel}</span></div>
    </div>
  );
}
