"use client";
import { ReactNode } from "react";

type ColorType = "blue" | "orange" | "emerald" | "indigo" | "rose" | "teal" | "purple" | "pink" | "cyan" | "fuchsia" | "neutral";

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  color?: ColorType;
}

const iconColorMap: Record<ColorType, string> = {
  blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200",
  orange: "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-orange-200",
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-200",
  indigo: "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-200",
  rose: "bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-200",
  teal: "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-teal-200",
  purple: "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-200",
  pink: "bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-200",
  cyan: "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-cyan-200",
  fuchsia: "bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-fuchsia-200",
  neutral: "bg-secondary text-foreground shadow-none",
};

const titleColorMap: Record<ColorType, string> = {
  blue: "text-blue-700",
  orange: "text-orange-700",
  emerald: "text-emerald-700",
  indigo: "text-indigo-700",
  rose: "text-rose-700",
  teal: "text-teal-700",
  purple: "text-purple-700",
  pink: "text-pink-700",
  cyan: "text-cyan-700",
  fuchsia: "text-fuchsia-700",
  neutral: "text-foreground",
};

export function SectionHeader({ icon, title, subtitle, badge, actions, color = "neutral" }: SectionHeaderProps) {
  return (
    <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconColorMap[color]} shrink-0 shadow-md`}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 ${titleColorMap[color]}`}>
            <span>{title}</span>
            {badge}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
