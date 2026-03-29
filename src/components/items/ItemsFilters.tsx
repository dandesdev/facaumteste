"use client";

/**
 * Items Filters Component
 * Search, type, status, visibility filters (multi-select checkboxes) and trash toggle for item bank
 */

import { Search, Trash2 } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "~/components/ui/sidebar";
import { ITEM_TYPES, ITEM_TYPE_CONFIG, type ItemType } from "./item-utils";

export type VisibilityFilter = "all" | "public" | "private";

export const ITEM_STATUS_FILTER_VALUES = ["draft", "published", "archived"] as const;

const STATUS_OPTIONS: { value: (typeof ITEM_STATUS_FILTER_VALUES)[number]; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
];

const VISIBILITY_OPTIONS = [
  { value: "public" as const, label: "Públicos" },
  { value: "private" as const, label: "Privados" },
];

export type ItemsFiltersVariant = "toolbar" | "sidebar";

interface ItemsFiltersProps {
  variant?: ItemsFiltersVariant;
  search: string;
  onSearchChange: (value: string) => void;
  selectedTypes: ItemType[];
  onSelectedTypesChange: (value: ItemType[]) => void;
  selectedStatuses: ("draft" | "published" | "archived")[];
  onSelectedStatusesChange: (value: ("draft" | "published" | "archived")[]) => void;
  visibility: VisibilityFilter;
  onVisibilityChange: (value: VisibilityFilter) => void;
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
}

