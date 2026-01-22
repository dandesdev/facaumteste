/**
 * Item Bank Configuration
 *
 * Centralized constants for caching and prefetching behavior.
 * Tweak these values to experiment with different strategies.
 *
 * SCALE THRESHOLDS:
 * - Below SMALL_DATASET_THRESHOLD: Fetch all items once, filter client-side
 * - Between SMALL and MEDIUM: Hybrid (paginated fetch + client-side filter within cache)
 * - Above MEDIUM_DATASET_THRESHOLD: Full server-side pagination and filtering
 */

export const ITEM_BANK_CONFIG = {
  // --- Scale Thresholds ---
  /** Below this: fetch all items, filter client-side */
  SMALL_DATASET_THRESHOLD: 500,
  /** Above this: always use server-side pagination */
  MEDIUM_DATASET_THRESHOLD: 5000,

  // --- Pagination ---
  /** Default items per page */
  DEFAULT_PAGE_SIZE: 10,
  /** How many pages to prefetch ahead */
  PREFETCH_PAGES: 3,

  // --- Caching (React Query / tRPC) ---
  /**
   * Time in ms before data is considered stale.
   * While stale, React Query will refetch in background.
   * During this time, UI shows cached data immediately.
   */
  STALE_TIME_MS: 30_000, // 30 seconds

  /**
   * Time in ms to keep data in cache after it's no longer used.
   * Longer = better UX when navigating back, but uses more memory.
   */
  CACHE_TIME_MS: 5 * 60_000, // 5 minutes

  /**
   * Time in ms to cache the item count (for scale detection).
   * Count only needs to be roughly accurate, so cache longer.
   */
  COUNT_CACHE_TIME_MS: 10 * 60_000, // 10 minutes

  // --- Cookie Keys ---
  COOKIE_FILTERS: "item_bank_filters",
  COOKIE_PAGE_SIZE: "item_bank_page_size",
} as const;

// Type for the persisted filter preferences
export interface PersistedFilters {
  type?: string;
  status?: string;
  pageSize?: number;
}
