"use client";

/**
 * Item Card Component
 * Displays an item in card view with rich preview.
 * Card is clickable to edit; checkbox and preview button do not trigger navigation.
 */

import { useRouter } from "next/navigation";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Globe, Lock, Eye } from "lucide-react";
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
    isPublic?: boolean | null;
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
  const router = useRouter();
  const typeConfig = ITEM_TYPE_CONFIG[item.type as ItemType];
  const statusKey = item.status ?? "draft";
  const statusConfig = ITEM_STATUS_CONFIG[statusKey] ?? ITEM_STATUS_CONFIG["draft"]!;
  const TypeIcon = typeConfig?.icon;
  const statementText = extractTextFromStatement(item.statement);
  const isPublic = item.isPublic ?? false;

  const formattedDate = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString("pt-BR")
    : new Date(item.createdAt).toLocaleDateString("pt-BR");

  const handleCardClick = () => router.push(`/dashboard/items/${item.id}`);
  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/dashboard/items/${item.id}/preview`);
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow group flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center min-w-[50px]" onClick={(e) => e.stopPropagation()}>
            {onSelect && (
              <SelectionCheckbox
                selected={!!selected}
                order={selectionOrder}
                onSelect={(sel) => onSelect(item.id, sel)}
              />
            )}
          </div>
          <CopyableId id={item.id} className="flex-1" />
          <div className="flex items-center gap-1.5 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center text-muted-foreground">
                    {isPublic ? (
                      <Globe className="h-3.5 w-3.5" aria-label="Público" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" aria-label="Privado" />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{isPublic ? "Público" : "Privado"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">
          {statementText || "Sem conteúdo"}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1.5">
            {TypeIcon && <TypeIcon className={`h-3.5 w-3.5 ${typeConfig.color}`} />}
            <span>{typeConfig?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{formattedDate}</span>
            {item.creator?.name && <span>• {item.creator.name}</span>}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 -mr-1"
                    onClick={handlePreviewClick}
                    aria-label="Visualizar"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualizar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
