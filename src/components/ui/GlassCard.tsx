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
    purple: "hover:border-[#7C3AED]",
    cyan: "hover:border-[#0070F3]",
    green: "hover:border-success",
    warm: "hover:border-warning",
    none: "",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`${hover ? "glass-panel" : "glass-panel-static"} rounded-xl ${paddings[padding]} ${glowColors[glow]} transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
}
