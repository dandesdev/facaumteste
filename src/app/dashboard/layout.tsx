import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "~/server/supabaseServer";
import { db } from "~/server/db";
import { organizations, users, orgGroups, orgGroupMembers } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import LogoutButton from "~/components/LogoutButton";
import { SpaceSwitcher } from "~/components/SpaceSwitcher";
import { SpaceProvider } from "~/contexts/SpaceContext";
import { SidebarNav } from "~/components/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const activeSpaceCookie = cookieStore.get("active_space");

  if (!activeSpaceCookie) {
    redirect("/select-space");
  }

  let activeSpace: { kind: "organization" | "user" | "group"; id: string };
  try {
    activeSpace = JSON.parse(activeSpaceCookie.value) as typeof activeSpace;
  } catch {
    redirect("/select-space");
  }

  // Fetch details about the space
  let spaceName = "Meu Espaço";
  let isPersonal = true;

  if (activeSpace.kind === "organization") {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, activeSpace.id),
    });
    if (org) {
      spaceName = org.name;
      isPersonal = false;
    } else {
      redirect("/select-space");
    }
  } else if (activeSpace.kind === "group") {
    const group = await db.query.orgGroups.findFirst({
      where: eq(orgGroups.id, activeSpace.id),
    });
    if (group) {
      spaceName = group.name;
      isPersonal = false;
    } else {
      redirect("/select-space");
    }
  } else if (activeSpace.kind === "user") {
    const user = await db.query.users.findFirst({
      where: eq(users.id, activeSpace.id),
    });
    if (user) {
      spaceName = user.name ?? "Meu Espaço";
    }
  }

  // Fetch groups for the SpaceSwitcher
  const userGroups = await db
    .select({
      id: orgGroups.id,
      name: orgGroups.name,
      organizationId: orgGroups.organizationId,
    })
    .from(orgGroupMembers)
    .innerJoin(orgGroups, eq(orgGroups.id, orgGroupMembers.groupId))
    .where(eq(orgGroupMembers.userId, data.user.id));

  const navigationItems = [
    { href: "/dashboard", iconName: "LayoutDashboard", label: "Início" },
    { href: "/dashboard/evaluations", iconName: "FileText", label: "Testes" },
    { href: "/dashboard/items", iconName: "Database", label: "Banco de Itens" },
    ...(!isPersonal
      ? [{ href: "/dashboard/settings", iconName: "Settings", label: "Configurações" }]
      : []),
  ];

  return (
    <SpaceProvider activeSpace={{ kind: activeSpace.kind, id: activeSpace.id, name: spaceName }}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SpaceSwitcher
              currentSpace={{
                kind: activeSpace.kind,
                id: activeSpace.id,
                name: spaceName,
              }}
              userId={data.user.id}
              groups={userGroups}
            />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarNav items={navigationItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <LogoutButton />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b px-6 lg:h-[60px]">
            <SidebarTrigger className="-ml-2" />
            <div className="flex-1" />
          </header>
          <div className="container mx-auto p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </SpaceProvider>
  );
}
