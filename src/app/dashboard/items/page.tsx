"use client";

/**
 * Item Bank Page
 * Lists all items with filtering, pagination, and view toggle
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { useSpace } from "~/contexts/SpaceContext";
import {
  ItemCard,
  ItemsFilters,
  ItemsSkeleton,
  ItemsTable,
  SelectionCheckbox,
  type ItemType,
} from "~/components/items";

type ViewMode = "cards" | "table";
type StatusFilter = "all" | "draft" | "published" | "archived" | "deleted";

const PAGE_SIZES = [5, 10, 20] as const;

export default function ItemsPage() {
  // View preferences
  const [view, setView] = useState<ViewMode>("cards");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Selection - array for ordering
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState(""); // For type-to-confirm permanent delete

  // Space from context (provided by server layout)
  const { activeSpace } = useSpace();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [search, typeFilter, statusFilter, pageSize]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Calculate offset for prefetching (2-3 pages ahead)
  const prefetchMultiplier = 3;
  const fetchLimit = pageSize * prefetchMultiplier;
  const fetchOffset = Math.floor(currentPage / prefetchMultiplier) * fetchLimit;

  // Fetch items
  const { data, isLoading, isFetching } = api.item.list.useQuery({
    organizationId: activeSpace.kind === "organization" ? activeSpace.id : undefined,
    type: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    limit: fetchLimit,
    offset: fetchOffset,
  });

  // Mutations with optimistic updates
  const utils = api.useUtils();

  const deleteManyMutation = api.item.deleteMany.useMutation({
    onMutate: async ({ ids }) => {
      // Cancel any outgoing refetches
      await utils.item.list.cancel();
      // Optimistically remove from selection and UI will hide them
      setSelectedIds([]);
    },
    onSuccess: (result) => {
      // Refetch to get fresh data
      void utils.item.list.invalidate();
      // Show success toast with undo
      toast.success(`${result.count} ${result.count === 1 ? "item excluído" : "itens excluídos"}`, {
        action: {
          label: "Desfazer",
          onClick: () => {
            restoreMutation.mutate({ ids: result.items.map((i) => i.id) });
          },
        },
        duration: 5000,
      });
    },
    onError: (error) => {
      // Revert on error
      void utils.item.list.invalidate();
      toast.error("Erro ao excluir itens", { description: error.message });
    },
  });

  const restoreMutation = api.item.restore.useMutation({
    onMutate: async () => {
      await utils.item.list.cancel();
      setSelectedIds([]);
    },
    onSuccess: (result) => {
      void utils.item.list.invalidate();
      toast.success(`${result.count} ${result.count === 1 ? "item restaurado" : "itens restaurados"}`);
    },
    onError: (error) => {
      void utils.item.list.invalidate();
      toast.error("Erro ao restaurar itens", { description: error.message });
    },
  });

  const permanentDeleteMutation = api.item.permanentDelete.useMutation({
    onMutate: async () => {
      await utils.item.list.cancel();
      setSelectedIds([]);
      setConfirmText(""); // Reset confirm text
    },
    onSuccess: (result) => {
      void utils.item.list.invalidate();
      toast.success(`${result.count} ${result.count === 1 ? "item excluído permanentemente" : "itens excluídos permanentemente"}`);
    },
    onError: (error) => {
      void utils.item.list.invalidate();
      toast.error("Erro ao excluir permanentemente", { description: error.message });
    },
  });

  // Check if viewing deleted items (trash)
  const isViewingTrash = statusFilter === "deleted";

  // Get items for current page from prefetched data
  const pageItems = useMemo(() => {
    if (!data?.items) return [];
    const localOffset = (currentPage * pageSize) - fetchOffset;
    return data.items.slice(localOffset, localOffset + pageSize);
  }, [data?.items, currentPage, pageSize, fetchOffset]);

  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  // Selection helpers
  const getSelectionOrder = useCallback((id: string): number | undefined => {
    const index = selectedIds.indexOf(id);
    return index >= 0 ? index + 1 : undefined;
  }, [selectedIds]);

  const isPartialSelection = selectedIds.length > 0 && selectedIds.length < pageItems.length;
  const isAllSelected = pageItems.length > 0 && pageItems.every((item) => selectedIds.includes(item.id));

  // Selection handlers
  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      if (selected) {
        return [...prev, id];
      } else {
        return prev.filter((i) => i !== id);
      }
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      // Deselect all on this page
      setSelectedIds((prev) => prev.filter((id) => !pageItems.some((item) => item.id === id)));
    } else {
      // Select all on this page
      setSelectedIds((prev) => {
        const newIds = pageItems.map((item) => item.id).filter((id) => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  }, [pageItems, isAllSelected]);

  // Show delete confirmation dialog
  const handleDeleteClick = useCallback(() => {
    if (selectedIds.length === 0) return;
    setShowDeleteDialog(true);
  }, [selectedIds]);

  // Execute delete (soft or permanent based on current view)
  const confirmDelete = useCallback(() => {
    if (isViewingTrash) {
      permanentDeleteMutation.mutate({ ids: selectedIds });
    } else {
      deleteManyMutation.mutate({ ids: selectedIds });
    }
    setShowDeleteDialog(false);
  }, [selectedIds, isViewingTrash, deleteManyMutation, permanentDeleteMutation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl+A - Select all on current page
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        if (!isAllSelected && pageItems.length > 0) {
          handleSelectAll();
          toast.info(`${pageItems.length} itens selecionados`);
        }
      }

      // Delete key - Delete selected items
      if (e.key === "Delete" && selectedIds.length > 0) {
        e.preventDefault();
        handleDeleteClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageItems, isAllSelected, selectedIds, handleSelectAll, handleDeleteClick]);

  // Check if filters are active (to show different empty state message)
  const hasActiveFilters = typeFilter !== "all" || statusFilter !== "all" || debouncedSearch.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banco de Itens</h1>
          <p className="text-muted-foreground">
            {data?.total ?? 0} itens no {activeSpace.kind === "organization" ? `espaço ${activeSpace.name}` : "espaço pessoal"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/items/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Link>
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ItemsFilters
          search={search}
          onSearchChange={setSearch}
          type={typeFilter}
          onTypeChange={setTypeFilter}
          status={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={view === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("cards")}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              className="rounded-l-none"
            >
              <Table2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Page size */}
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection actions bar - fixed height to prevent layout shift */}
      <div className="flex items-center gap-3 px-3 bg-muted/50 rounded-md h-11">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <SelectionCheckbox
                  selected={isAllSelected}
                  indeterminate={isPartialSelection}
                  onSelect={isPartialSelection ? handleClearSelection : handleSelectAll}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isPartialSelection || isAllSelected ? "Limpar seleção" : "Selecionar todos"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <span className="text-sm font-medium min-w-[140px]">
          {selectedIds.length > 0
            ? `${selectedIds.length} ${selectedIds.length === 1 ? "item selecionado" : "itens selecionados"}`
            : "Selecione itens"}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled
          className={selectedIds.length === 0 ? "invisible" : ""}
        >
          Adicionar à avaliação
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`text-destructive hover:text-destructive ${selectedIds.length === 0 ? "invisible" : ""}`}
          onClick={handleDeleteClick}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Excluir
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <ItemsSkeleton count={3} view={view} />
      ) : pageItems.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          {hasActiveFilters ? (
            <>
              <p className="text-muted-foreground mb-2">Nenhum item encontrado com os filtros aplicados</p>
              <p className="text-sm text-muted-foreground mb-4">
                Tente ajustar os filtros ou limpar a busca
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
              >
                Limpar filtros
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">Nenhum item no banco ainda</p>
              <Button asChild variant="outline">
                <Link href="/dashboard/items/new">Criar primeiro item</Link>
              </Button>
            </>
          )}
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              selected={selectedIds.includes(item.id)}
              selectionOrder={getSelectionOrder(item.id)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : (
        <ItemsTable
          items={pageItems}
          selectedIds={selectedIds}
          getSelectionOrder={getSelectionOrder}
          onSelectChange={handleSelect}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Loading indicator for background fetch */}
      {isFetching && !isLoading && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm">
          Atualizando...
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isViewingTrash ? "Excluir permanentemente?" : "Excluir itens?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              {isViewingTrash ? (
                <div className="space-y-3">
                  <p className="text-destructive font-medium">
                    ⚠️ Esta ação não pode ser desfeita!
                  </p>
                  <p>
                    {selectedIds.length === 1
                      ? "Este item será excluído permanentemente do banco de dados."
                      : `${selectedIds.length} itens serão excluídos permanentemente do banco de dados.`}
                  </p>
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Digite <span className="font-mono font-bold">EXCLUIR</span> para confirmar:
                    </p>
                    <Input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="EXCLUIR"
                      className="max-w-[200px]"
                      autoComplete="off"
                    />
                  </div>
                </div>
              ) : (
                <p>
                  {selectedIds.length === 1
                    ? "Este item será movido para a lixeira. Você pode restaurá-lo depois se necessário."
                    : `${selectedIds.length} itens serão movidos para a lixeira. Você pode restaurá-los depois se necessário.`}
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isViewingTrash && confirmText !== "EXCLUIR"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {isViewingTrash ? "Excluir permanentemente" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


