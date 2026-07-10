"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface GradientButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "accent" | "success" | "danger" | "creative" | "warm";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
}

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-white/90 border border-transparent shadow-sm",
  accent: "bg-[#0070F3] text-white hover:bg-[#0060d1] border border-transparent shadow-sm",
  success: "bg-success text-white hover:bg-success/90 border border-transparent shadow-sm",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent shadow-sm",
  creative: "bg-[#7C3AED] text-white hover:bg-[#6D28D9] border border-transparent shadow-sm",
  warm: "bg-warning text-black hover:bg-warning/90 border border-transparent shadow-sm",
};

const sizes = {
  sm: "py-2 px-3 text-xs",
  md: "py-2.5 px-4 text-sm",
  lg: "py-3 px-6 text-base",
};

export function GradientButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  loadingText = "Processando...",
  variant = "primary",
  size = "md",
  fullWidth = true,
  className = "",
}: GradientButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed rounded-[6px] ${sizes[size]} font-medium transition-colors flex items-center justify-center gap-2 group ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
