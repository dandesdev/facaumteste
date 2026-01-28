"use client";

/**
 * Item Type Utilities
 * Maps item types to icons and labels
 */

import {
  CircleDot,
  CheckSquare,
  ToggleLeft,
  ListChecks,
  TextCursorInput,
  GitCompare,
  type LucideIcon,
} from "lucide-react";

export const ITEM_TYPES = [
  "mcq_single",
  "mcq_multiple",
  "true_false",
  "true_false_multi",
  "fill_blank",
  "matching",
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

export const ITEM_TYPE_CONFIG: Record<
  ItemType,
  { icon: LucideIcon; label: string; color: string }
> = {
  mcq_single: {
    icon: CircleDot,
    label: "Múltipla escolha",
    color: "text-blue-600",
  },
  mcq_multiple: {
    icon: CheckSquare,
    label: "Múltipla seleção",
    color: "text-purple-600",
  },
  true_false: {
    icon: ToggleLeft,
    label: "Verdadeiro/Falso",
    color: "text-green-600",
  },
  true_false_multi: {
    icon: ListChecks,
    label: "V/F Múltiplo",
    color: "text-emerald-600",
  },
  fill_blank: {
    icon: TextCursorInput,
    label: "Preencher lacunas",
    color: "text-orange-600",
  },
  matching: {
    icon: GitCompare,
    label: "Correspondência",
    color: "text-pink-600",
  },
};

export const ITEM_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }
> = {
  draft: { label: "Rascunho", variant: "secondary" },
  published: { label: "Publicado", variant: "success" },
  archived: { label: "Arquivado", variant: "outline" },
  deleted: { label: "Excluído", variant: "destructive" },
};
