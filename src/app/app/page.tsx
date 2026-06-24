"use client";
import {
  BrainCircuit, Video, Mic, PenTool, Sparkles, Building2,
  Loader2, Copy, Check, Upload, X, Download, Play, Pause,
  Volume2, ChevronRight, Clock, Trash2, RefreshCw, Music,
  MessageSquare, FileText, Plus, Image as ImageIcon, CalendarDays,
  TrendingUp, DollarSign, Send, AlertCircle, ArrowUpCircle, ArrowDownCircle, BarChart3
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { LeadDetailModal } from "@/components/crm/LeadDetailModal";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { TaskManager } from "@/components/tasks/TaskManager";
import { CampaignManager } from "@/components/campaigns/CampaignManager";
import { Sidebar } from "@/components/layout/Sidebar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Megaphone } from "lucide-react";

// ============================================================
// Types
// ============================================================
type TabId = "roteiro" | "voz" | "avatar" | "crm" | "studio" | "financeiro" | "dashboard" | "tarefas" | "campanhas";

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

// ============================================================
// Main Component
// ============================================================
export default function AppDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  // === Roteiro State ===
  const [name, setName] = useState("");
  const [features, setFeatures] = useState("");
  const [style, setStyle] = useState("Consultivo & Humano");
  const [format, setFormat] = useState("Instagram Reels (9:16)");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState("");
  const [copied, setCopied] = useState(false);

  // === Audio State (shared between tabs) ===
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  // === Voice State ===
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 50,
    similarityBoost: 75,
    style: 20,
  });

  // === Clone State ===
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [cloneName, setCloneName] = useState("Leonardo Barbieri");
  const [cloning, setCloning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // === Video / Avatar State ===
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoStatus, setVideoStatus] = useState("");
  const [videoScript, setVideoScript] = useState("");
  const [videoAspectRatio, setVideoAspectRatio] = useState("9:16");
  const [heygenAvatars, setHeygenAvatars] = useState<{ id: string; name: string; type: string; thumbnail: string | null; ownership: string }[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("");
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [videoId, setVideoId] = useState<string>("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // === CRM / Leads State ===
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // === Studio 3D & Social Planner State ===
  const [studioPrompt, setStudioPrompt] = useState("Render 3D fotorrealista de uma sala de estar de alto padrão, ampla, com varanda gourmet e vista para a cidade no entardecer.");
  const [studioImageUrl, setStudioImageUrl] = useState("");
  const [studioVideoUrl, setStudioVideoUrl] = useState("");
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioLoadingVideo, setStudioLoadingVideo] = useState(false);
  const [studioBaseImage, setStudioBaseImage] = useState<string | null>(null);
  const studioImageRef = useRef<HTMLInputElement>(null);
  const [socialPlan, setSocialPlan] = useState("");

  // === Finance State ===
  interface Commission { id: string; description: string; amount: number; type: string; date: string; createdAt: string; }
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [commDesc, setCommDesc] = useState("");
  const [commAmount, setCommAmount] = useState("");
  const [commType, setCommType] = useState("income");
  const [commDate, setCommDate] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyGoal, setMonthlyGoal] = useState("15000");

  // === WhatsApp Modal State ===
  const [waModalLead, setWaModalLead] = useState<any | null>(null);
  const [waTemplate, setWaTemplate] = useState(0);

  // Fetch Leads on mount
  useEffect(() => {
    if (activeTab === "crm") {
      fetchLeads();
    }
    if (activeTab === "financeiro") {
      fetchCommissions();
    }
  }, [activeTab]);

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch("/api/leads");
      if (res.ok) {
        const data = await res.json();
        // API returns { leads, total, page, limit } or array (backwards compat)
        setLeads(Array.isArray(data) ? data : (data.leads || []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchCommissions = async () => {
    setCommLoading(true);
    try {
      const res = await fetch("/api/commissions");
      if (res.ok) setCommissions(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setCommLoading(false);
    }
  };

  const handleAddCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commDesc || !commAmount) return;
    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: commDesc, amount: commAmount, type: commType, date: commDate }),
      });
      if (res.ok) {
        setCommDesc("");
        setCommAmount("");
        fetchCommissions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCommission = async (id: string) => {
    try {
      await fetch("/api/commissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchCommissions();
    } catch (e) {
      console.error(e);
    }
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
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName) return;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLeadName, phone: newLeadPhone }),
      });
      if (res.ok) {
        setNewLeadName("");
        setNewLeadPhone("");
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [name, phone] = line.split(',');
        if (name) {
          try {
            await fetch("/api/leads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: name.trim(), phone: phone ? phone.trim() : "" }),
            });
          } catch (err) {
            console.error("Erro importando CSV", err);
          }
        }
      }
      fetchLeads();
      alert("Importação de CSV concluída!");
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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

  const moveLead = async (id: string, newStatus: string) => {
    // Optimistic update
    setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
    try {
      await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (e) {
      console.error(e);
      fetchLeads(); // Revert on error
    }
  };

  const handleSaveLead = async (updatedLead: any) => {
    try {
      const res = await fetch("/api/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedLead),
      });
      if (!res.ok) throw new Error("Failed to update");
      fetchLeads();
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  // === Test Voice State ===
  const [testText, setTestText] = useState(
    "Olá! Eu sou Leonardo Barbieri, especialista em lançamentos imobiliários. Vamos juntos encontrar o imóvel perfeito para você."
  );

  // === Audio History ===
  const [audioHistory, setAudioHistory] = useState<AudioHistoryItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // Load voices on tab switch
  // ============================================================
  useEffect(() => {
    if (activeTab === "voz") {
      fetchVoices();
    }
    if (activeTab === "avatar") {
      fetchHeygenAvatars();
      // Pre-fill video script with the last generated script
      if (script && !videoScript) {
        setVideoScript(script);
      }
    }
  }, [activeTab]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lb-audio-history");
      if (stored) setAudioHistory(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // ============================================================
  // API Handlers
  // ============================================================
  const fetchVoices = async () => {
    setLoadingVoices(true);
    try {
      const response = await fetch("/api/list-voices");
      const data = await response.json();
      if (data.error) {
        console.error(data.error);
      } else {
        setVoices(data.voices || []);
        if (data.configuredVoiceId && !selectedVoiceId) {
          setSelectedVoiceId(data.configuredVoiceId);
        }
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

      const response = await fetch("/api/clone-voice", {
        method: "POST",
        body: formData,
      });
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

  const handleGenerateAudio = async (text: string, source: "roteiro" | "teste") => {
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

        // Save to history
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
        try {
          localStorage.setItem("lb-audio-history", JSON.stringify(newHistory));
        } catch { /* ignore */ }
      }
    } catch {
      alert("Erro ao conectar com o servidor para gerar áudio.");
    } finally {
      setAudioLoading(false);
    }
  };

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
      if (data.error) {
        alert(data.error);
      } else {
        setScript(data.script);
      }
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

  const handleGenerateVideo = async () => {
    if (!videoScript.trim()) return alert("Digite ou cole o roteiro para gerar o vídeo.");

    setVideoLoading(true);
    setVideoStatus("Enviando roteiro para HeyGen...");
    setVideoUrl("");
    setVideoId("");

    // Clear any previous polling
    if (pollingRef.current) clearInterval(pollingRef.current);

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: videoScript,
          avatarId: selectedAvatarId || undefined,
          aspectRatio: videoAspectRatio,
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

      // Poll for completion every 10 seconds
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

  // ============================================================
  // Drag & Drop Handlers
  // ============================================================
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav|m4a|webm|ogg|opus|mp4)$/i)
    );
    if (droppedFiles.length > 0) {
      setCloneFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setCloneFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setCloneFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeHistoryItem = (id: string) => {
    const newHistory = audioHistory.filter((item) => item.id !== id);
    setAudioHistory(newHistory);
    try {
      localStorage.setItem("lb-audio-history", JSON.stringify(newHistory));
    } catch { /* ignore */ }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:h-screen">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 pt-18 md:pt-8">
          <AnimatePresence mode="wait">

            {/* ============ TAB: DASHBOARD ============ */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="tab-content-enter h-full"
              >
                <ManagerDashboard />
              </motion.div>
            )}

            {/* ============ TAB: TAREFAS ============ */}
            {activeTab === "tarefas" && (
              <motion.div
                key="tarefas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="tab-content-enter h-full"
              >
                <TaskManager />
              </motion.div>
            )}

            {/* ============ TAB: CAMPANHAS ============ */}
            {activeTab === "campanhas" && (
              <motion.div
                key="campanhas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="tab-content-enter h-full"
              >
                <CampaignManager />
              </motion.div>
            )}

            {/* ============ TAB: ROTEIRO ============ */}
            {activeTab === "roteiro" && (
              <motion.div
                key="roteiro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="tab-content-enter"
              >
              <SectionHeader
                icon={<PenTool size={24} />}
                title="Novo Anúncio Imobiliário"
                subtitle="Nossa IA criará um roteiro persuasivo e gravará um vídeo 4K hiper-realista."
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card-3d p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Building2 size={20} className="text-cyan-400" />
                      Dados do Empreendimento
                    </h2>

                    <form className="space-y-5">
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
                        onClick={() => handleGenerateAudio(script, "roteiro")}
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
            )}

            {/* ============ TAB: VOZ & ÁUDIO ============ */}
            {activeTab === "voz" && (
              <motion.div
                key="voz"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="tab-content-enter"
              >
              <SectionHeader
                icon={<Mic size={24} />}
                title="Voz & Áudio"
                subtitle="Clone sua voz, ajuste os parâmetros e gere áudios profissionais para seus anúncios."
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                  {/* === Clone Voice Section === */}
                  <div className="glass-card-3d p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Upload size={20} className="text-purple-400" />
                        Clonar Minha Voz
                      </h2>
                      <div className={`status-badge ${selectedVoiceId ? "configured" : "not-configured"}`}>
                        <span className={`pulse-dot ${selectedVoiceId ? "green" : "yellow"}`} />
                        {selectedVoiceId ? "Voz Configurada" : "Sem Voz"}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome da Voz</label>
                        <input
                          type="text"
                          value={cloneName}
                          onChange={(e) => setCloneName(e.target.value)}
                          className="input-field"
                          placeholder="Ex: Leonardo Barbieri"
                        />
                      </div>

                      {/* Dropzone */}
                      <div
                        className={`dropzone ${dragOver ? "drag-over" : ""} ${cloneFiles.length > 0 ? "has-files" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.opus,.mp4"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <div className="relative z-10">
                          <Music size={32} className="mx-auto mb-3 text-purple-400 opacity-70" />
                          <p className="font-medium mb-1">
                            {dragOver ? "Solte o arquivo aqui!" : "Arraste seus áudios aqui"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ou clique para selecionar • MP3, WAV, M4A, OGG, MP4
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Grave pelo menos 1-2 minutos de áudio limpo, sem ruído de fundo
                          </p>
                        </div>
                      </div>

                      {/* File Chips */}
                      {cloneFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {cloneFiles.map((file, index) => (
                            <div key={index} className="file-chip">
                              <Music size={14} />
                              <span>{file.name}</span>
                              <span className="text-xs opacity-60">
                                ({(file.size / 1024 / 1024).toFixed(1)}MB)
                              </span>
                              <button onClick={(e) => { e.stopPropagation(); removeFile(index); }}>
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <GradientButton
                        onClick={handleCloneVoice}
                        disabled={cloneFiles.length === 0}
                        loading={cloning}
                        loadingText="Clonando Voz..."
                        variant="creative"
                      >
                        <Sparkles size={20} />
                        Clonar Minha Voz com IA
                      </GradientButton>
                    </div>
                  </div>

                  {/* === Voice Settings === */}
                  <div className="glass-card-3d p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Volume2 size={20} className="text-cyan-400" />
                      Ajustes de Voz
                    </h2>

                    <div className="space-y-6">
                      <SliderControl
                        label="Estabilidade"
                        description="Controla a consistência do tom. Menor = mais expressivo, Maior = mais estável."
                        value={voiceSettings.stability}
                        onChange={(v) => setVoiceSettings((s) => ({ ...s, stability: v }))}
                        leftLabel="Expressivo"
                        rightLabel="Estável"
                      />
                      <SliderControl
                        label="Similaridade"
                        description="Quão próximo da voz original. Maior = mais fiel ao original."
                        value={voiceSettings.similarityBoost}
                        onChange={(v) => setVoiceSettings((s) => ({ ...s, similarityBoost: v }))}
                        leftLabel="Criativo"
                        rightLabel="Fiel"
                      />
                      <SliderControl
                        label="Estilo & Expressividade"
                        description="Adiciona emoção e variação na fala."
                        value={voiceSettings.style}
                        onChange={(v) => setVoiceSettings((s) => ({ ...s, style: v }))}
                        leftLabel="Neutro"
                        rightLabel="Expressivo"
                      />
                    </div>
                  </div>

                  {/* === Test Voice === */}
                  <div className="glass-card-3d p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Play size={20} className="text-emerald-400" />
                      Testar Voz
                    </h2>

                    <div className="space-y-4">
                      <textarea
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        className="input-field h-28 resize-none"
                        placeholder="Digite um texto para testar sua voz clonada..."
                      />

                      <GradientButton
                        onClick={() => handleGenerateAudio(testText, "teste")}
                        disabled={!testText.trim()}
                        loading={audioLoading}
                        loadingText="Gerando Áudio..."
                        variant="success"
                      >
                        <Mic size={20} />
                        Gerar Áudio de Teste
                      </GradientButton>

                      {audioUrl && (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium flex items-center gap-2 text-emerald-400">
                              <Check size={16} /> Áudio Pronto
                            </p>
                            {downloadUrl && (
                              <a
                                href={downloadUrl}
                                download
                                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                              >
                                <Download size={14} /> Baixar
                              </a>
                            )}
                          </div>
                          <div className="audio-player-wrapper">
                            <audio controls src={audioUrl} className="w-full" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* === Sidebar: Voice List + History === */}
                <div className="space-y-6">
                  {/* Voice Selection */}
                  <div className="glass-card-3d p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Volume2 size={18} className="text-purple-400" />
                        Minhas Vozes
                      </h3>
                      <button
                        onClick={fetchVoices}
                        disabled={loadingVoices}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                        title="Atualizar lista"
                      >
                        <RefreshCw size={16} className={loadingVoices ? "animate-spin" : ""} />
                      </button>
                    </div>

                    {loadingVoices ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-purple-400" />
                      </div>
                    ) : voices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mic size={32} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Nenhuma voz encontrada.</p>
                        <p className="text-xs mt-1">Clone sua voz ou configure a chave da API.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {voices.map((voice) => (
                          <div
                            key={voice.voiceId}
                            className={`voice-card ${selectedVoiceId === voice.voiceId ? "selected" : ""}`}
                            onClick={() => setSelectedVoiceId(voice.voiceId)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{voice.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {voice.category === "cloned" ? "🎯 Clonada" : voice.category === "professional" ? "⭐ Profissional" : "📦 Pré-feita"}
                                </p>
                              </div>
                              {selectedVoiceId === voice.voiceId && (
                                <Check size={16} className="text-purple-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Audio History */}
                  <div className="glass-card-3d p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Clock size={18} className="text-cyan-400" />
                      Histórico
                    </h3>

                    {audioHistory.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <Clock size={28} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Nenhum áudio gerado ainda.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {audioHistory.map((item) => (
                          <div key={item.id} className="history-item group">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{item.text}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.voiceName} • {new Date(item.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => { setAudioUrl(item.audioUrl); setDownloadUrl(item.downloadUrl); }}
                                className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                                title="Reproduzir"
                              >
                                <Play size={12} />
                              </button>
                              {item.downloadUrl && (
                                <a
                                  href={item.downloadUrl}
                                  download
                                  className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                                  title="Baixar"
                                >
                                  <Download size={12} />
                                </a>
                              )}
                              <button
                                onClick={() => removeHistoryItem(item.id)}
                                className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                                title="Remover"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </motion.div>
            )}

            {/* ============ TAB: AVATAR ============ */}
            {activeTab === "avatar" && (
              <motion.div
                key="avatar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="tab-content-enter"
              >
              <SectionHeader
                icon={<Video size={24} />}
                title="Gerar Avatar"
                subtitle="Crie vídeos hiper-realistas com seu avatar digital via HeyGen."
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                  {/* Avatar Selection */}
                  <div className="glass-card-3d p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Video size={20} className="text-cyan-400" />
                        Escolher Avatar
                      </h2>
                      <button
                        onClick={fetchHeygenAvatars}
                        disabled={loadingAvatars}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all"
                        title="Atualizar lista"
                      >
                        <RefreshCw size={16} className={loadingAvatars ? "animate-spin" : ""} />
                      </button>
                    </div>

                    {loadingAvatars ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-cyan-400" />
                      </div>
                    ) : heygenAvatars.length === 0 ? (
                      <div className="text-center py-6 bg-secondary/30 rounded-xl border border-border/40">
                        <AlertCircle size={28} className="mx-auto mb-2 text-yellow-400" />
                        <p className="text-sm font-medium">Nenhum avatar encontrado.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Verifique sua chave de API ou crie um avatar na plataforma HeyGen.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                        {heygenAvatars.map((avatar) => (
                          <div
                            key={avatar.id}
                            onClick={() => setSelectedAvatarId(avatar.id)}
                            className={`relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${
                              selectedAvatarId === avatar.id
                                ? "border-purple-500 shadow-lg shadow-purple-500/20"
                                : "border-border hover:border-purple-500/50"
                            }`}
                          >
                            {avatar.thumbnail ? (
                              <img src={avatar.thumbnail} alt={avatar.name} className="w-full aspect-[3/4] object-cover" />
                            ) : (
                              <div className="w-full aspect-[3/4] bg-secondary/50 flex items-center justify-center">
                                <Video size={24} className="text-muted-foreground opacity-50" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-2 py-1.5">
                              <p className="text-xs font-medium text-white truncate">{avatar.name}</p>
                              <p className="text-[10px] text-gray-300 capitalize">
                                {avatar.ownership === "private" ? "🎯 Meu Avatar" : "📦 Stock"}
                              </p>
                            </div>
                            {selectedAvatarId === avatar.id && (
                              <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-0.5">
                                <Check size={12} className="text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Script + Settings */}
                  <div className="glass-card-3d p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FileText size={20} className="text-purple-400" />
                      Roteiro do Vídeo
                    </h2>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Texto que o avatar vai falar</label>
                          {script && (
                            <button
                              onClick={() => setVideoScript(script)}
                              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              Usar roteiro gerado
                            </button>
                          )}
                        </div>
                        <textarea
                          value={videoScript}
                          onChange={(e) => setVideoScript(e.target.value)}
                          className="input-field h-36 resize-none text-sm"
                          placeholder="Cole aqui o roteiro que o avatar vai falar no vídeo..."
                        />
                        <p className="text-xs text-muted-foreground text-right">{videoScript.length} caracteres</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Proporção do Vídeo</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "9:16", desc: "Reels/Stories" },
                            { label: "16:9", desc: "YouTube" },
                            { label: "1:1", desc: "Feed" },
                          ].map((ratio) => (
                            <button
                              key={ratio.label}
                              type="button"
                              onClick={() => setVideoAspectRatio(ratio.label)}
                              className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${
                                videoAspectRatio === ratio.label
                                  ? "border-purple-500 bg-purple-500/10 text-purple-400"
                                  : "border-border hover:border-purple-500/50"
                              }`}
                            >
                              <div>{ratio.label}</div>
                              <div className="text-xs text-muted-foreground font-normal">{ratio.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <GradientButton
                        onClick={handleGenerateVideo}
                        disabled={!videoScript.trim()}
                        loading={videoLoading}
                        loadingText={videoStatus || "Processando..."}
                        variant="primary"
                        size="lg"
                      >
                        <Sparkles size={20} />
                        Gerar Vídeo com Meu Avatar
                      </GradientButton>

                      {/* Status bar during processing */}
                      {videoLoading && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                          <div className="flex gap-1">
                            {[0,1,2].map(i => (
                              <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                          <p className="text-sm text-purple-300">{videoStatus}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video Result */}
                  {videoUrl && (
                    <div className="glass-card-3d p-6 border-purple-500/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-lg flex items-center gap-2 text-purple-400">
                          <Check size={18} /> Vídeo Gerado com Sucesso
                        </p>
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors bg-secondary px-3 py-1.5 rounded-lg"
                        >
                          <Download size={14} /> Baixar MP4
                        </a>
                      </div>
                      <div className={`bg-black/40 rounded-xl overflow-hidden border border-border/50 flex items-center justify-center mx-auto ${videoAspectRatio === "9:16" ? "max-w-xs aspect-[9/16]" : videoAspectRatio === "1:1" ? "max-w-md aspect-square" : "aspect-video"}`}>
                        <video controls src={videoUrl} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                  <div className="glass-card-3d p-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                      <Check size={18} className="text-green-400" />
                      Passo a Passo
                    </h3>
                    <ul className="space-y-4 text-sm">
                      {[
                        { n: "1", text: "Crie uma conta na HeyGen e treine seu avatar com um vídeo de 2 minutos." },
                        { n: "2", text: "Verifique se HEYGEN_API_KEY está configurada no .env.local." },
                        { n: "3", text: "Clique em atualizar (↺) para carregar seus avatars." },
                        { n: "4", text: "Cole ou gere um roteiro e clique em Gerar Vídeo." },
                        { n: "5", text: "Aguarde o processamento. O vídeo aparece aqui quando pronto." },
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
                      <p className="text-sm font-medium text-green-400 truncate">
                        {heygenAvatars.find(a => a.id === selectedAvatarId)?.name || selectedAvatarId}
                      </p>
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
            )}

            {/* ============ TAB: CRM / LEADS ============ */}
            {activeTab === "crm" && (
              <motion.div
                key="crm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="tab-content-enter h-full flex flex-col"
              >
              <SectionHeader
                icon={<MessageSquare size={24} />}
                title="Gestão de Leads (CRM)"
                subtitle="Organize seus clientes e contatos do WhatsApp."
                actions={
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => csvFileRef.current?.click()} className="text-sm font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
                      <Upload size={16} /> Importar CSV
                    </button>
                    <input type="file" ref={csvFileRef} accept=".csv" className="hidden" onChange={handleCSVUpload} />
                    
                    <form onSubmit={handleAddLead} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nome do Lead"
                        value={newLeadName}
                        onChange={(e) => setNewLeadName(e.target.value)}
                        className="input-field !w-auto py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="WhatsApp"
                        value={newLeadPhone}
                        onChange={(e) => setNewLeadPhone(e.target.value)}
                        className="input-field !w-32 py-2 text-sm"
                      />
                      <button type="submit" className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                        <Plus size={16} /> Novo
                      </button>
                    </form>
                  </div>
                }
              />

              <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <KanbanBoard 
                  leads={leads} 
                  onLeadMove={moveLead} 
                  onLeadClick={(lead) => setSelectedLead(lead)} 
                />
              </div>

              {selectedLead && (
                <LeadDetailModal
                  lead={selectedLead}
                  onClose={() => setSelectedLead(null)}
                  onSave={handleSaveLead}
                />
              )}
            </motion.div>
          )}

          {/* ============ TAB: STUDIO 3D & PLANNER ============ */}
          {activeTab === "studio" && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="tab-content-enter h-full"
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
          )}

          {/* ============ TAB: FINANCEIRO ============ */}
          {activeTab === "financeiro" && (
            <motion.div
              key="financeiro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="tab-content-enter h-full"
            >
              <SectionHeader
                icon={<DollarSign size={24} />}
                title="Gestão Financeira"
                subtitle="Controle suas comissões, gastos e planeje sua reserva de emergência."
              />

              {/* Summary Cards */}
              {(() => {
                const income = commissions.filter(c => c.type === "income").reduce((s, c) => s + c.amount, 0);
                const expense = commissions.filter(c => c.type === "expense").reduce((s, c) => s + c.amount, 0);
                const balance = income - expense;
                const goal = parseFloat(monthlyGoal) || 0;
                const currentMonth = new Date().toISOString().slice(0, 7);
                const incomeThisMonth = commissions.filter(c => c.type === "income" && c.date === currentMonth).reduce((s, c) => s + c.amount, 0);
                const progressPct = goal > 0 ? Math.min((incomeThisMonth / goal) * 100, 100) : 0;
                const reserveSuggested = income * 0.30;
                return (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="glass-panel rounded-2xl p-5">
                        <p className="text-xs text-muted-foreground mb-1">Total Recebido</p>
                        <p className="text-2xl font-bold text-green-400">R$ {income.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p>
                        <ArrowUpCircle size={16} className="text-green-400 mt-1" />
                      </div>
                      <div className="glass-panel rounded-2xl p-5">
                        <p className="text-xs text-muted-foreground mb-1">Total Gasto</p>
                        <p className="text-2xl font-bold text-red-400">R$ {expense.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p>
                        <ArrowDownCircle size={16} className="text-red-400 mt-1" />
                      </div>
                      <div className="glass-panel rounded-2xl p-5">
                        <p className="text-xs text-muted-foreground mb-1">Saldo Atual</p>
                        <p className={`text-2xl font-bold ${balance >= 0 ? "text-cyan-400" : "text-red-400"}`}>R$ {balance.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p>
                        <TrendingUp size={16} className="text-cyan-400 mt-1" />
                      </div>
                      <div className="glass-panel rounded-2xl p-5">
                        <p className="text-xs text-muted-foreground mb-1">Reserva Ideal (30%)</p>
                        <p className="text-2xl font-bold text-yellow-400">R$ {reserveSuggested.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</p>
                        <AlertCircle size={16} className="text-yellow-400 mt-1" />
                      </div>
                    </div>

                    {/* Monthly Goal Bar */}
                    <div className="glass-card-3d p-6 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-sm">Meta do Mês Atual</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <input
                            type="number"
                            value={monthlyGoal}
                            onChange={e => setMonthlyGoal(e.target.value)}
                            className="input-field !w-28 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            progressPct >= 100 ? "bg-green-500" : progressPct >= 60 ? "bg-purple-500" : "bg-yellow-500"
                          }`}
                        />
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>R$ {incomeThisMonth.toLocaleString("pt-BR", {minimumFractionDigits: 2})} recebidos</span>
                        <span>{progressPct.toFixed(0)}% da meta</span>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Commission Form */}
                <div className="glass-card-3d p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus size={18} className="text-purple-400" /> Registrar Entrada / Saída
                  </h2>
                  <form onSubmit={handleAddCommission} className="space-y-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setCommType("income")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${commType === "income" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-secondary text-muted-foreground"}`}>
                        + Entrada
                      </button>
                      <button type="button" onClick={() => setCommType("expense")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${commType === "expense" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-secondary text-muted-foreground"}`}>
                        - Saída
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Descrição (ex: Comissão Apt 203)"
                      value={commDesc}
                      onChange={e => setCommDesc(e.target.value)}
                      className="input-field"
                    />
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Valor (R$)"
                        value={commAmount}
                        onChange={e => setCommAmount(e.target.value)}
                        className="input-field flex-1"
                      />
                      <input
                        type="month"
                        value={commDate}
                        onChange={e => setCommDate(e.target.value)}
                        className="input-field flex-1"
                      />
                    </div>
                    <GradientButton type="submit" variant="primary" size="md">
                      <DollarSign size={16} /> Registrar
                    </GradientButton>
                  </form>
                </div>

                {/* Recent Transactions */}
                <div className="glass-card-3d p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-cyan-400" /> Histórico de Lançamentos
                  </h2>
                  {commLoading ? (
                    <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : commissions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <DollarSign size={40} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum lançamento ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {commissions.map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{c.description}</p>
                            <p className="text-xs text-muted-foreground">{c.date}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${c.type === "income" ? "text-green-400" : "text-red-400"}`}>
                              {c.type === "income" ? "+" : "-"} R$ {c.amount.toLocaleString("pt-BR", {minimumFractionDigits: 2})}
                            </span>
                            <button onClick={() => handleDeleteCommission(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Subcomponents
// ============================================================

function SliderControl({
  label,
  description,
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm text-purple-400 font-mono">{value}%</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="voice-slider"
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">{leftLabel}</span>
        <span className="text-xs text-muted-foreground">{rightLabel}</span>
      </div>
    </div>
  );
}
