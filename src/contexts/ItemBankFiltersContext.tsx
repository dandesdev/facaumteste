"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ItemType } from "~/components/items/item-utils";
import type { VisibilityFilter } from "~/components/items/ItemsFilters";

export type ItemBankStatusOption = "draft" | "published" | "archived";

type ItemBankFiltersContextValue = {
  search: string;
  setSearch: (v: string) => void;
  /** Apply search from URL/navigation without waiting for debounce (keeps list query in sync). */
  syncSearchFromUrl: (v: string) => void;
  debouncedSearch: string;
  selectedTypes: ItemType[];
  setSelectedTypes: (v: ItemType[]) => void;
  selectedStatuses: ItemBankStatusOption[];
  setSelectedStatuses: (v: ItemBankStatusOption[]) => void;
  visibilityFilter: VisibilityFilter;
  setVisibilityFilter: (v: VisibilityFilter) => void;
  showDeleted: boolean;
  setShowDeleted: (v: boolean) => void;
  clearAllFilters: () => void;
};

const ItemBankFiltersContext = createContext<ItemBankFiltersContextValue | null>(null);

export function ItemBankFiltersProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<ItemType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ItemBankStatusOption[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const syncSearchFromUrl = useCallback((v: string) => {
    setSearch(v);
    setDebouncedSearch(v);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setVisibilityFilter("all");
  }, []);

  const value = useMemo(
    () => ({
      search,
      setSearch,
      syncSearchFromUrl,
      debouncedSearch,
      selectedTypes,
      setSelectedTypes,
      selectedStatuses,
      setSelectedStatuses,
      visibilityFilter,
      setVisibilityFilter,
      showDeleted,
      setShowDeleted,
      clearAllFilters,
    }),
    [
      search,
      syncSearchFromUrl,
      debouncedSearch,
      selectedTypes,
      selectedStatuses,
      visibilityFilter,
      showDeleted,
      clearAllFilters,
    ],
  );

  return (
    <ItemBankFiltersContext.Provider value={value}>{children}</ItemBankFiltersContext.Provider>
  );
}

export function useItemBankFilters() {
  const ctx = useContext(ItemBankFiltersContext);
  if (!ctx) {
    throw new Error("useItemBankFilters must be used within ItemBankFiltersProvider");
  }
  return ctx;
}
