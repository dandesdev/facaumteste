"use client";

import { useState, useMemo } from "react";
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

  const totalSpaces = organizations.length + groups.length + 1;
  const showSearch = totalSpaces > 5;

  const hasResults =
    showPersonalSpace || filteredOrgs.length > 0 || filteredGroups.length > 0;

  return (
    <div className="space-y-6">
      {/* Search - only show if many spaces */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar espaços..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {!hasResults ? (
        <div className="p-4 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Nenhum espaço encontrado para &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      ) : (
        <>
          {/* 1. Espaço Pessoal */}
          {showPersonalSpace && (
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
                <User className="h-3 w-3" />
                Pessoal
              </h2>
              <SelectSpaceButton
                kind="user"
                id={userId}
                label="Meu Espaço Pessoal"
              />
            </div>
          )}

          {/* 2. Organizações */}
          {(filteredOrgs.length > 0 || !searchQuery) && (
            <div className="space-y-2">
              <h2 className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
                <span className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  Organizações
                </span>
                <Link
                  href="/organization/new"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </Link>
              </h2>

              {filteredOrgs.length > 0 ? (
                <div className="space-y-2">
                  {filteredOrgs.map((org) => (
                    <SelectSpaceButton
                      key={org.id}
                      kind="organization"
                      id={org.id}
                      label={org.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-center">
                  <p className="text-sm text-gray-500 mb-3">
                    {searchQuery
                      ? "Nenhuma organização encontrada"
                      : "Nenhuma organização"}
                  </p>
                  {!searchQuery && (
                    <Link href="/organization/new">
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="mr-2 h-3 w-3" />
                        Criar Nova Organização
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Grupos */}
          {filteredGroups.length > 0 && (
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
                <Users className="h-3 w-3" />
                Grupos
              </h2>
              <div className="space-y-2">
                {filteredGroups.map((group) => (
                  <SelectSpaceButton
                    key={group.id}
                    kind="group"
                    id={group.id}
                    label={group.name}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
