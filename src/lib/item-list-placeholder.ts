import type { QueryClient } from "@tanstack/react-query";
import type { RouterInputs, RouterOutputs } from "~/trpc/react";

type ListInput = RouterInputs["item"]["list"];
type ListOutput = RouterOutputs["item"]["list"];
type ItemRow = ListOutput["items"][number];

function isItemListQueryKey(key: unknown): boolean {
  if (!Array.isArray(key) || key.length === 0) return false;
  const head: unknown = key[0];
  if (!Array.isArray(head) || head.length < 2) return false;
  return head[0] === "item" && head[1] === "list";
}

export function itemMatchesListFilters(item: ItemRow, input: ListInput): boolean {
  if (input.organizationId) {
    if (item.organizationId !== input.organizationId) return false;
  } else if (item.organizationId != null) {
    return false;
  }

  if (input.showDeleted) {
    if (!item.deletedAt) return false;
  } else if (item.deletedAt) {
    return false;
  }

  if (input.types?.length) {
    const types = input.types;
    if (!types.includes(item.type as (typeof types)[number])) return false;
  }
  if (input.statuses?.length) {
    const statuses = input.statuses;
    if (!statuses.includes(item.status as (typeof statuses)[number])) return false;
  }
  if (input.visibility === "public" && !item.isPublic) return false;
  if (input.visibility === "private" && item.isPublic) return false;

  if (input.search?.trim()) {
    const t = input.search.trim().toLowerCase();
    const idOk = item.id.toLowerCase().includes(t);
    const stmtOk = JSON.stringify(item.statement ?? {}).toLowerCase().includes(t);
    if (!idOk && !stmtOk) return false;
  }

  return true;
}

function itemSortTime(item: ItemRow): number {
  const u = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
  const c = item.createdAt ? new Date(item.createdAt).getTime() : 0;
  return u || c;
}

function sortItemsLikeServer(items: ItemRow[]): ItemRow[] {
  return [...items].sort((a, b) => {
    const ua = itemSortTime(a);
    const ub = itemSortTime(b);
    if (ub !== ua) return ub - ua;
    const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return cb - ca;
  });
}

/**
 * Builds placeholder list data from all successful item.list caches plus the
 * previous query result, filtered/sorted like the server so filter transitions
 * feel instant while the network catches up.
 */
export function buildItemListPlaceholderFromCache(
  queryClient: QueryClient,
  input: ListInput,
  previousData: ListOutput | undefined,
): ListOutput | undefined {
  const byId = new Map<string, ItemRow>();

  const queries = queryClient.getQueryCache().findAll({
    predicate: (q) => isItemListQueryKey(q.queryKey),
  });

  for (const query of queries) {
    if (query.state.status !== "success") continue;
    const data = query.state.data as ListOutput | undefined;
    if (!data?.items?.length) continue;
    for (const item of data.items) {
      if (!itemMatchesListFilters(item, input)) continue;
      const existing = byId.get(item.id);
      if (!existing || itemSortTime(item) >= itemSortTime(existing)) {
        byId.set(item.id, item);
      }
    }
  }

  if (previousData?.items?.length) {
    for (const item of previousData.items) {
      if (!itemMatchesListFilters(item, input)) continue;
      const existing = byId.get(item.id);
      if (!existing || itemSortTime(item) >= itemSortTime(existing)) {
        byId.set(item.id, item);
      }
    }
  }

  const merged = sortItemsLikeServer([...byId.values()]);
  const total = merged.length;
  const limit = input.limit ?? 10;
  const offset = input.offset ?? 0;
  const items = merged.slice(offset, offset + limit);

  if (items.length === 0 && total === 0) {
    return undefined;
  }

  return {
    items,
    total,
    limit,
    offset,
  };
}
