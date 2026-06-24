import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TemplateVars, TaskTiming } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Substitui placeholders {nome}, {empreendimento}, {cidade}, {corretor}
 * no template pelos valores fornecidos. Placeholders sem valor correspondente
 * são substituídos por string vazia.
 */
export function renderTemplate(tpl: string, vars: TemplateVars): string {
  return tpl
    .replace(/{nome}/g, vars.nome ?? "")
    .replace(/{empreendimento}/g, vars.empreendimento ?? "")
    .replace(/{cidade}/g, vars.cidade ?? "")
    .replace(/{corretor}/g, vars.corretor ?? "")
}

/**
 * Classifica o timing de uma tarefa com base na data de vencimento:
 * - 'overdue'  → dueAt já passou
 * - 'today'    → dueAt é hoje (mesmo dia calendário)
 * - 'upcoming' → dueAt está entre amanhã e hoje + 7 dias (inclusive)
 * - 'future'   → dueAt é além de 7 dias
 */
export function classifyTaskTiming(dueAt: Date): TaskTiming {
  const now = new Date()

  // Início e fim do dia atual (meia-noite)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTomorrow = new Date(startOfToday)
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)
  const startOfIn8Days = new Date(startOfToday)
  startOfIn8Days.setDate(startOfIn8Days.getDate() + 8)

  if (dueAt < startOfToday) return "overdue"
  if (dueAt < startOfTomorrow) return "today"
  if (dueAt < startOfIn8Days) return "upcoming"
  return "future"
}
