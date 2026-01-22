"use client";

/**
 * Items Filters Component
 * Search, type, status filters, and trash toggle for item bank
 */

import { Search, Trash2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ITEM_TYPES, ITEM_TYPE_CONFIG, type ItemType } from "./item-utils";

interface ItemsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: ItemType | "all";
  onTypeChange: (value: ItemType | "all") => void;
  status: "all" | "draft" | "published" | "archived";
  onStatusChange: (value: "all" | "draft" | "published" | "archived") => void;
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
}

export function ItemsFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
  showDeleted,
  onShowDeletedChange,
}: ItemsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID ou texto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Type filter */}
      <Select value={type} onValueChange={(v) => onTypeChange(v as ItemType | "all")}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">Todos os tipos</SelectItem>
          {ITEM_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {ITEM_TYPE_CONFIG[t].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter - disabled when viewing trash */}
      <Select
        value={showDeleted ? "all" : status}
        onValueChange={(v) => onStatusChange(v as "all" | "draft" | "published" | "archived")}
        disabled={showDeleted}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="draft">Rascunho</SelectItem>
          <SelectItem value="published">Publicado</SelectItem>
          <SelectItem value="archived">Arquivado</SelectItem>
        </SelectContent>
      </Select>

      {/* Trash toggle */}
      <Button
        variant={showDeleted ? "destructive" : "outline"}
        size="sm"
        onClick={() => onShowDeletedChange(!showDeleted)}
        className={showDeleted ? "" : "text-muted-foreground hover:text-foreground"}
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        {showDeleted ? "Sair da lixeira" : "Lixeira"}
      </Button>
    </div>
  );
}
