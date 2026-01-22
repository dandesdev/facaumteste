"use client";

/**
 * Item Card Component
 * Displays an item in card view with rich preview
 */

import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { SelectionCheckbox } from "./SelectionCheckbox";
import { CopyableId } from "./CopyableId";
import { ITEM_TYPE_CONFIG, ITEM_STATUS_CONFIG } from "./item-utils";
import type { ItemType } from "./item-utils";

interface ItemCardProps {
  item: {
    id: string;
    type: string;
    status: string | null;
    statement: unknown;
    createdAt: Date;
    updatedAt: Date | null;
    creator?: { name: string | null } | null;
  };
  selected?: boolean;
  selectionOrder?: number;
  onSelect?: (id: string, selected: boolean) => void;
}

function extractTextFromStatement(statement: unknown): string {
  if (!statement) return "";
  if (typeof statement === "string") return statement;
  
  try {
    const json = statement as { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } };
    if (json.root?.children) {
      return json.root.children
        .flatMap((node) => node.children?.map((child) => child.text) ?? [])
        .filter(Boolean)
        .join(" ")
        .slice(0, 200);
    }
  } catch {
    // Fallback
  }
  
  return JSON.stringify(statement).slice(0, 200);
}

export function ItemCard({ item, selected, selectionOrder, onSelect }: ItemCardProps) {
  const typeConfig = ITEM_TYPE_CONFIG[item.type as ItemType];
  const statusKey = item.status ?? "draft";
  const statusConfig = ITEM_STATUS_CONFIG[statusKey] ?? ITEM_STATUS_CONFIG["draft"]!;
  const TypeIcon = typeConfig?.icon;
  const statementText = extractTextFromStatement(item.statement);
  
  const formattedDate = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString("pt-BR")
    : new Date(item.createdAt).toLocaleDateString("pt-BR");

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          {/* Checkbox with reserved space for order badge */}
          <div className="flex items-center min-w-[50px]">
            {onSelect && (
              <SelectionCheckbox
                selected={!!selected}
                order={selectionOrder}
                onSelect={(sel) => onSelect(item.id, sel)}
              />
            )}
          </div>
          {/* Item ID with copy button */}
          <CopyableId id={item.id} className="flex-1" />
          {/* Status badge */}
          <span
            className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
              statusConfig.variant === "default"
                ? "bg-primary text-primary-foreground"
                : statusConfig.variant === "secondary"
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {statusConfig.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Statement preview */}
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
          {statementText || "Sem conteúdo"}
        </p>
        {/* Footer: type, date, creator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1.5">
            {TypeIcon && <TypeIcon className={`h-3.5 w-3.5 ${typeConfig.color}`} />}
            <span>{typeConfig?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{formattedDate}</span>
            {item.creator?.name && <span>• {item.creator.name}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
