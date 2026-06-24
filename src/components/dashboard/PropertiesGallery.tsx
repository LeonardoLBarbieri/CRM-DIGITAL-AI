"use client";

import { useState, useEffect } from "react";
import { Building2, Upload, FileText, Download, Sparkles, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export function PropertiesGallery() {
  const { data: session } = useSession();
  const isGerente = session?.user?.role === "GERENTE";

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return alert("Preencha nome e selecione arquivo.");

    setUploading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setName("");
        setFile(null);
        fetchProperties();
        alert("Empreendimento cadastrado e processado pela IA!");
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao subir arquivo.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao conectar com o servidor.");
    } finally {
      setUploading(false);
    }
  };

  const parseTopics = (topicsString: string) => {
    try {
      // Tenta fazer parse se a IA retornou JSON
      const parsed = JSON.parse(topicsString);
      if (Array.isArray(parsed)) return parsed;
      if (parsed.topics) return parsed.topics;
    } catch {
      // Se não for JSON, quebra por linhas ou retorna direto
    }
    return topicsString.replace(/[\[\]"]/g, "").split(",").filter(t => t.trim());
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <header className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
          <Building2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Repositório de Empreendimentos</h1>
          <p className="text-muted-foreground mt-1">
            Material de vendas e diferenciais extraídos automaticamente por IA.
          </p>
        </div>
      </header>

      {/* Upload Section - Only for Managers */}
      {isGerente && (
        <div className="glass-panel rounded-2xl p-6 border-dashed border-2 border-border/50">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Upload size={20} className="text-blue-400" /> Cadastrar Novo Material (Gerente)
          </h3>
          <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium">Nome do Empreendimento</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Ex: Residencial Lumina"
              />
            </div>
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium">Arquivo PDF do Material</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Processar com IA
            </button>
          </form>
        </div>
      )}

      {/* Gallery Section */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => {
            const topics = parseTopics(prop.keyTopics || "");
            
            return (
              <div key={prop.id} className="glass-panel rounded-2xl p-6 flex flex-col hover:shadow-xl transition-shadow group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <FileText size={20} />
                  </div>
                  <a
                    href={prop.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white/5 hover:bg-blue-500 hover:text-white rounded-lg transition-colors text-muted-foreground flex items-center gap-2 text-sm font-medium"
                  >
                    <Download size={16} /> Baixar
                  </a>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{prop.name}</h3>
                
                <div className="mt-4 flex-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-400" /> Tópicos Chaves (IA)
                  </h4>
                  <ul className="space-y-2">
                    {Array.isArray(topics) ? topics.map((t: string, i: number) => (
                      <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{t}</span>
                      </li>
                    )) : (
                      <li className="text-sm text-foreground/80">{topics as string}</li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    const link = `${window.location.origin}${prop.filePath}`;
                    navigator.clipboard.writeText(`Confira o material do ${prop.name}:\n${link}`);
                    alert("Link copiado para enviar ao cliente!");
                  }}
                  className="mt-6 w-full py-2.5 rounded-xl border border-border/50 hover:bg-white/5 font-medium text-sm transition-colors"
                >
                  Copiar Link para Cliente
                </button>
              </div>
            );
          })}
          {properties.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-2xl glass-panel">
              Nenhum material cadastrado ainda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
