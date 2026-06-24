"use client";
import {
  BrainCircuit, Video, Mic, PenTool, Sparkles,
  MessageSquare, Image as ImageIcon, DollarSign,
  ArrowRight, ChevronRight, BarChart3, CalendarDays,
  Megaphone, Zap, Shield, Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] },
  }),
};

const features = [
  { icon: <BarChart3 size={24} />, title: "Dashboard Gerencial", desc: "Visão completa do seu negócio com métricas em tempo real, leads, tarefas e desempenho financeiro.", color: "from-purple-500 to-indigo-500" },
  { icon: <MessageSquare size={24} />, title: "CRM com WhatsApp", desc: "Kanban inteligente para gerenciar leads com integração direta ao WhatsApp Business.", color: "from-cyan-500 to-teal-500" },
  { icon: <Megaphone size={24} />, title: "Disparos em Massa", desc: "Campanhas de WhatsApp automatizadas com templates personalizáveis e tracking.", color: "from-pink-500 to-rose-500" },
  { icon: <CalendarDays size={24} />, title: "Gestão de Tarefas", desc: "Organize seu dia com tarefas vinculadas a leads e acompanhamento de prazos.", color: "from-amber-500 to-orange-500" },
  { icon: <PenTool size={24} />, title: "Roteiros com IA", desc: "Gere roteiros persuasivos para anúncios imobiliários usando inteligência artificial.", color: "from-emerald-500 to-teal-500" },
  { icon: <Mic size={24} />, title: "Clone de Voz", desc: "Clone sua voz com ElevenLabs e gere áudios profissionais para seus anúncios.", color: "from-violet-500 to-purple-500" },
  { icon: <Video size={24} />, title: "Avatar Digital 4K", desc: "Crie vídeos hiper-realistas com seu avatar digital via HeyGen em qualquer formato.", color: "from-blue-500 to-cyan-500" },
  { icon: <ImageIcon size={24} />, title: "Studio 3D", desc: "Gere renders fotorrealistas de empreendimentos com DALL-E e planeje conteúdo social.", color: "from-indigo-500 to-violet-500" },
  { icon: <DollarSign size={24} />, title: "Gestão Financeira", desc: "Controle comissões, despesas, metas mensais e reserve sua margem de segurança.", color: "from-green-500 to-emerald-500" },
];

const steps = [
  { n: "1", title: "Configure suas APIs", desc: "Conecte ElevenLabs, HeyGen e OpenAI em poucos minutos." },
  { n: "2", title: "Clone sua voz e avatar", desc: "Envie amostras de áudio e treine seu avatar digital com um vídeo de 2 minutos." },
  { n: "3", title: "Escale seus resultados", desc: "Gere conteúdo, gerencie leads e automatize disparos em um só lugar." },
];

const stats = [
  { value: 500, suffix: "+", label: "Leads Gerenciados" },
  { value: 1200, suffix: "+", label: "Áudios Gerados" },
  { value: 98, suffix: "%", label: "Satisfação" },
  { value: 24, suffix: "/7", label: "Disponibilidade" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-sidebar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BrainCircuit size={28} className="text-purple-400" />
              <span className="text-lg font-bold text-gradient">LB Digital AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
              <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Resultados</a>
            </div>
            <Link href="/app" className="btn-primary text-sm flex items-center gap-2 py-2.5 px-5">
              Acessar Plataforma <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative min-h-screen flex items-center justify-center aurora-bg">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-300 text-sm font-medium mb-8"
          >
            <Sparkles size={14} />
            Powered by AI — ElevenLabs · HeyGen · OpenAI
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6"
          >
            Seu Avatar Digital
            <br />
            <span className="text-gradient-hero">Imobiliário com IA</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Plataforma completa para corretores: clone sua voz, gere vídeos 4K com avatar digital,
            gerencie leads com CRM inteligente e automatize campanhas de WhatsApp.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/app" className="btn-primary text-base flex items-center justify-center gap-2 py-4 px-8 rounded-xl">
              <Zap size={20} />
              Começar Agora
            </Link>
            <a href="#features" className="btn-ghost text-base flex items-center justify-center gap-2 py-4 px-8 rounded-xl border border-border">
              Explorar Funcionalidades
              <ChevronRight size={18} />
            </a>
          </motion.div>

          {/* Floating glow orbs */}
          <div className="absolute top-1/4 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>
      </section>

      {/* ============ FEATURES GRID ============ */}
      <section id="features" className="relative py-24 sm:py-32 mesh-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Tudo em um só lugar
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              9 ferramentas poderosas
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Do primeiro contato ao fechamento — com inteligência artificial em cada etapa.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="feature-card group"
              >
                <div className={`feature-icon-wrapper bg-gradient-to-br ${f.color}`}>
                  <div className="text-white">{f.icon}</div>
                </div>
                <h3 className="text-lg font-semibold mb-2 relative z-10">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed relative z-10">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-cyan-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Simples e rápido
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Como funciona
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {steps.map((step, i) => (
              <div key={step.n}>
                <motion.div
                  variants={fadeUp}
                  custom={i}
                  className="flex gap-5 items-start"
                >
                  <div className="step-number">{step.n}</div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </div>
                </motion.div>
                {i < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section id="stats" className="py-24 sm:py-32 relative mesh-gradient">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-green-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Resultados reais
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Números que impressionam
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="glass-panel rounded-2xl stat-card"
              >
                <div className="stat-number text-gradient">
                  <AnimatedCounter end={s.value} suffix={s.suffix} />
                </div>
                <p className="text-muted-foreground text-sm">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 aurora-bg opacity-50" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Pronto para revolucionar
              <br />
              <span className="text-gradient-hero">seus anúncios?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              Comece agora mesmo a usar IA para criar conteúdo imobiliário de alto impacto
              e fechar mais negócios.
            </p>
            <Link href="/app" className="btn-primary text-lg inline-flex items-center gap-3 py-4 px-10 rounded-xl">
              <BrainCircuit size={22} />
              Acessar a Plataforma
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <BrainCircuit size={20} className="text-purple-400" />
              <span className="font-semibold text-gradient">LB Digital AI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
              <a href="#how-it-works" className="hover:text-foreground transition-colors">Como funciona</a>
              <a href="#stats" className="hover:text-foreground transition-colors">Resultados</a>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield size={14} />
              <span>© {new Date().getFullYear()} Leonardo Barbieri. Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
