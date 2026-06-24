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
  primary: "from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/25",
  accent: "from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-cyan-900/25",
  success: "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/25",
  danger: "from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/25",
  creative: "from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-900/25",
  warm: "from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/25",
};

const sizes = {
  sm: "py-2.5 px-4 text-sm",
  md: "py-3.5 px-6 text-sm",
  lg: "py-4 px-8 text-base",
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
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`bg-gradient-to-r ${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl ${sizes[size]} font-semibold shadow-lg transition-all flex items-center justify-center gap-2 group ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
