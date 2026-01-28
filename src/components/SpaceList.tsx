"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Building2, User, Users } from "lucide-react";
import Link from "next/link";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { SelectSpaceButton } from "~/components/SelectSpaceButton";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface Group {
  id: string;
  name: string;
  organizationId: string;
}

interface SpaceListProps {
  userId: string;
  organizations: Organization[];
  groups: Group[];
}

export function SpaceList({ userId, organizations, groups }: SpaceListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get recent spaces (client-side only logic, but we need consistency so we use effect or rely on initial render matching)
  // Since we are in nextjs app dir client component, `document` might not be available during SSR.
  // We'll use a state initialized in useEffect to avoid hydration mismatch if cookies differ.
  const [recentSpaces, setRecentSpaces] = useState<any[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Dynamic import to avoid SSR issues if the lib uses document directly at top level (it guards, but safe to be sure)
    import("~/lib/recentSpaces").then(({ getRecentSpaces }) => {
      setRecentSpaces(getRecentSpaces());
    });
  }, []);

  // Filter spaces based on search query
  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    const query = searchQuery.toLowerCase();
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.slug.toLowerCase().includes(query),
    );
  }, [organizations, searchQuery]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter((group) => group.name.toLowerCase().includes(query));
  }, [groups, searchQuery]);

  const showPersonalSpace = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      "meu espaço pessoal".includes(query) ||
      "pessoal".includes(query) ||
      "meu".includes(query)
    );
  }, [searchQuery]);

  // COMBINED LIST LOGIC
  const combinedSpaces = useMemo(() => {
    const list: { type: "user" | "organization" | "group"; id: string; name: string }[] = [];
    
    // Always add personal space if it matches
    if (showPersonalSpace) {
      list.push({ type: "user", id: userId, name: "Meu Espaço Pessoal" });
    }

    filteredOrgs.forEach(o => list.push({ type: "organization", id: o.id, name: o.name }));
    filteredGroups.forEach(g => list.push({ type: "group", id: g.id, name: g.name }));
    
    return list;
  }, [showPersonalSpace, userId, filteredOrgs, filteredGroups]);


  // Determine what to show
  // If Searching -> Show all matches
  // If Not Searching -> Show Recent (top 3) OR Default (top 3 combined)
  const isSearching = searchQuery.trim().length > 0;

  const visibleSpaces = useMemo(() => {
      if (isSearching) return combinedSpaces;

      // Logic for "Default View"
      if (!hasMounted) return combinedSpaces.slice(0, 3); // Initial hydration safe state

      if (recentSpaces.length > 0) {
          // Filter recent spaces to ensure they still exist in our valid lists (permission check implicit)
          // We map recent cookie data to actual available space data
          const validRecents = recentSpaces
            .map(r => {
                if (r.kind === 'user' && r.id === userId) return { ...r, type: 'user', name: "Meu Espaço Pessoal" };
                if (r.kind === 'organization') {
                    const org = organizations.find(o => o.id === r.id);
                    if (org) return { ...r, type: 'organization', name: org.name };
                }
                if (r.kind === 'group') {
                    const grp = groups.find(g => g.id === r.id);
                    if (grp) return { ...r, type: 'group', name: grp.name };
                }
                return null;
            })
            .filter(Boolean) as typeof combinedSpaces;
            
          if (validRecents.length > 0) return validRecents.slice(0, 3);
      }

      // If no recents, show top 3 available
      return combinedSpaces.slice(0, 3);

  }, [isSearching, combinedSpaces, recentSpaces, hasMounted, userId, organizations, groups]);


  const hasResults = visibleSpaces.length > 0;

  return (
    <div className="flex flex-col h-full max-h-[60vh] w-full max-w-md">
       <div className="flex-none mb-4">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
                type="text"
                placeholder="Buscar espaços..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                autoFocus={false}
            />
            </div>
       </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-2 min-h-0">
        {!hasResults ? (
            <div className="py-8 px-4 text-center">
            <p className="text-sm text-gray-500">
                Nenhum espaço encontrado para &ldquo;{searchQuery}&rdquo;
            </p>
            </div>
        ) : (
            <>
                 {/* Optional Header if needed, e.g. "Recentes" vs "Resultados" */}
                {!isSearching && recentSpaces.length > 0 && hasMounted && (
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 pl-1">
                        Últimos Acessados
                    </h3>
                )}
                
                {visibleSpaces.map((space) => (
                     <SelectSpaceButton
                        key={`${space.type}-${space.id}`}
                        kind={space.type}
                        id={space.id}
                        label={space.name}
                     />
                ))}

                {/* Show create org button only if searching and no results (already handled above) OR if list is short? 
                    The requirement says "Maybe only the tree last accessed... That's why we have a search input."
                    So we hide the create button from the main list usually to keep it clean, or put it at bottom.
                */}
            </>
        )}
      </div>
      
      {/* Footer Actions (Fixed at bottom of card) */}
      <div className="flex-none pt-4 border-t border-gray-100 mt-4">
        <Link href="/organization/new">
            <Button variant="ghost" size="sm" className="w-full text-gray-500 hover:text-gray-900">
                <Plus className="mr-2 h-3 w-3" />
                Criar Nova Organização
            </Button>
        </Link>
      </div>

    </div>
  );
}
