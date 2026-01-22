"use client";

/**
 * Items Filters Component
 * Search, type, and status filters for item bank
 */

import { Search, Trash2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ITEM_TYPES, ITEM_TYPE_CONFIG, type ItemType } from "./item-utils";

interface ItemsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: ItemType | "all";
  onTypeChange: (value: ItemType | "all") => void;
  status: "all" | "draft" | "published" | "archived" | "deleted";
  onStatusChange: (value: "all" | "draft" | "published" | "archived" | "deleted") => void;
}

export function ItemsFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  status,
  onStatusChange,
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

      {/* Status filter */}
      <Select value={status} onValueChange={(v) => onStatusChange(v as "all" | "draft" | "published" | "archived" | "deleted")}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="draft">Rascunho</SelectItem>
          <SelectItem value="published">Publicado</SelectItem>
          <SelectItem value="archived">Arquivado</SelectItem>
          <SelectSeparator />
          <SelectItem value="deleted" className="text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Lixeira
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
