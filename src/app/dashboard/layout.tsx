import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "~/server/supabaseServer";
import { db } from "~/server/db";
import { organizations, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Database,
  Settings,
  Building2,
  User,
  LogOut,
} from "lucide-react";
import LogoutButton from "~/components/LogoutButton";
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

  let activeSpace: { kind: "organization" | "user"; id: string };
  try {
    activeSpace = JSON.parse(activeSpaceCookie.value) as typeof activeSpace;
  } catch {
    redirect("/select-space");
  }

  // Fetch details about the space
  let spaceName = "Espaço Pessoal";
  let spaceIcon = <User className="h-4 w-4" />;
  let isPersonal = true;

  if (activeSpace.kind === "organization") {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, activeSpace.id),
    });
    if (org) {
      spaceName = org.name;
      isPersonal = false;
      spaceIcon = <Building2 className="h-4 w-4" />;
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

  const navigationItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/dashboard/evaluations", icon: FileText, label: "Avaliações" },
    { href: "/dashboard/items", icon: Database, label: "Banco de Itens" },
    ...(!isPersonal
      ? [{ href: "/dashboard/settings", icon: Settings, label: "Configurações" }]
      : []),
  ];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip="Trocar espaço" asChild>
                <Link href="/select-space">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    {spaceIcon}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">{spaceName}</span>
                    <span className="text-xs text-muted-foreground">
                      Trocar espaço
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton tooltip={item.label} asChild>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
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
        <div className="container mx-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
