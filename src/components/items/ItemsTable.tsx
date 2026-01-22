"use client";

/**
 * Items Table Component
 * shadcn DataTable for item bank with sorting and column visibility
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import { SelectionCheckbox } from "./SelectionCheckbox";
import { CopyableId } from "./CopyableId";
import { ITEM_TYPE_CONFIG, ITEM_STATUS_CONFIG } from "./item-utils";
import type { ItemType } from "./item-utils";

interface Item {
  id: string;
  type: string;
  status: string | null;
  statement: unknown;
  createdAt: Date;
  updatedAt: Date | null;
  creator?: { name: string | null } | null;
}

interface ItemsTableProps {
  items: Item[];
  selectedIds: string[];
  getSelectionOrder: (id: string) => number | undefined;
  onSelectChange: (id: string, selected: boolean) => void;
  onSelectAll: () => void;
}

type SortField = "type" | "updatedAt" | "createdAt" | "status";
type SortDir = "asc" | "desc";

const DEFAULT_COLUMNS = {
  select: true,
  itemId: true,
  type: true,
  statement: true,
  updatedAt: true,
  createdAt: false,
  creator: false,
  status: true,
};

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
        .slice(0, 100);
    }
  } catch {
    // Fallback
  }
  
  return "";
}

export function ItemsTable({
  items,
  selectedIds,
  getSelectionOrder,
  onSelectChange,
  onSelectAll,
}: ItemsTableProps) {
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleColumn = (col: keyof typeof columns) => {
    setColumns((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let aVal: string | number | Date = "";
    let bVal: string | number | Date = "";

    switch (sortField) {
      case "type":
        aVal = a.type;
        bVal = b.type;
        break;
      case "status":
        aVal = a.status ?? "";
        bVal = b.status ?? "";
        break;
      case "updatedAt":
        aVal = a.updatedAt ?? a.createdAt;
        bVal = b.updatedAt ?? b.createdAt;
        break;
      case "createdAt":
        aVal = a.createdAt;
        bVal = b.createdAt;
        break;
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));
  const someSelected = items.some((i) => selectedIds.includes(i.id));

  return (
    <div>
      {/* Column visibility */}
      <div className="flex justify-end mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Colunas <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              checked={columns.itemId}
              onCheckedChange={() => toggleColumn("itemId")}
            >
              ID
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.type}
              onCheckedChange={() => toggleColumn("type")}
            >
              Tipo
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.statement}
              onCheckedChange={() => toggleColumn("statement")}
            >
              Enunciado
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.updatedAt}
              onCheckedChange={() => toggleColumn("updatedAt")}
            >
              Modificado
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.createdAt}
              onCheckedChange={() => toggleColumn("createdAt")}
            >
              Criado
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.creator}
              onCheckedChange={() => toggleColumn("creator")}
            >
              Criador
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={columns.status}
              onCheckedChange={() => toggleColumn("status")}
            >
              Status
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.select && (
                <TableHead className="w-12">
                  <SelectionCheckbox
                    selected={allSelected}
                    indeterminate={someSelected && !allSelected}
                    onSelect={onSelectAll}
                  />
                </TableHead>
              )}
              {columns.itemId && (
                <TableHead className="w-[100px]">ID</TableHead>
              )}
              {columns.type && (
                <TableHead className="w-[140px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("type")}>
                    Tipo <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {columns.statement && <TableHead>Enunciado</TableHead>}
              {columns.updatedAt && (
                <TableHead className="w-[120px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("updatedAt")}>
                    Modificado <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {columns.createdAt && (
                <TableHead className="w-[120px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("createdAt")}>
                    Criado <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
              {columns.creator && <TableHead className="w-[140px]">Criador</TableHead>}
              {columns.status && (
                <TableHead className="w-[100px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort("status")}>
                    Status <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => {
              const typeConfig = ITEM_TYPE_CONFIG[item.type as ItemType];
              const statusKey = item.status ?? "draft";
              const statusConfig = ITEM_STATUS_CONFIG[statusKey] ?? ITEM_STATUS_CONFIG["draft"]!;
              const TypeIcon = typeConfig?.icon;
              const statementText = extractTextFromStatement(item.statement);
              const isSelected = selectedIds.includes(item.id);
              const order = getSelectionOrder(item.id);

              return (
                <TooltipProvider key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        {columns.select && (
                          <TableCell>
                            <SelectionCheckbox
                              selected={isSelected}
                              order={order}
                              onSelect={(sel) => onSelectChange(item.id, sel)}
                            />
                          </TableCell>
                        )}
                        {columns.itemId && (
                          <TableCell>
                            <CopyableId id={item.id} />
                          </TableCell>
                        )}
                        {columns.type && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {TypeIcon && <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />}
                              <span className="text-sm">{typeConfig?.label}</span>
                            </div>
                          </TableCell>
                        )}
                        {columns.statement && (
                          <TableCell className="max-w-[300px]">
                            <span className="truncate block text-sm">
                              {statementText || "Sem conteúdo"}
                            </span>
                          </TableCell>
                        )}
                        {columns.updatedAt && (
                          <TableCell className="text-sm text-muted-foreground">
                            {item.updatedAt
                              ? new Date(item.updatedAt).toLocaleDateString("pt-BR")
                              : "-"}
                          </TableCell>
                        )}
                        {columns.createdAt && (
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                        )}
                        {columns.creator && (
                          <TableCell className="text-sm">
                            {item.creator?.name ?? "-"}
                          </TableCell>
                        )}
                        {columns.status && (
                          <TableCell>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                statusConfig.variant === "default"
                                  ? "bg-primary text-primary-foreground"
                                  : statusConfig.variant === "secondary"
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {statusConfig.label}
                            </span>
                          </TableCell>
                        )}
                      </TableRow>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[400px]">
                      <p className="text-sm">{statementText || "Sem conteúdo"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
