"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ITEM_BANK_LIST_PATH,
  parseStatusesFromParam,
  parseTrashFromParam,
  parseTypesFromParam,
  parseVisibilityFromParam,
  serializeItemBankQuery,
} from "~/lib/itemBankUrlParams";
import { useItemBankFilters } from "./ItemBankFiltersContext";

/**
 * Keeps item bank filter state and URL query params in sync on /dashboard/items.
 * Uses shallow replace (no full reload). Wrapped in Suspense by the dashboard layout
 * because useSearchParams() requires it in the App Router.
 */
export function ItemBankFiltersUrlSync() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applyingFromUrl = useRef(false);

  const {
    debouncedSearch,
    selectedTypes,
    selectedStatuses,
    visibilityFilter,
    showDeleted,
    syncSearchFromUrl,
    setSelectedTypes,
    setSelectedStatuses,
    setVisibilityFilter,
    setShowDeleted,
  } = useItemBankFilters();

  const paramsString = searchParams.toString();

  // URL → state (back/forward, shared links). Empty query leaves context as-is so
  // in-app navigation to /dashboard/items without params does not wipe filters.
  useEffect(() => {
    if (pathname !== ITEM_BANK_LIST_PATH) return;
    if (!searchParams.toString()) return;

    applyingFromUrl.current = true;
    syncSearchFromUrl(searchParams.get("q") ?? "");
    setSelectedTypes(parseTypesFromParam(searchParams.get("types")));
    setSelectedStatuses(parseStatusesFromParam(searchParams.get("status")));
    setVisibilityFilter(parseVisibilityFromParam(searchParams.get("visibility")));
    setShowDeleted(parseTrashFromParam(searchParams.get("trash")));

    queueMicrotask(() => {
      applyingFromUrl.current = false;
    });
  }, [
    pathname,
    paramsString,
    searchParams,
    syncSearchFromUrl,
    setSelectedTypes,
    setSelectedStatuses,
    setVisibilityFilter,
    setShowDeleted,
  ]);

  // State → URL (debounced search to avoid churn while typing)
  useEffect(() => {
    if (pathname !== ITEM_BANK_LIST_PATH) return;
    if (applyingFromUrl.current) return;

    const nextQs = serializeItemBankQuery({
      search: debouncedSearch,
      selectedTypes,
      selectedStatuses,
      visibilityFilter,
      showDeleted,
    });

    if (nextQs === paramsString) return;

    const href = nextQs ? `${ITEM_BANK_LIST_PATH}?${nextQs}` : ITEM_BANK_LIST_PATH;
    router.replace(href, { scroll: false });
  }, [
    pathname,
    paramsString,
    debouncedSearch,
    selectedTypes,
    selectedStatuses,
    visibilityFilter,
    showDeleted,
    router,
  ]);

  return null;
}
