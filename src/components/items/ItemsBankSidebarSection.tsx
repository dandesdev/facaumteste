"use client";

import { usePathname } from "next/navigation";
import { useItemBankFilters } from "~/contexts/ItemBankFiltersContext";
import { useSidebar } from "~/components/ui/sidebar";
import { ItemsFilters } from "./ItemsFilters";

/**
 * Renders item-bank filters in the dashboard sidebar on the list route only.
 * Hidden when the sidebar is collapsed to icon rail.
 */
export function ItemsBankSidebarSection() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const filters = useItemBankFilters();

  if (pathname !== "/dashboard/items" || state === "collapsed") {
    return null;
  }

  return (
    <ItemsFilters
      variant="sidebar"
      search={filters.search}
      onSearchChange={filters.setSearch}
      selectedTypes={filters.selectedTypes}
      onSelectedTypesChange={filters.setSelectedTypes}
      selectedStatuses={filters.selectedStatuses}
      onSelectedStatusesChange={filters.setSelectedStatuses}
      visibility={filters.visibilityFilter}
      onVisibilityChange={filters.setVisibilityFilter}
      showDeleted={filters.showDeleted}
      onShowDeletedChange={filters.setShowDeleted}
    />
  );
}
