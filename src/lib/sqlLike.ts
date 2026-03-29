/**
 * Escape \, %, and _ for SQL LIKE / ILIKE when using ESCAPE '\\' (PostgreSQL).
 */
export function escapeSqlLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
