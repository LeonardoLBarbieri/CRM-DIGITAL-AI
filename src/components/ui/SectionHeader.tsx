"use client";
import { ReactNode } from "react";

interface SectionHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export function SectionHeader({ icon, title, subtitle, badge, actions }: SectionHeaderProps) {
  return (
    <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          {icon && <span className="text-purple-400">{icon}</span>}
          <span>{title}</span>
          {badge}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
