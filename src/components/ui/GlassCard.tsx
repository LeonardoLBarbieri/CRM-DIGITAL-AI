"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "purple" | "cyan" | "green" | "warm" | "none";
  padding?: "sm" | "md" | "lg";
}

export function GlassCard({
  children,
  className = "",
  hover = true,
  glow = "none",
  padding = "md",
}: GlassCardProps) {
  const paddings = { sm: "p-4", md: "p-6", lg: "p-8" };
  const glowColors = {
    purple: "hover:border-purple-500/25 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)]",
    cyan: "hover:border-cyan-500/25 hover:shadow-[0_0_30px_rgba(8,145,178,0.15)]",
    green: "hover:border-green-500/25 hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]",
    warm: "hover:border-amber-500/25 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    none: "",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
      className={`${hover ? "glass-panel" : "glass-panel-static"} rounded-2xl ${paddings[padding]} ${glowColors[glow]} ${className}`}
    >
      {children}
    </motion.div>
  );
}
