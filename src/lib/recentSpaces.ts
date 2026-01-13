const RECENT_SPACES_COOKIE = "recent_spaces";
const MAX_RECENT_SPACES = 5;

export interface SpaceInfo {
    kind: "user" | "organization" | "group";
    id: string;
    name: string;
}

/**
 * Get the list of recent spaces from the cookie
 */
export function getRecentSpaces(): SpaceInfo[] {
    if (typeof document === "undefined") return [];

    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${RECENT_SPACES_COOKIE}=`));

    if (!cookie) return [];

    try {
        const value = decodeURIComponent(cookie.split("=")[1] ?? "");
        return JSON.parse(value) as SpaceInfo[];
    } catch {
        return [];
    }
}

/**
 * Add a space to the recent spaces list
 * Removes duplicates and keeps only the most recent MAX_RECENT_SPACES
 */
export function addRecentSpace(space: SpaceInfo): void {
    if (typeof document === "undefined") return;

    const recents = getRecentSpaces();

    // Remove if already exists (we'll add it to the front)
    const filtered = recents.filter(
        (s) => !(s.kind === space.kind && s.id === space.id)
    );

    // Add to front
    const updated = [space, ...filtered].slice(0, MAX_RECENT_SPACES);

    // Save to cookie (30 days expiry)
    document.cookie = `${RECENT_SPACES_COOKIE}=${encodeURIComponent(JSON.stringify(updated))}; path=/; max-age=${60 * 60 * 24 * 30}`;
}

/**
 * Check if a space is in the recent spaces list
 */
export function isRecentSpace(kind: string, id: string): boolean {
    const recents = getRecentSpaces();
    return recents.some((s) => s.kind === kind && s.id === id);
}