export function ItemsFilters({
  variant = "toolbar",
  search,
  onSearchChange,
  selectedTypes,
  onSelectedTypesChange,
  selectedStatuses,
  onSelectedStatusesChange,
  visibility,
  onVisibilityChange,
  showDeleted,
  onShowDeletedChange,
}: ItemsFiltersProps) {
  const isSidebar = variant === "sidebar";
  const statusCount = ITEM_STATUS_FILTER_VALUES.length;

  /** Empty array = implicit "all" (same API as full selection). */
  const allTypesSelected =
    selectedTypes.length === 0 || selectedTypes.length === ITEM_TYPES.length;
  const allStatusesSelected =
    selectedStatuses.length === 0 || selectedStatuses.length === statusCount;

  const typeRowChecked = (t: ItemType) =>
    selectedTypes.length === 0 || selectedTypes.includes(t);

  const statusRowChecked = (s: (typeof ITEM_STATUS_FILTER_VALUES)[number]) =>
    selectedStatuses.length === 0 || selectedStatuses.includes(s);

  const toggleType = (t: ItemType) => {
    if (selectedTypes.length === 0) {
      onSelectedTypesChange(ITEM_TYPES.filter((x) => x !== t));
      return;
    }
    if (selectedTypes.includes(t)) {
      const next = selectedTypes.filter((x) => x !== t);
      onSelectedTypesChange(next);
    } else {
      const next = [...selectedTypes, t].sort();
      onSelectedTypesChange(
        next.length === ITEM_TYPES.length ? [] : next,
      );
    }
  };

  const toggleStatus = (s: (typeof STATUS_OPTIONS)[number]["value"]) => {
    if (selectedStatuses.length === 0) {
      onSelectedStatusesChange(
        ITEM_STATUS_FILTER_VALUES.filter((x) => x !== s),
      );
      return;
    }
    if (selectedStatuses.includes(s)) {
      onSelectedStatusesChange(selectedStatuses.filter((x) => x !== s));
    } else {
      const next = [...selectedStatuses, s].sort();
      onSelectedStatusesChange(
        next.length === statusCount ? [] : next,
      );
    }
  };

  const sectionClass = isSidebar ? "flex flex-col gap-2" : "flex flex-col gap-1.5";
  const optionsClass = cn(
    isSidebar ? "flex flex-col gap-2 pl-0.5" : "flex flex-wrap items-center gap-4",
  );
  const optionLabelClass = "flex items-center gap-2 cursor-pointer text-sm leading-none";

  const searchBlock = (
    <div className={cn("relative w-full", !isSidebar && "flex-1 min-w-[200px] max-w-[300px]")}>
      <Label className="sr-only">Buscar por ID ou texto</Label>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por ID ou texto..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9"
      />
    </div>
  );

  const typeBlock = (
    <div className={sectionClass}>
      {isSidebar ? (
        <SidebarGroupLabel className="px-0">Tipo</SidebarGroupLabel>
      ) : (
        <Label className="text-xs text-muted-foreground">Tipo</Label>
      )}
      <div className={optionsClass}>
        <label className={optionLabelClass}>
          <Checkbox
            checked={allTypesSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectedTypesChange([]);
              } else {
                onSelectedTypesChange([ITEM_TYPES[0]]);
              }
            }}
          />
          <span>Todos</span>
        </label>
        {ITEM_TYPES.map((t) => (
          <label key={t} className={optionLabelClass}>
            <Checkbox
              checked={typeRowChecked(t)}
              onCheckedChange={() => toggleType(t)}
            />
            <span>{ITEM_TYPE_CONFIG[t].label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const statusBlock = (
    <div className={sectionClass}>
      {isSidebar ? (
        <SidebarGroupLabel className="px-0">Status</SidebarGroupLabel>
      ) : (
        <Label className="text-xs text-muted-foreground">Status</Label>
      )}
      <div className={optionsClass}>
        <label className={optionLabelClass}>
          <Checkbox
            checked={allStatusesSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                onSelectedStatusesChange([]);
              } else {
                onSelectedStatusesChange([ITEM_STATUS_FILTER_VALUES[0]]);
              }
            }}
            disabled={showDeleted}
          />
          <span>Todos</span>
        </label>
        {STATUS_OPTIONS.map((o) => (
          <label key={o.value} className={optionLabelClass}>
            <Checkbox
              checked={statusRowChecked(o.value)}
              onCheckedChange={() => toggleStatus(o.value)}
              disabled={showDeleted}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const visibilityBlock = (
    <div className={sectionClass}>
      {isSidebar ? (
        <SidebarGroupLabel className="px-0">Visibilidade</SidebarGroupLabel>
      ) : (
        <Label className="text-xs text-muted-foreground">Visibilidade</Label>
      )}
      <div className={optionsClass}>
        {VISIBILITY_OPTIONS.map((o) => (
          <label key={o.value} className={optionLabelClass}>
            <Checkbox
              checked={visibility === o.value}
              onCheckedChange={(checked) => {
                if (checked) onVisibilityChange(o.value);
              }}
            />
            <span>{o.label}</span>
          </label>
        ))}
        <label className={optionLabelClass}>
          <Checkbox
            checked={visibility === "all"}
            onCheckedChange={(checked) => {
              if (checked) onVisibilityChange("all");
            }}
          />
          <span>Todos</span>
        </label>
      </div>
    </div>
  );

  const trashBlock = (
    <Button
      variant={showDeleted ? "destructive" : "outline"}
      size="sm"
      onClick={() => onShowDeletedChange(!showDeleted)}
      className={cn(
        showDeleted ? "" : "text-muted-foreground hover:text-foreground",
        isSidebar && "w-full justify-start",
      )}
    >
      <Trash2 className="h-4 w-4 mr-1.5 shrink-0" />
      {showDeleted ? "Sair da lixeira" : "Lixeira"}
    </Button>
  );

  if (isSidebar) {
    return (
      <SidebarGroup className="flex min-h-0 flex-1 flex-col border-t border-sidebar-border pt-2">
        <SidebarGroupLabel className="shrink-0 px-2">Filtros do banco</SidebarGroupLabel>
        <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 space-y-4">
          {searchBlock}
          {typeBlock}
          {statusBlock}
          {visibilityBlock}
          {trashBlock}
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {searchBlock}
      {typeBlock}
      {statusBlock}
      {visibilityBlock}
      {trashBlock}
    </div>
  );
}
