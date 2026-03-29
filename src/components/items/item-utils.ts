"use client";

/**
 * Item Type Utilities
 * Maps item types to icons and labels.
 * Includes statement preview extraction from Lexical JSON (first words; images as alt or "<imagem>").
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

/** Lexical node shape (minimal for traversal) */
type LexicalNodeLike = {
  type?: string;
  text?: string;
  altText?: string;
  children?: LexicalNodeLike[];
};

/**
 * Extract a short preview from a Lexical statement JSON: first words of text,
 * and for images use altText or the placeholder "<imagem>".
 */
export function getStatementPreview(statement: unknown, maxLength: number = 200): string {
  if (!statement) return "";
  if (typeof statement === "string") return statement.slice(0, maxLength);

  const parts: string[] = [];

  function walk(nodes: LexicalNodeLike[] | undefined): void {
    if (!nodes) return;
    for (const node of nodes) {
      if (node.type === "text" && typeof node.text === "string") {
        parts.push(node.text);
      } else if (node.type === "image") {
        const alt = typeof node.altText === "string" && node.altText.trim()
          ? node.altText.trim()
          : "<imagem>";
        parts.push(alt);
      } else if (Array.isArray(node.children)) {
        walk(node.children);
      }
    }
  }

  const root = statement as { root?: { children?: LexicalNodeLike[] } };
  walk(root.root?.children);

  const joined = parts.join(" ").replace(/\s+/g, " ").trim();
  return joined.slice(0, maxLength);
}
