"use client";

/**
 * Navigation Link with Prefetching
 *
 * Wraps Next.js Link to add prefetching for specific routes on hover.
 * Currently supports prefetching Item Bank data when user hovers.
 */

import { type ReactNode } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { useSpace } from "~/contexts/SpaceContext";
import { ITEM_BANK_CONFIG } from "~/lib/itemBankConfig";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function NavLink({ href, children, className }: NavLinkProps) {
  const { activeSpace } = useSpace();
  const utils = api.useUtils();

  const handleMouseEnter = () => {
    // Prefetch Item Bank data when hovering over its link
    if (href === "/dashboard/items") {
      const orgId = activeSpace?.kind === "organization" ? activeSpace.id : undefined;

      // Prefetch count (for scale detection)
      void utils.item.getCount.prefetch(
        { organizationId: orgId },
        { staleTime: ITEM_BANK_CONFIG.COUNT_CACHE_TIME_MS }
      );

      // Prefetch first page of items
      void utils.item.list.prefetch(
        {
          organizationId: orgId,
          limit: ITEM_BANK_CONFIG.DEFAULT_PAGE_SIZE * ITEM_BANK_CONFIG.PREFETCH_PAGES,
          offset: 0,
        },
        { staleTime: ITEM_BANK_CONFIG.STALE_TIME_MS }
      );
    }
  };

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </Link>
  );
}
