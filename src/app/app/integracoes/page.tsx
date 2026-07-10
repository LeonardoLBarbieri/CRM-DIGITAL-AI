"use client";

import { useState } from "react";
import { Settings, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

type ServiceName = "openai" | "elevenlabs" | "heygen";

interface ServiceStatus {
  loading: boolean;
  success: boolean | null;
  message: string | null;
  result: any;
}

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<ServiceName, ServiceStatus>>({
    openai: { loading: false, success: null, message: null, result: null },
    elevenlabs: { loading: false, success: null, message: null, result: null },
    heygen: { loading: false, success: null, message: null, result: null },
  });

  const testIntegration = async (service: ServiceName) => {
    setStatuses(prev => ({ ...prev, [service]: { ...prev[service], loading: true, success: null, message: null, result: null } }));
    
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service })
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatuses(prev => ({ ...prev, [service]: { loading: false, success: true, message: data.message, result: data.result } }));
      } else {
        setStatuses(prev => ({ ...prev, [service]: { loading: false, success: false, message: data.error, result: null } }));
      }
    } catch (error: any) {
      setStatuses(prev => ({ ...prev, [service]: { loading: false, success: false, message: error.message, result: null } }));
    }
  };

  const checkHeyGenStatus = async (videoId: string) => {
    try {
      const res = await fetch(`/api/heygen-video-status?video_id=${videoId}`);
      const data = await res.json();
      if (data.status === "completed" && data.videoUrl) {
        setStatuses(prev => ({ 
          ...prev, 
          heygen: { 
            ...prev.heygen, 
            result: { ...prev.heygen.result, videoUrl: data.videoUrl, status: 'completed' } 
          } 
        }));
      } else {
        alert(`Status atual: ${data.status} (${data.progress}%)`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200 pb-12">
      <SectionHeader
        icon={<Settings size={20} />}
        title="Integrações e APIs"
        subtitle="Valide suas chaves e teste as integrações reais com OpenAI, ElevenLabs e HeyGen."
        color="purple"
      />

      <div className="grid gap-4">
        {/* OpenAI Card */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              OpenAI
              {statuses.openai.success === true && <CheckCircle className="text-emerald-500" size={18} />}
              {statuses.openai.success === false && <XCircle className="text-destructive" size={18} />}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Geração de textos para campanhas, anúncios e scripts.</p>
            {statuses.openai.message && (
              <div className={`mt-3 text-sm p-3 rounded-lg border ${statuses.openai.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                {statuses.openai.success ? (
                  <>
                    <p className="font-medium">{statuses.openai.message}</p>
                    <p className="mt-1 opacity-90">"{statuses.openai.result}"</p>
                  </>
                ) : (
                  <p>{statuses.openai.message}</p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => testIntegration("openai")}
            disabled={statuses.openai.loading}
            className="btn-primary py-2 px-4 whitespace-nowrap min-w-[140px] justify-center"
          >
            {statuses.openai.loading ? <Loader2 size={16} className="animate-spin" /> : (
              <><Play size={16} /> Testar Conexão</>
            )}
          </button>
        </div>

        {/* ElevenLabs Card */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              ElevenLabs
              {statuses.elevenlabs.success === true && <CheckCircle className="text-emerald-500" size={18} />}
              {statuses.elevenlabs.success === false && <XCircle className="text-destructive" size={18} />}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Clonagem de voz e conversão de texto para áudio ultra-realista.</p>
            {statuses.elevenlabs.message && (
              <div className={`mt-3 text-sm p-3 rounded-lg border flex flex-col gap-2 ${statuses.elevenlabs.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                <p className={statuses.elevenlabs.success ? "font-medium" : ""}>{statuses.elevenlabs.message}</p>
                {statuses.elevenlabs.success && statuses.elevenlabs.result && (
                  <audio src={statuses.elevenlabs.result} controls className="h-8 mt-2 w-full max-w-sm" />
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => testIntegration("elevenlabs")}
            disabled={statuses.elevenlabs.loading}
            className="btn-primary py-2 px-4 whitespace-nowrap min-w-[140px] justify-center"
          >
            {statuses.elevenlabs.loading ? <Loader2 size={16} className="animate-spin" /> : (
              <><Play size={16} /> Testar Áudio</>
            )}
          </button>
        </div>

        {/* HeyGen Card */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              HeyGen
              {statuses.heygen.success === true && <CheckCircle className="text-emerald-500" size={18} />}
              {statuses.heygen.success === false && <XCircle className="text-destructive" size={18} />}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Geração de vídeo com Avatar IA. <span className="text-amber-600 font-medium">Aviso: O teste consome créditos reais.</span></p>
            {statuses.heygen.message && (
              <div className={`mt-3 text-sm p-3 rounded-lg border ${statuses.heygen.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                <p className={statuses.heygen.success ? "font-medium" : ""}>{statuses.heygen.message}</p>
                {statuses.heygen.success && statuses.heygen.result && !statuses.heygen.result.videoUrl && (
                  <div className="mt-3 flex gap-2">
                     <p className="text-xs">Video ID: {statuses.heygen.result.videoId}</p>
                     <button onClick={() => checkHeyGenStatus(statuses.heygen.result.videoId)} className="text-xs underline text-emerald-800">Verificar Status</button>
                  </div>
                )}
                {statuses.heygen.success && statuses.heygen.result && statuses.heygen.result.videoUrl && (
                  <video src={statuses.heygen.result.videoUrl} controls className="mt-3 rounded-lg border w-full max-w-sm" />
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => testIntegration("heygen")}
            disabled={statuses.heygen.loading}
            className="btn-primary py-2 px-4 whitespace-nowrap min-w-[140px] justify-center bg-amber-500 hover:bg-amber-600"
          >
            {statuses.heygen.loading ? <Loader2 size={16} className="animate-spin" /> : (
              <><Play size={16} /> Testar Vídeo</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
