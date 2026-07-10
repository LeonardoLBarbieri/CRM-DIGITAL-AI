"use client";

import { useState, useEffect } from "react";
import {
  Settings, CheckCircle2, XCircle, Loader2, Wifi, WifiOff,
  Clock, MessageSquare, Bot, Save, RefreshCw, Sparkles, Shield
} from "lucide-react";

interface ConnectionStatus {
  status: "loading" | "connected" | "not_configured" | "error";
  message: string;
  details?: any;
}

const DAYS = [
  { key: "0", label: "Domingo" },
  { key: "1", label: "Segunda" },
  { key: "2", label: "Terça" },
  { key: "3", label: "Quarta" },
  { key: "4", label: "Quinta" },
  { key: "5", label: "Sexta" },
  { key: "6", label: "Sábado" },
];

export default function WhatsAppSettings({ onClose }: { onClose: () => void }) {
  // Conexão
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [verifyToken, setVerifyToken] = useState("lb_digital_token_123");
  const [brokerName, setBrokerName] = useState("Corretor");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "loading",
    message: "Verificando...",
  });

  // Automações
  const [enableWelcome, setEnableWelcome] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Olá {nome}! 👋 Sou o {corretor} da LB Digital. Vi que você tem interesse em nossos empreendimentos! Como posso ajudá-lo?"
  );
  const [enableOutOfHours, setEnableOutOfHours] = useState(true);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState(
    "Olá {nome}! No momento estamos fora do horário de atendimento. Retornaremos seu contato assim que possível! 🏠"
  );
  const [enableAIQualification, setEnableAIQualification] = useState(false);
  const [enableAutoTask, setEnableAutoTask] = useState(true);

  // Horário comercial
  const [businessHours, setBusinessHours] = useState<Record<string, { enabled: boolean; start: string; end: string }>>(() => {
    const defaults: Record<string, { enabled: boolean; start: string; end: string }> = {};
    for (let i = 0; i <= 6; i++) {
      defaults[i.toString()] = {
        enabled: i >= 1 && i <= 5,
        start: "08:00",
        end: "18:00",
      };
    }
    return defaults;
  });

  // UI
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<"connection" | "automation" | "hours">("connection");

  // ── Carregar configs do banco ────────────────────────────────────────────
  useEffect(() => {
    loadConfig();
    testConnection();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) return;
      const config: Record<string, string> = await res.json();

      if (config["whatsapp.accessToken"]) setAccessToken(config["whatsapp.accessToken"]);
      if (config["whatsapp.phoneNumberId"]) setPhoneNumberId(config["whatsapp.phoneNumberId"]);
      if (config["whatsapp.verifyToken"]) setVerifyToken(config["whatsapp.verifyToken"]);
      if (config["whatsapp.brokerName"]) setBrokerName(config["whatsapp.brokerName"]);

      if (config["automation.enableWelcome"]) setEnableWelcome(config["automation.enableWelcome"] === "true");
      if (config["automation.welcomeMessage"]) setWelcomeMessage(config["automation.welcomeMessage"]);
      if (config["automation.enableOutOfHours"]) setEnableOutOfHours(config["automation.enableOutOfHours"] === "true");
      if (config["automation.outOfHoursMessage"]) setOutOfHoursMessage(config["automation.outOfHoursMessage"]);
      if (config["automation.enableAIQualification"]) setEnableAIQualification(config["automation.enableAIQualification"] === "true");
      if (config["automation.enableAutoTask"]) setEnableAutoTask(config["automation.enableAutoTask"] === "true");

      if (config["businessHours"]) {
        try {
          setBusinessHours(JSON.parse(config["businessHours"]));
        } catch {}
      }
    } catch (e) {
      console.error("Erro ao carregar config:", e);
    }
  };

  // ── Testar conexão ────────────────────────────────────────────────────────
  const testConnection = async () => {
    setConnectionStatus({ status: "loading", message: "Testando conexão..." });
    try {
      const res = await fetch("/api/whatsapp/test");
      const data = await res.json();
      setConnectionStatus({
        status: data.status,
        message: data.message,
        details: data.details,
      });
    } catch {
      setConnectionStatus({
        status: "error",
        message: "Erro ao testar conexão",
      });
    }
  };

  // ── Salvar configs ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const configData: Record<string, string> = {
        "whatsapp.accessToken": accessToken,
        "whatsapp.phoneNumberId": phoneNumberId,
        "whatsapp.verifyToken": verifyToken,
        "whatsapp.brokerName": brokerName,
        "automation.enableWelcome": enableWelcome.toString(),
        "automation.welcomeMessage": welcomeMessage,
        "automation.enableOutOfHours": enableOutOfHours.toString(),
        "automation.outOfHoursMessage": outOfHoursMessage,
        "automation.enableAIQualification": enableAIQualification.toString(),
        "automation.enableAutoTask": enableAutoTask.toString(),
        "businessHours": JSON.stringify(businessHours),
      };

      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      // Retesta conexão após salvar
      testConnection();
    } catch (e) {
      console.error("Erro ao salvar:", e);
      alert("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  // ── Importar do .env ────────────────────────────────────────────────────
  const importFromEnv = () => {
    // Esses valores já estão no .env.local — populamos os campos para o user salvar
    setAccessToken("(será usado do .env.local automaticamente)");
    setPhoneNumberId("(será usado do .env.local automaticamente)");
    setVerifyToken("lb_digital_token_123");
  };

  const statusIcon = () => {
    switch (connectionStatus.status) {
      case "connected":
        return <CheckCircle2 size={20} className="text-emerald-400" />;
      case "not_configured":
        return <WifiOff size={20} className="text-yellow-400" />;
      case "error":
        return <XCircle size={20} className="text-red-400" />;
      default:
        return <Loader2 size={20} className="animate-spin text-blue-400" />;
    }
  };

  const statusColor = () => {
    switch (connectionStatus.status) {
      case "connected": return "border-emerald-500/30 bg-emerald-500/5";
      case "not_configured": return "border-yellow-500/30 bg-yellow-500/5";
      case "error": return "border-red-500/30 bg-red-500/5";
      default: return "border-blue-500/30 bg-blue-500/5";
    }
  };

  return (
    <div className="relative w-full max-w-2xl max-h-[90vh] bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Configurações WhatsApp</h2>
            <p className="text-xs text-zinc-400">Meta Cloud API • Automações • Horário Comercial</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"
        >
          ✕
        </button>
      </div>

      {/* Status Bar */}
      <div className={`mx-6 mt-4 p-3 rounded-xl border flex items-center justify-between ${statusColor()}`}>
        <div className="flex items-center gap-3">
          {statusIcon()}
          <div>
            <p className="text-sm font-medium text-white">{connectionStatus.message}</p>
            {connectionStatus.details?.phoneNumber && (
              <p className="text-xs text-zinc-400">
                Número: {connectionStatus.details.phoneNumber}
                {connectionStatus.details.verifiedName && ` • ${connectionStatus.details.verifiedName}`}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={testConnection}
          className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Retestar"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-1 mx-6 mt-4 p-1 bg-zinc-900 rounded-xl">
        {[
          { id: "connection" as const, label: "Conexão", icon: <Wifi size={14} /> },
          { id: "automation" as const, label: "Automações", icon: <Bot size={14} /> },
          { id: "hours" as const, label: "Horário", icon: <Clock size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeSection === tab.id
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content (scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* ── Seção: Conexão ────────────────────────────────────────────── */}
        {activeSection === "connection" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                <Shield size={12} className="inline mr-1" />
                Access Token (Meta Business)
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAVhoo..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Deixe vazio para usar o token do arquivo .env.local automaticamente
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Phone Number ID
              </label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="1196038610259888"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Verify Token (para registro do Webhook)
              </label>
              <input
                type="text"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="lb_digital_token_123"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nome do Corretor (usado nas mensagens automáticas)
              </label>
              <input
                type="text"
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                placeholder="Leonardo Barbieri"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            {/* Webhook URL info */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <p className="text-xs font-semibold text-blue-400 mb-1">URL do Webhook para registrar na Meta:</p>
              <code className="text-xs text-zinc-300 bg-zinc-900 px-2 py-1 rounded block break-all">
                https://seu-dominio.com/api/whatsapp/webhook
              </code>
              <p className="text-[10px] text-zinc-500 mt-1.5">
                Use um tunnel (ngrok, localtunnel, Cloudflare) para teste local
              </p>
            </div>
          </>
        )}

        {/* ── Seção: Automações ─────────────────────────────────────────── */}
        {activeSection === "automation" && (
          <>
            {/* Qualificação IA */}
            <ToggleCard
              icon={<Sparkles size={16} />}
              title="Qualificação por IA"
              description="A IA analisa mensagens de leads e responde automaticamente, classificando como Quente/Morno/Frio"
              enabled={enableAIQualification}
              onChange={setEnableAIQualification}
              color="purple"
            />

            {/* Mensagem de boas-vindas */}
            <ToggleCard
              icon={<MessageSquare size={16} />}
              title="Mensagem de Boas-vindas"
              description="Envia automaticamente quando um lead novo manda mensagem (dentro do horário comercial)"
              enabled={enableWelcome}
              onChange={setEnableWelcome}
              color="emerald"
            >
              {enableWelcome && !enableAIQualification && (
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none mt-3"
                  placeholder="Olá {nome}! ..."
                />
              )}
              {enableWelcome && !enableAIQualification && (
                <p className="text-[10px] text-zinc-500 mt-1">
                  Variáveis: {"{nome}"}, {"{corretor}"}, {"{empreendimento}"}, {"{cidade}"}
                </p>
              )}
              {enableWelcome && enableAIQualification && (
                <p className="text-[10px] text-purple-400 mt-2">
                  ⚡ A IA está ativa — ela responderá em vez da mensagem padrão
                </p>
              )}
            </ToggleCard>

            {/* Mensagem fora do horário */}
            <ToggleCard
              icon={<Clock size={16} />}
              title="Mensagem de Ausência"
              description="Envia quando um lead manda mensagem fora do horário comercial"
              enabled={enableOutOfHours}
              onChange={setEnableOutOfHours}
              color="yellow"
            >
              {enableOutOfHours && (
                <textarea
                  value={outOfHoursMessage}
                  onChange={(e) => setOutOfHoursMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none mt-3"
                  placeholder="Olá {nome}! ..."
                />
              )}
            </ToggleCard>

            {/* Tarefa automática */}
            <ToggleCard
              icon={<Settings size={16} />}
              title="Criar Tarefa Automática"
              description="Cria automaticamente uma tarefa de 'Retornar contato' quando um lead novo manda mensagem"
              enabled={enableAutoTask}
              onChange={setEnableAutoTask}
              color="blue"
            />
          </>
        )}

        {/* ── Seção: Horário Comercial ──────────────────────────────────── */}
        {activeSection === "hours" && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400 mb-3">
              Mensagens recebidas fora deste horário ativarão a mensagem de ausência.
            </p>
            {DAYS.map((day) => {
              const config = businessHours[day.key] || { enabled: false, start: "08:00", end: "18:00" };
              return (
                <div
                  key={day.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    config.enabled
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  <button
                    onClick={() =>
                      setBusinessHours((prev) => ({
                        ...prev,
                        [day.key]: { ...config, enabled: !config.enabled },
                      }))
                    }
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                      config.enabled
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {config.enabled && <span className="text-white text-xs">✓</span>}
                  </button>

                  <span className={`text-sm w-20 ${config.enabled ? "text-white" : "text-zinc-500"}`}>
                    {day.label}
                  </span>

                  {config.enabled && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="time"
                        value={config.start}
                        onChange={(e) =>
                          setBusinessHours((prev) => ({
                            ...prev,
                            [day.key]: { ...config, start: e.target.value },
                          }))
                        }
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                      <span className="text-zinc-500 text-xs">até</span>
                      <input
                        type="time"
                        value={config.end}
                        onChange={(e) =>
                          setBusinessHours((prev) => ({
                            ...prev,
                            [day.key]: { ...config, end: e.target.value },
                          }))
                        }
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t border-zinc-800/50 flex items-center justify-between shrink-0">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <>
              <CheckCircle2 size={16} /> Salvo!
            </>
          ) : (
            <>
              <Save size={16} /> Salvar Configurações
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente auxiliar: Toggle Card
// ─────────────────────────────────────────────────────────────────────────────
function ToggleCard({
  icon,
  title,
  description,
  enabled,
  onChange,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  color: string;
  children?: React.ReactNode;
}) {
  const colorClasses: Record<string, { border: string; bg: string; text: string; toggle: string }> = {
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400", toggle: "bg-emerald-500" },
    purple: { border: "border-purple-500/20", bg: "bg-purple-500/5", text: "text-purple-400", toggle: "bg-purple-500" },
    yellow: { border: "border-yellow-500/20", bg: "bg-yellow-500/5", text: "text-yellow-400", toggle: "bg-yellow-500" },
    blue: { border: "border-blue-500/20", bg: "bg-blue-500/5", text: "text-blue-400", toggle: "bg-blue-500" },
  };

  const c = colorClasses[color] || colorClasses.emerald;

  return (
    <div className={`p-4 rounded-xl border transition-colors ${enabled ? `${c.border} ${c.bg}` : "border-zinc-800 bg-zinc-900/50"}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${enabled ? c.text : "text-zinc-500"}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-semibold ${enabled ? "text-white" : "text-zinc-400"}`}>{title}</h4>
            <button
              onClick={() => onChange(!enabled)}
              className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? c.toggle : "bg-zinc-700"}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  enabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
