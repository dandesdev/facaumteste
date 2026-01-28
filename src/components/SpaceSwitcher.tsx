"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  User,
  Users,
  ArrowRight,
} from "lucide-react";
import { api } from "~/trpc/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import {
  addRecentSpace,
  getRecentSpaces,
  type SpaceInfo,
} from "~/lib/recentSpaces";

interface Group {
  id: string;
  name: string;
  organizationId: string;
}

interface SpaceSwitcherProps {
  currentSpace: {
    kind: "user" | "organization" | "group";
    id: string;
    name: string;
  };
  userId: string;
  userName?: string;
  groups?: Group[];
}

export function SpaceSwitcher({
  currentSpace,
  userId,
  userName = "Meu Espaço",
  groups = [],
}: SpaceSwitcherProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { data: organizations } = api.organization.list.useQuery();
  const [recentSpaces, setRecentSpaces] = useState<SpaceInfo[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  // Load recent spaces on mount
  useEffect(() => {
    setRecentSpaces(getRecentSpaces());
  }, []);

  // Track current space as recent on mount
  useEffect(() => {
    addRecentSpace(currentSpace);
    setRecentSpaces(getRecentSpaces());
  }, [currentSpace]);

  const handleSpaceChange = async (
    kind: "user" | "organization" | "group",
    id: string,
    name: string,
  ) => {
    // Show loading state
    setIsSwitching(true);
    setSwitchingTo(name);

    // Add to recent spaces
    addRecentSpace({ kind, id, name });

    // Use the API to set the cookie (httpOnly cookie that server can read)
    try {
      await fetch("/api/set-active-space", {
        method: "POST",
        body: JSON.stringify({ kind, id }),
        headers: { "Content-Type": "application/json" },
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch space:", error);
      setIsSwitching(false);
      setSwitchingTo(null);
    }
  };

  const getSpaceIcon = (kind: string) => {
    switch (kind) {
      case "organization":
        return <Building2 className="size-4 shrink-0" />;
      case "group":
        return <Users className="size-4 shrink-0" />;
      default:
        return <User className="size-4 shrink-0" />;
    }
  };

  const getSpaceLabel = () => {
    switch (currentSpace.kind) {
      case "organization":
        return "Organização";
      case "group":
        return "Grupo";
      default:
        return "Pessoal";
    }
  };

  // Get recent organizations and groups (sorted by most recent access)
  const recentOrgIds = recentSpaces
    .filter((s) => s.kind === "organization")
    .map((s) => s.id);

  const recentGroupIds = recentSpaces
    .filter((s) => s.kind === "group")
    .map((s) => s.id);

  // Sort organizations by recent access, then take top 3
  const sortedOrgs = [...(organizations ?? [])].sort((a, b) => {
    const aIndex = recentOrgIds.indexOf(a.organization.id);
    const bIndex = recentOrgIds.indexOf(b.organization.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  const displayedOrgs = sortedOrgs.slice(0, 3);
  const hasMoreOrgs = (organizations?.length ?? 0) > 3;

  // Sort groups by recent access, then take top 3
  const sortedGroups = [...groups].sort((a, b) => {
    const aIndex = recentGroupIds.indexOf(a.id);
    const bIndex = recentGroupIds.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  const displayedGroups = sortedGroups.slice(0, 3);
  const hasMoreGroups = groups.length > 3;

  return (
    <>
      {/* Full-page loading overlay */}
      {isSwitching && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Acessando {switchingTo}...
            </p>
          </div>
        </div>
      )}

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isSwitching}>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  {getSpaceIcon(currentSpace.kind)}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {currentSpace.name}
                  </span>
                  <span className="truncate text-xs opacity-60 pt-[0.5]">
                    {getSpaceLabel()}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-sidebar backdrop-blur-sm"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuItem
                onClick={() => handleSpaceChange("user", userId, userName)}
                className="gap-2 p-2"
                disabled={isSwitching}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <User className="size-4 shrink-0" />
                </div>
                Meu Espaço
                {currentSpace.kind === "user" && currentSpace.id === userId && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>

              {/* Organizations */}
              {displayedOrgs.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {hasMoreOrgs
                      ? "Acessadas por último"
                      : "Organizações"}
                  </DropdownMenuLabel>
                  {displayedOrgs.map((org) => (
                    <DropdownMenuItem
                      key={org.organization.id}
                      onClick={() =>
                        handleSpaceChange(
                          "organization",
                          org.organization.id,
                          org.organization.name,
                        )
                      }
                      className="gap-2 p-2"
                      disabled={isSwitching}
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Building2 className="size-4 shrink-0" />
                      </div>
                      <span className="truncate">{org.organization.name}</span>
                      {currentSpace.kind === "organization" &&
                        currentSpace.id === org.organization.id && (
                          <Check className="ml-auto size-4" />
                        )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* Groups */}
              {displayedGroups.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {hasMoreGroups
                      ? "Grupos acessados por último"
                      : "Grupos"}
                  </DropdownMenuLabel>
                  {displayedGroups.map((group) => (
                    <DropdownMenuItem
                      key={group.id}
                      onClick={() =>
                        handleSpaceChange("group", group.id, group.name)
                      }
                      className="gap-2 p-2"
                      disabled={isSwitching}
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Users className="size-4 shrink-0" />
                      </div>
                      <span className="truncate">{group.name}</span>
                      {currentSpace.kind === "group" &&
                        currentSpace.id === group.id && (
                          <Check className="ml-auto size-4" />
                        )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* Actions */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/organization/new")}
                className="gap-2 p-2"
                disabled={isSwitching}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Plus className="size-4" />
                </div>
                Nova Organização
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/select-space")}
                className="gap-2 p-2"
                disabled={isSwitching}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <ArrowRight className="size-4" />
                </div>
                Todos os espaços
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
