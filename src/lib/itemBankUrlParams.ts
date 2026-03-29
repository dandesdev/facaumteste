import { ITEM_TYPES, type ItemType } from "~/components/items/item-utils";
import {
  ITEM_STATUS_FILTER_VALUES,
  type VisibilityFilter,
} from "~/components/items/ItemsFilters";

export type ItemBankStatusInUrl = (typeof ITEM_STATUS_FILTER_VALUES)[number];

export const ITEM_BANK_LIST_PATH = "/dashboard/items";

const TYPE_SET = new Set<string>(ITEM_TYPES);
const STATUS_SET = new Set<string>(ITEM_STATUS_FILTER_VALUES);

export function parseTypesFromParam(raw: string | null): ItemType[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ItemType => TYPE_SET.has(s));
}

export function parseStatusesFromParam(raw: string | null): ItemBankStatusInUrl[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ItemBankStatusInUrl => STATUS_SET.has(s));
}

export function parseVisibilityFromParam(raw: string | null): VisibilityFilter {
  if (raw === "public" || raw === "private" || raw === "all") return raw;
  return "all";
}

export function parseTrashFromParam(raw: string | null): boolean {
  return raw === "1" || raw === "true" || raw === "yes";
}

export function serializeItemBankQuery(input: {
  search: string;
  selectedTypes: ItemType[];
  selectedStatuses: ItemBankStatusInUrl[];
  visibilityFilter: VisibilityFilter;
  showDeleted: boolean;
}): string {
  const p = new URLSearchParams();
  const q = input.search.trim();
  if (q) p.set("q", q);

  if (
    input.selectedTypes.length > 0 &&
    input.selectedTypes.length < ITEM_TYPES.length
  ) {
    p.set("types", input.selectedTypes.join(","));
  }

  if (
    input.selectedStatuses.length > 0 &&
    input.selectedStatuses.length < ITEM_STATUS_FILTER_VALUES.length
  ) {
    p.set("status", input.selectedStatuses.join(","));
  }

  if (input.visibilityFilter !== "all") {
    p.set("visibility", input.visibilityFilter);
  }

  if (input.showDeleted) {
    p.set("trash", "1");
  }

  return p.toString();
}
