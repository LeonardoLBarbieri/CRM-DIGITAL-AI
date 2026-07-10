"use client";

import { useState, useEffect } from "react";
import { Sparkles, Image as ImageIcon, Send, Copy, Check, Loader2 } from "lucide-react";

export function InstagramGenerator() {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [style, setStyle] = useState("Informativo & Profissional");
  const [loading, setLoading] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [generatingImages, setGeneratingImages] = useState<{ [key: number]: boolean }>({});
  const [generatedImages, setGeneratedImages] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetch("/api/properties")
      .then(r => r.json())
      .then(data => {
        if (data.properties) setProperties(data.properties);
      })
      .catch(console.error);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return alert("Selecione um empreendimento.");

    setLoading(true);
    setGeneratedPosts([]);

    const prop = properties.find(p => p.id === selectedProperty);

    try {
      const res = await fetch("/api/instagram-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          propertyName: prop.name, 
          keyTopics: prop.keyTopics,
          style 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPosts(data.posts || []);
      } else {
        alert("Erro ao gerar ideias de post.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateImage = async (index: number, postText: string) => {
    setGeneratingImages(prev => ({ ...prev, [index]: true }));
    try {
      // Summarize the post text to create a good image prompt
      const prompt = `Crie uma imagem realista de alta qualidade para o Instagram relacionada ao seguinte texto, focado no mercado imobiliário: ${postText.substring(0, 150)}`;
      
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedImages(prev => ({ ...prev, [index]: data.url }));
      } else {
        alert("Erro ao gerar imagem. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar à API de imagens.");
    } finally {
      setGeneratingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <header className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-500">
          <Sparkles size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ideias para Instagram</h1>
          <p className="text-muted-foreground mt-1">Gere Copys e ideias de carrossel ou Reels usando IA.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6 border border-border/50">
            <h2 className="font-semibold text-lg mb-4">Configurar Post</h2>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Empreendimento (Cadastrado)</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white text-sm rounded-lg focus:ring-pink-500 focus:border-pink-500 block p-3"
                  required
                >
                  <option value="">Selecione...</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Estilo / Tom de Voz</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white text-sm rounded-lg focus:ring-pink-500 focus:border-pink-500 block p-3"
                >
                  <option>Informativo & Profissional</option>
                  <option>Descontraído & Stories</option>
                  <option>Luxo & Exclusividade</option>
                  <option>Urgência & Escassez</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedProperty}
                className="w-full mt-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Gerar Ideias
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {loading && (
            <div className="h-64 flex flex-col items-center justify-center glass-panel rounded-2xl border border-dashed border-border/50 text-muted-foreground">
              <Loader2 size={32} className="animate-spin mb-4 text-pink-500" />
              <p>Analisando os diferenciais do empreendimento e escrevendo...</p>
            </div>
          )}

          {!loading && generatedPosts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Opções de Posts Geradas <span className="px-2 py-1 bg-pink-500/10 text-pink-400 text-xs rounded-full">{generatedPosts.length}</span>
              </h3>
              
              {generatedPosts.map((post, idx) => (
                <div key={idx} className="glass-panel rounded-2xl p-6 relative group border border-border/50 hover:border-pink-500/30 transition-colors">
                  <button
                    onClick={() => copyToClipboard(post, idx)}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                    title="Copiar texto"
                  >
                    {copiedIndex === idx ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                  <div className="flex flex-col gap-4 mb-3">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0 mt-1">
                        <ImageIcon size={14} className="text-white" />
                      </div>
                      <div className="flex-1 whitespace-pre-wrap font-medium text-foreground/90 text-sm leading-relaxed pr-8">
                        {post}
                      </div>
                    </div>
                    
                    {/* Image Generation Section */}
                    <div className="ml-12">
                      {generatedImages[idx] ? (
                        <div className="mt-2 rounded-xl overflow-hidden border border-border/50 max-w-sm">
                          <img src={generatedImages[idx]} alt="Imagem gerada pela IA" className="w-full h-auto object-cover aspect-square" />
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleGenerateImage(idx, post)}
                          disabled={generatingImages[idx]}
                          className="mt-2 text-xs font-medium px-4 py-2 bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {generatingImages[idx] ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                          {generatingImages[idx] ? 'Gerando Imagem...' : 'Gerar Imagem com IA'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && generatedPosts.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center glass-panel rounded-2xl border border-dashed border-border/50 text-muted-foreground text-center px-6">
              <Sparkles size={48} className="mb-4 opacity-20" />
              <p>Selecione um empreendimento ao lado para gerar copys prontas para suas redes sociais.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
