"use client";

/**
 * Sidebar Navigation with Prefetching
 *
 * Client component that renders sidebar nav items with prefetch support.
 * Prefetches Item Bank data when user hovers over that link.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Database,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { api } from "~/trpc/react";
import { useSpace } from "~/contexts/SpaceContext";
import { ITEM_BANK_CONFIG } from "~/lib/itemBankConfig";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

// Map icon names to components (client-side only)
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  FileText,
  Database,
  Settings,
};

interface NavItem {
  href: string;
  iconName: string; // Changed from icon component to string name
  label: string;
}

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const { activeSpace } = useSpace();
  const utils = api.useUtils();

  const handleMouseEnter = (href: string) => {
    // Prefetch Item Bank data when hovering over its link
    if (href === "/dashboard/items") {
      const orgId = activeSpace?.kind === "organization" ? activeSpace.id : undefined;

      // Prefetch count (for scale detection)
      void utils.item.getCount.prefetch(
        { organizationId: orgId },
        { staleTime: ITEM_BANK_CONFIG.COUNT_CACHE_TIME_MS }
      );

      // Prefetch first pages of items
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
    <SidebarMenu>
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = ICON_MAP[item.iconName];
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              tooltip={item.label}
              isActive={isActive}
              asChild
            >
              <Link
                href={item.href}
                onMouseEnter={() => handleMouseEnter(item.href)}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
